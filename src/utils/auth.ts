import { UserProfile, PlanType } from '../types';
import {
  validateEmail,
  validatePassword,
  validateName,
  sanitizeEmail,
  sanitizePassword,
  sanitizeName,
  AUTH_LIMITS,
  hashPassword,
  verifyPassword,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from './security';
import {
  supabase,
  isSupabaseConfigured,
  mapSupabaseToUserProfile,
  syncProfileToSupabase,
  fetchProfileFromSupabase,
} from './supabase';

const AUTH_STORAGE_KEY = 'bgremover_user_v1';
const AUTH_TOKEN_KEY = 'bgremover_auth_token';
const ACCOUNTS_DB_KEY = 'bgremover_accounts_db';
const AUTH_CHANGE_EVENT = 'bgremover_auth_change';

// Production Google OAuth Client ID
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '909542656684-production.apps.googleusercontent.com';

interface StoredAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  plan: PlanType;
  credits: number;
  dailyFreeCredits: number;
  paidCredits: number;
  planCredits: number;
  proExpiresAt?: string | null;
  lastResetDate?: string;
  isPro: boolean;
  createdAt: string;
  provider: 'google' | 'password' | 'supabase' | 'firebase' | 'custom';
}

function setAuthCookie(name: string, value: string, days = 30) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
  } catch (e) {
    // Silently ignore in non-cookie environments
  }
}

function clearAuthCookie(name: string) {
  try {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax; Secure`;
  } catch (e) {
    // Silently ignore
  }
}

function getAccountsDB(): Record<string, StoredAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_DB_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccountsDB(db: Record<string, StoredAccount>): void {
  try {
    localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(db));
  } catch (err) {
    console.warn('Failed to save accounts database:', err);
  }
}

function generateToken(userId: string, email: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      jti: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    })
  );
  const signature = btoa(`sig_${userId}_${Math.floor(Date.now() / 10000)}`);
  return `${header}.${payload}.${signature}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates total available credits for a user profile across all pools.
 */
export function calculateTotalCredits(user: {
  dailyFreeCredits?: number;
  paidCredits?: number;
  planCredits?: number;
  isPro?: boolean;
  plan?: PlanType;
}): number {
  if (user.isPro && user.plan === 'unlimited') {
    return 9999;
  }
  const daily = typeof user.dailyFreeCredits === 'number' ? user.dailyFreeCredits : 3;
  const plan = typeof user.planCredits === 'number' ? user.planCredits : 0;
  const paid = typeof user.paidCredits === 'number' ? user.paidCredits : 0;
  return daily + plan + paid;
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as UserProfile;
    if (!user) return null;

    let hasMutated = false;
    const today = getTodayDateString();

    // 1. Ensure Multi-Pool Default Fields Exist
    if (typeof user.dailyFreeCredits !== 'number') {
      user.dailyFreeCredits = 3;
      hasMutated = true;
    }
    if (typeof user.paidCredits !== 'number') {
      user.paidCredits = user.plan === 'payg' ? (user.credits || 0) : 0;
      hasMutated = true;
    }
    if (typeof user.planCredits !== 'number') {
      user.planCredits = user.plan === 'lite' ? 40 : user.plan === 'pro' ? 200 : user.plan === 'unlimited' ? 9999 : 0;
      hasMutated = true;
    }
    if (!user.lastResetDate) {
      user.lastResetDate = today;
      hasMutated = true;
    }

    // 2. Midnight Daily Quota Reset (for ALL account types: Free, Lite, Pro, Unlimited, PAYG)
    if (user.lastResetDate !== today) {
      user.dailyFreeCredits = 3;
      user.lastResetDate = today;
      hasMutated = true;
    }

    // 3. Strict Subscription Expiration Check: pro_expires_at < NOW()
    if (user.proExpiresAt) {
      const expiryTimestamp = new Date(user.proExpiresAt).getTime();
      if (!isNaN(expiryTimestamp) && expiryTimestamp < Date.now()) {
        // Subscription has expired -> degrade status back to free or payg
        const isSubscriptionPlan = user.plan === 'lite' || user.plan === 'pro' || user.plan === 'unlimited';
        if (isSubscriptionPlan || user.isPro) {
          user.isPro = false;
          user.planCredits = 0;
          user.proExpiresAt = null;
          user.plan = (user.paidCredits || 0) > 0 ? 'payg' : 'free';
          hasMutated = true;
        }
      }
    }

    // 4. Recompute total credits
    const computedTotal = calculateTotalCredits(user);
    if (user.credits !== computedTotal) {
      user.credits = computedTotal;
      hasMutated = true;
    }

    // 5. Persist updates if any mutations occurred
    if (hasMutated) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      if (isSupabaseConfigured()) {
        syncProfileToSupabase(user).catch(() => {});
      }
    }

    return user;
  } catch (err) {
    console.warn('Failed to parse current user from localStorage:', err);
    return null;
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: UserProfile | null): void {
  try {
    if (user) {
      const today = getTodayDateString();
      const dailyFree = typeof user.dailyFreeCredits === 'number' ? user.dailyFreeCredits : 3;
      const paid = typeof user.paidCredits === 'number' ? user.paidCredits : 0;
      const planCr = typeof user.planCredits === 'number' ? user.planCredits : 0;
      const totalCredits = calculateTotalCredits(user);

      const sanitizedUser: UserProfile = {
        ...user,
        dailyFreeCredits: dailyFree,
        paidCredits: paid,
        planCredits: planCr,
        credits: totalCredits,
        lastResetDate: user.lastResetDate || today,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sanitizedUser));
      if (sanitizedUser.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, sanitizedUser.token);
        setAuthCookie(AUTH_TOKEN_KEY, sanitizedUser.token);
      }

      // Sync account record
      const accounts = getAccountsDB();
      const normalizedEmail = sanitizedUser.email.toLowerCase().trim();
      const existingAccount = accounts[normalizedEmail];
      accounts[normalizedEmail] = {
        id: sanitizedUser.id,
        email: normalizedEmail,
        passwordHash: existingAccount?.passwordHash || 'oauth_managed_credential',
        name: sanitizedUser.name,
        avatar: sanitizedUser.avatar,
        plan: sanitizedUser.plan,
        credits: sanitizedUser.credits,
        dailyFreeCredits: sanitizedUser.dailyFreeCredits,
        paidCredits: sanitizedUser.paidCredits,
        planCredits: sanitizedUser.planCredits,
        isPro: sanitizedUser.isPro,
        proExpiresAt: sanitizedUser.proExpiresAt,
        lastResetDate: sanitizedUser.lastResetDate,
        createdAt: sanitizedUser.createdAt,
        provider: sanitizedUser.provider || 'google',
      };
      saveAccountsDB(accounts);

      // Also asynchronously sync to Supabase database table if configured
      if (isSupabaseConfigured()) {
        syncProfileToSupabase(sanitizedUser).catch((err) => {
          console.warn('[Supabase Sync] Warning:', err);
        });
      }

      window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: sanitizedUser }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      clearAuthCookie(AUTH_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: null }));
    }
  } catch (err) {
    console.warn('Failed to save user state:', err);
  }
}

// ============================================================================
// 1. SUPABASE & GOOGLE OAUTH 2.0 INTEGRATION
// ============================================================================

export interface GoogleAuthOptions {
  prompt?: 'select_account' | 'consent' | 'none';
  clientId?: string;
}

function waitForGoogleIdentitySDK(timeoutMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

export async function signInWithGoogle(options: GoogleAuthOptions = { prompt: 'select_account' }): Promise<UserProfile> {
  const promptMode = options.prompt || 'select_account';
  const clientId = options.clientId || GOOGLE_CLIENT_ID;

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: promptMode,
            access_type: 'offline',
          },
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });

      if (error) {
        console.warn('[Supabase OAuth] Notice:', error.message);
      } else if (data?.url) {
        return new Promise<UserProfile>(() => {
          window.location.href = data.url;
        });
      }
    } catch (sbErr) {
      console.warn('[Supabase OAuth] Falling back to standard Google Identity Services:', sbErr);
    }
  }

  await waitForGoogleIdentitySDK(3000);

  return new Promise<UserProfile>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (response) => {
            if (response.error) {
              console.error('[Google OAuth] Error response:', response);
              reject(new Error(response.error_description || response.error));
              return;
            }

            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });

              if (!res.ok) {
                throw new Error('Failed to retrieve Google profile information.');
              }

              const googleData = await res.json();
              const userEmail = (googleData.email || '').toLowerCase().trim();
              const userName = googleData.name || userEmail.split('@')[0] || 'Google User';
              const userAvatar = googleData.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userEmail)}`;

              let userId = 'usr_g_' + (googleData.sub || Math.random().toString(36).substring(2, 9));
              let plan: PlanType = 'free';
              let dailyFreeCredits = 3;
              let paidCredits = 0;
              let planCredits = 0;
              let isPro = false;
              let proExpiresAt: string | null = null;
              let createdAt = new Date().toISOString();
              const today = getTodayDateString();

              if (supabase && isSupabaseConfigured()) {
                try {
                  const dbProfile = await fetchProfileFromSupabase(userId);
                  if (dbProfile) {
                    plan = (dbProfile.plan as PlanType) || 'free';
                    dailyFreeCredits = typeof dbProfile.daily_free_credits === 'number' ? dbProfile.daily_free_credits : 3;
                    paidCredits = typeof dbProfile.paid_credits === 'number' ? dbProfile.paid_credits : 0;
                    planCredits = typeof dbProfile.plan_credits === 'number' ? dbProfile.plan_credits : 0;
                    isPro = typeof dbProfile.is_pro === 'boolean' ? dbProfile.is_pro : plan !== 'free';
                    proExpiresAt = dbProfile.pro_expires_at || null;
                    createdAt = dbProfile.created_at || createdAt;
                  }
                } catch (e) {
                  // Fallback to local accounts DB
                }
              } else {
                const accounts = getAccountsDB();
                const existingAccount = accounts[userEmail];
                if (existingAccount) {
                  userId = existingAccount.id;
                  plan = existingAccount.plan;
                  dailyFreeCredits = typeof existingAccount.dailyFreeCredits === 'number' ? existingAccount.dailyFreeCredits : 3;
                  paidCredits = typeof existingAccount.paidCredits === 'number' ? existingAccount.paidCredits : 0;
                  planCredits = typeof existingAccount.planCredits === 'number' ? existingAccount.planCredits : 0;
                  isPro = existingAccount.isPro;
                  proExpiresAt = existingAccount.proExpiresAt || null;
                  createdAt = existingAccount.createdAt;
                }
              }

              const totalCredits = calculateTotalCredits({ dailyFreeCredits, paidCredits, planCredits, isPro, plan });

              const user: UserProfile = {
                id: userId,
                email: userEmail,
                name: userName,
                avatar: userAvatar,
                plan: plan,
                credits: totalCredits,
                dailyFreeCredits,
                paidCredits,
                planCredits,
                isPro: isPro,
                proExpiresAt: proExpiresAt,
                lastResetDate: today,
                createdAt: createdAt,
                token: response.access_token,
                provider: 'google',
                emailVerified: googleData.email_verified ?? true,
              };

              saveCurrentUser(user);

              // Auto-sync into Supabase profiles table
              if (isSupabaseConfigured()) {
                syncProfileToSupabase(user).catch(console.warn);
              }

              resolve(user);
            } catch (fetchErr: any) {
              console.error('[Google OAuth] UserInfo fetch error:', fetchErr);
              reject(fetchErr);
            }
          },
          error_callback: (err: any) => {
            const errMsg = String(err?.message || err?.type || '');
            const isUserCancel =
              errMsg.toLowerCase().includes('popup_closed') ||
              errMsg.toLowerCase().includes('popup window closed') ||
              errMsg.toLowerCase().includes('closed') ||
              errMsg.toLowerCase().includes('cancel') ||
              err?.type === 'popup_closed' ||
              err?.type === 'popup_failed_to_open';

            if (isUserCancel) {
              const cancelErr = new Error('Popup window closed');
              (cancelErr as any).isCancelled = true;
              reject(cancelErr);
              return;
            }
            console.warn('[Google OAuth] Init notice:', err);
            reject(new Error(err?.message || 'Google OAuth failed to initialize.'));
          },
        });

        tokenClient.requestAccessToken({ prompt: promptMode });
      } catch (err: any) {
        console.warn('[Google OAuth] TokenClient execution notice:', err);
        fallbackDirectOAuthPopup(clientId, promptMode, resolve, reject);
      }
    } else {
      fallbackDirectOAuthPopup(clientId, promptMode, resolve, reject);
    }
  });
}

function fallbackDirectOAuthPopup(
  clientId: string,
  promptMode: string,
  resolve: (user: UserProfile) => void,
  reject: (err: any) => void
) {
  const redirectUri = window.location.origin;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=token&scope=${encodeURIComponent(
    'openid email profile'
  )}&prompt=${encodeURIComponent(promptMode)}`;

  const width = 520;
  const height = 640;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  let popup: Window | null = null;
  try {
    popup = window.open(
      authUrl,
      'GoogleOAuthPopup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=1`
    );
  } catch {
    popup = null;
  }

  if (!popup) {
    const blockedErr = new Error('Popup blocked. Please allow popups for this site or use email sign-in.');
    (blockedErr as any).isCancelled = true;
    reject(blockedErr);
    return;
  }

  const pollTimer = setInterval(async () => {
    try {
      if (popup?.closed) {
        clearInterval(pollTimer);
        const cancelErr = new Error('Popup window closed');
        (cancelErr as any).isCancelled = true;
        reject(cancelErr);
        return;
      }

      if (popup?.location?.href && popup.location.href.includes('access_token=')) {
        const hash = popup.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        clearInterval(pollTimer);
        try {
          popup.close();
        } catch {
          // ignore
        }

        if (accessToken) {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          const email = (data.email || '').toLowerCase().trim();
          const today = getTodayDateString();
          const user: UserProfile = {
            id: 'usr_g_' + (data.sub || Math.random().toString(36).substring(2, 10)),
            email: email,
            name: data.name || email.split('@')[0],
            avatar: data.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
            plan: 'free',
            credits: 5,
            dailyFreeCredits: 3,
            paidCredits: 0,
            planCredits: 0,
            isPro: false,
            proExpiresAt: null,
            lastResetDate: today,
            createdAt: new Date().toISOString(),
            token: accessToken,
            provider: 'google',
            emailVerified: true,
          };
          saveCurrentUser(user);
          resolve(user);
        }
      }
    } catch (e) {
      // Cross-origin access expected while on Google domains
    }
  }, 500);
}

// ============================================================================
// 2. SUPABASE AUTH EMAIL SIGN-UP & SIGN-IN
// ============================================================================

export async function signUpWithEmail(
  rawEmail: string,
  rawPassword: string,
  rawName?: string
): Promise<UserProfile> {
  const emailValidation = validateEmail(rawEmail);
  if (!emailValidation.isValid || !emailValidation.sanitizedValue) {
    throw new Error(emailValidation.error || 'Please enter a valid email address.');
  }
  const normalizedEmail = emailValidation.sanitizedValue;

  const passValidation = validatePassword(rawPassword);
  if (!passValidation.isValid || !passValidation.sanitizedValue) {
    throw new Error(passValidation.error || 'Password must be at least 8 characters long.');
  }
  const sanitizedPassword = passValidation.sanitizedValue;

  const sanitizedName = sanitizeName(rawName || '');
  const displayName = sanitizedName || normalizedEmail.split('@')[0];
  const formattedName = (displayName.charAt(0).toUpperCase() + displayName.slice(1)).slice(0, AUTH_LIMITS.NAME_MAX_LENGTH);
  const today = getTodayDateString();

  // 1. SUPABASE AUTH SIGN-UP
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: sanitizedPassword,
      options: {
        data: {
          full_name: formattedName,
          name: formattedName,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`,
        },
      },
    });

    if (error) {
      // If user already registered in Supabase, attempt login
      if (error.message.toLowerCase().includes('already registered')) {
        return signInWithEmail(normalizedEmail, sanitizedPassword);
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Could not create account in Supabase Auth. Please try again.');
    }

    const userProfile: UserProfile = {
      id: data.user.id,
      email: normalizedEmail,
      name: formattedName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`,
      plan: 'free',
      credits: 5,
      dailyFreeCredits: 3,
      paidCredits: 0,
      planCredits: 0,
      isPro: false,
      proExpiresAt: null,
      lastResetDate: today,
      createdAt: data.user.created_at || new Date().toISOString(),
      token: data.session?.access_token || generateToken(data.user.id, normalizedEmail),
      provider: 'supabase',
      emailVerified: Boolean(data.user.email_confirmed_at),
    };

    saveCurrentUser(userProfile);
    await syncProfileToSupabase(userProfile);
    return userProfile;
  }

  // 2. LOCALSTORAGE / FALLBACK AUTH (If Supabase keys are not yet added)
  const accounts = getAccountsDB();
  if (accounts[normalizedEmail] && accounts[normalizedEmail].provider === 'password') {
    const isMatch = await verifyPassword(sanitizedPassword, accounts[normalizedEmail].passwordHash);
    if (isMatch) {
      return signInWithEmail(normalizedEmail, sanitizedPassword);
    } else {
      throw new Error('An account with this email already exists. Please sign in with your password.');
    }
  }

  const userId = 'usr_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().substring(0, 12) : Math.random().toString(36).substring(2, 11));
  const passwordHash = await hashPassword(sanitizedPassword);
  const token = generateToken(userId, normalizedEmail);

  const newAccount: StoredAccount = {
    id: userId,
    email: normalizedEmail,
    passwordHash: passwordHash,
    name: formattedName,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    plan: 'free',
    credits: 5,
    dailyFreeCredits: 3,
    paidCredits: 0,
    planCredits: 0,
    isPro: false,
    proExpiresAt: null,
    lastResetDate: today,
    createdAt: new Date().toISOString(),
    provider: 'password',
  };

  accounts[normalizedEmail] = newAccount;
  saveAccountsDB(accounts);

  const userProfile: UserProfile = {
    id: userId,
    email: normalizedEmail,
    name: formattedName,
    avatar: newAccount.avatar,
    plan: 'free',
    credits: 5,
    dailyFreeCredits: 3,
    paidCredits: 0,
    planCredits: 0,
    isPro: false,
    proExpiresAt: null,
    lastResetDate: today,
    createdAt: newAccount.createdAt,
    token: token,
    provider: 'password',
    emailVerified: true,
  };

  resetRateLimit(normalizedEmail);
  saveCurrentUser(userProfile);
  return userProfile;
}

export async function signInWithEmail(
  rawEmail: string,
  rawPassword: string
): Promise<UserProfile> {
  const emailValidation = validateEmail(rawEmail);
  if (!emailValidation.isValid || !emailValidation.sanitizedValue) {
    throw new Error(emailValidation.error || 'Please enter a valid email address.');
  }
  const normalizedEmail = emailValidation.sanitizedValue;
  const sanitizedPassword = sanitizePassword(rawPassword);

  if (!sanitizedPassword) {
    throw new Error('Please enter your account password.');
  }

  // Security Defense: Check brute-force rate limit
  const rateLimitStatus = checkRateLimit(normalizedEmail);
  if (!rateLimitStatus.isAllowed) {
    throw new Error(
      rateLimitStatus.error ||
      `Too many failed attempts. Please wait ${rateLimitStatus.lockoutRemainingSeconds || 60}s before trying again.`
    );
  }

  // 1. SUPABASE AUTH SIGN-IN
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: sanitizedPassword,
    });

    if (error) {
      // Record failed attempt for rate limiting
      recordFailedAttempt(normalizedEmail);

      // If user not found, try auto sign up
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        try {
          return await signUpWithEmail(normalizedEmail, sanitizedPassword);
        } catch {
          throw new Error('Invalid email or password. Please verify your credentials.');
        }
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Authentication failed. No user returned from Supabase.');
    }

    // Reset rate limit on success
    resetRateLimit(normalizedEmail);

    // Fetch matching row from profiles table
    const dbProfile = await fetchProfileFromSupabase(data.user.id);
    const userProfile = mapSupabaseToUserProfile(data.user, dbProfile, data.session?.access_token);

    saveCurrentUser(userProfile);
    return userProfile;
  }

  // 2. LOCALSTORAGE / FALLBACK SIGN-IN
  const accounts = getAccountsDB();
  const existingAccount = accounts[normalizedEmail];

  if (!existingAccount) {
    return signUpWithEmail(normalizedEmail, sanitizedPassword);
  }

  const isPasswordValid = await verifyPassword(sanitizedPassword, existingAccount.passwordHash);
  if (!isPasswordValid && existingAccount.provider === 'password') {
    const lockout = recordFailedAttempt(normalizedEmail);
    if (lockout.isLocked) {
      throw new Error(
        `Account locked due to 5 consecutive failed login attempts. Please wait ${lockout.lockoutRemainingSeconds} seconds.`
      );
    }
    const remaining = checkRateLimit(normalizedEmail).remainingAttempts;
    throw new Error(`Incorrect password. ${remaining} attempt(s) remaining before security lockout.`);
  }

  // If matched with old legacy hash, upgrade to strong SHA-256 salted hash
  if (!existingAccount.passwordHash.startsWith('sha256$')) {
    existingAccount.passwordHash = await hashPassword(sanitizedPassword);
    accounts[normalizedEmail] = existingAccount;
    saveAccountsDB(accounts);
  }

  // Reset rate limit on successful authentication
  resetRateLimit(normalizedEmail);

  const token = generateToken(existingAccount.id, normalizedEmail);
  const today = getTodayDateString();

  const userProfile: UserProfile = {
    id: existingAccount.id,
    email: existingAccount.email,
    name: existingAccount.name,
    avatar: existingAccount.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    plan: existingAccount.plan,
    credits: existingAccount.credits,
    dailyFreeCredits: typeof existingAccount.dailyFreeCredits === 'number' ? existingAccount.dailyFreeCredits : 3,
    paidCredits: typeof existingAccount.paidCredits === 'number' ? existingAccount.paidCredits : 0,
    planCredits: typeof existingAccount.planCredits === 'number' ? existingAccount.planCredits : 0,
    isPro: existingAccount.isPro,
    proExpiresAt: existingAccount.proExpiresAt,
    lastResetDate: existingAccount.lastResetDate || today,
    createdAt: existingAccount.createdAt,
    token: token,
    provider: existingAccount.provider,
    emailVerified: true,
  };

  saveCurrentUser(userProfile);
  return userProfile;
}

/**
 * Sends a password reset email using Supabase Auth with sanitization and RFC validation.
 */
export async function resetPasswordWithEmail(rawEmail: string): Promise<{ success: boolean; message: string }> {
  const emailValidation = validateEmail(rawEmail);
  if (!emailValidation.isValid || !emailValidation.sanitizedValue) {
    throw new Error(emailValidation.error || 'Please enter a valid email address.');
  }
  const normalizedEmail = emailValidation.sanitizedValue;

  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#reset-password` : undefined,
    });

    if (error) {
      throw new Error(error.message || 'Password reset request failed.');
    }

    return {
      success: true,
      message: `Password reset instructions have been sent to ${normalizedEmail}. Please check your inbox.`,
    };
  }

  // Local fallback
  return {
    success: true,
    message: `If an account exists for ${normalizedEmail}, instructions to reset your password have been sent.`,
  };
}

// ============================================================================
// 3. USER LOGOUT
// ============================================================================

export async function logoutUser(): Promise<void> {
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Supabase] SignOut error:', err);
    }
  }
  saveCurrentUser(null);
}

// ============================================================================
// 4. USER PRO STATE & LEMON SQUEEZY SUBSCRIPTION SYNC
// ============================================================================

export function upgradeUserPlan(
  plan: PlanType,
  creditsToAdd?: number
): UserProfile {
  let user = getCurrentUser();
  const isSubscription = plan === 'lite' || plan === 'pro' || plan === 'unlimited';
  const today = getTodayDateString();

  // Calculate subscription expiry timestamp
  const calculateExpiresAt = (planType: PlanType): string | null => {
    if (planType === 'unlimited') {
      // Exactly 1 Year (365 days) from purchase date
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (planType === 'pro' || planType === 'lite') {
      // Exactly 1 Month (30 days) from purchase date
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    return null;
  };

  if (!user) {
    const newId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const email = 'customer@bgremover.art';
    const planCredits = plan === 'lite' ? 40 : plan === 'pro' ? 200 : plan === 'unlimited' ? 9999 : 0;
    const paidCredits = plan === 'payg' ? (creditsToAdd || 10) : 0;
    const dailyFreeCredits = 3;

    user = {
      id: newId,
      email: email,
      name: plan === 'unlimited' ? 'VIP Member' : plan === 'pro' ? 'Pro Member' : 'Member',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Customer`,
      plan: plan,
      dailyFreeCredits,
      paidCredits,
      planCredits,
      credits: plan === 'unlimited' ? 9999 : dailyFreeCredits + paidCredits + planCredits,
      isPro: isSubscription,
      proExpiresAt: calculateExpiresAt(plan),
      lastResetDate: today,
      createdAt: new Date().toISOString(),
      token: generateToken(newId, email),
      provider: 'custom',
    };
  } else {
    // Preserve existing pools
    let updatedDaily = typeof user.dailyFreeCredits === 'number' ? user.dailyFreeCredits : 3;
    let updatedPaid = typeof user.paidCredits === 'number' ? user.paidCredits : 0;
    let updatedPlanCredits = typeof user.planCredits === 'number' ? user.planCredits : 0;
    let updatedPlan = user.plan;
    let updatedIsPro = user.isPro;
    let updatedExpiresAt = user.proExpiresAt || null;

    if (plan === 'payg') {
      // Pay-As-You-Go Credit Pack: Strictly non-expiring!
      updatedPaid += (creditsToAdd || 10);
      // Preserve active subscription if present, else set plan to payg
      const hasActiveSub = user.isPro && user.proExpiresAt && new Date(user.proExpiresAt).getTime() > Date.now();
      if (!hasActiveSub) {
        updatedPlan = 'payg';
        updatedIsPro = false;
        updatedExpiresAt = null;
      }
    } else if (plan === 'lite') {
      // Monthly Lite Subscription ($4.99) -> 40 credits, 30 days
      updatedPlan = 'lite';
      updatedIsPro = true;
      updatedPlanCredits = 40;
      updatedExpiresAt = calculateExpiresAt('lite');
    } else if (plan === 'pro') {
      // Monthly Pro Subscription ($20) -> 200 credits, 30 days
      updatedPlan = 'pro';
      updatedIsPro = true;
      updatedPlanCredits = 200;
      updatedExpiresAt = calculateExpiresAt('pro');
    } else if (plan === 'unlimited') {
      // Yearly Unlimited Pass ($300) -> 9999 credits, 365 days
      updatedPlan = 'unlimited';
      updatedIsPro = true;
      updatedPlanCredits = 9999;
      updatedExpiresAt = calculateExpiresAt('unlimited');
    }

    const totalCredits = calculateTotalCredits({
      dailyFreeCredits: updatedDaily,
      paidCredits: updatedPaid,
      planCredits: updatedPlanCredits,
      isPro: updatedIsPro,
      plan: updatedPlan,
    });

    user = {
      ...user,
      plan: updatedPlan,
      isPro: updatedIsPro,
      dailyFreeCredits: updatedDaily,
      paidCredits: updatedPaid,
      planCredits: updatedPlanCredits,
      credits: totalCredits,
      proExpiresAt: updatedExpiresAt,
      lastResetDate: user.lastResetDate || today,
    };
  }

  saveCurrentUser(user);
  return user;
}

export function upgradeUserToPro(
  creditsToAdd?: number,
  isSubscription: boolean = true
): UserProfile {
  return upgradeUserPlan(isSubscription ? 'pro' : 'payg', creditsToAdd);
}

/**
 * Atomically deducts 1 credit from the user's account with 3-tier priority:
 *   Priority 0 (Unlimited Pass): If active unlimited pass, 0 credits consumed.
 *   Priority 1 (Daily Quota): If dailyFreeCredits > 0, decrement dailyFreeCredits by 1.
 *   Priority 2 (Subscription Quota): If dailyFreeCredits == 0 and active planCredits > 0 (valid proExpiresAt), decrement planCredits by 1.
 *   Priority 3 (PAYG Non-Expiring Balance): If previous pools are 0, decrement paidCredits by 1.
 * Throws an error if insufficient credits or database error.
 */
export async function deductUserCredit(user: UserProfile): Promise<{ user: UserProfile; updatedCredits: number }> {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Secure server credit enforcement is unavailable.');
  }

  // The RPC verifies auth.uid() server-side. Do not trust browser balances.
  const { data, error } = await supabase.rpc('deduct_credit', { user_id: user.id });
  if (error) throw new Error(error.message || 'Insufficient credits');
  if (!data || typeof data !== 'object') throw new Error('Invalid credit response');

  const dailyFreeCredits = Number(data.daily_free_credits ?? 0);
  const planCredits = Number(data.plan_credits ?? 0);
  const paidCredits = Number(data.paid_credits ?? 0);
  const updatedCredits = Number(data.credits ?? dailyFreeCredits + planCredits + paidCredits);

  const updatedProfile: UserProfile = {
    ...user,
    dailyFreeCredits,
    planCredits,
    paidCredits,
    credits: updatedCredits,
    lastResetDate: getTodayDateString(),
  };
  saveCurrentUser(updatedProfile);
  return { user: updatedProfile, updatedCredits };
}

// Subscribe to auth state changes across the application (Supabase + Local event)
export function subscribeToAuthChanges(callback: (user: UserProfile | null) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<UserProfile | null>;
    callback(customEvent.detail);
  };
  window.addEventListener(AUTH_CHANGE_EVENT, handler);

  // Also listen to Supabase Auth State Change events
  let supabaseUnsubscribe: (() => void) | null = null;
  if (supabase && isSupabaseConfigured()) {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const dbProfile = await fetchProfileFromSupabase(session.user.id);
        const mappedUser = mapSupabaseToUserProfile(session.user, dbProfile, session.access_token);
        saveCurrentUser(mappedUser);
      } else if (event === 'SIGNED_OUT') {
        saveCurrentUser(null);
      }
    });
    supabaseUnsubscribe = () => authListener.subscription.unsubscribe();
  }

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handler);
    if (supabaseUnsubscribe) {
      supabaseUnsubscribe();
    }
  };
}
