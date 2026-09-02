import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { UserProfile, PlanType } from '../types';

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  if (
    SUPABASE_URL.includes('your-project.supabase.co') ||
    SUPABASE_URL.includes('example.supabase.co') ||
    SUPABASE_ANON_KEY.includes('your-anon-key') ||
    SUPABASE_ANON_KEY.length < 20
  ) {
    return false;
  }

  try {
    const parsedUrl = new URL(SUPABASE_URL);
    const validProtocol = parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
    const validHost =
      Boolean(parsedUrl.hostname) &&
      parsedUrl.hostname.includes('.') &&
      !parsedUrl.hostname.startsWith('.') &&
      !parsedUrl.hostname.endsWith('.') &&
      parsedUrl.hostname.length >= 6;

    return validProtocol && validHost;
  } catch {
    return false;
  }
};

function getSafeSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase] Initialization failed safely:', err);
    return null;
  }
}

// Initialize Supabase Client with auto session persistence only when properly configured
export const supabase: SupabaseClient | null = getSafeSupabaseClient();

export interface SupabaseProfileRow {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  plan: string;
  credits: number;
  daily_free_credits?: number;
  paid_credits?: number;
  plan_credits?: number;
  pro_expires_at?: string | null;
  last_reset_date?: string | null;
  is_pro: boolean;
  created_at?: string;
  updated_at?: string;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Maps a Supabase user & DB profile row into the application's UserProfile object.
 */
export function mapSupabaseToUserProfile(
  authUser: User,
  profile?: Partial<SupabaseProfileRow> | null,
  accessToken?: string
): UserProfile {
  const metadata = authUser.user_metadata || {};
  const email = (authUser.email || metadata.email || '').toLowerCase().trim();
  const name =
    profile?.name ||
    metadata.full_name ||
    metadata.name ||
    email.split('@')[0] ||
    'User';
  const avatar =
    profile?.avatar_url ||
    metadata.avatar_url ||
    metadata.picture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email || 'user')}`;

  const plan = (profile?.plan as PlanType) || 'free';
  const isPro = typeof profile?.is_pro === 'boolean' ? profile.is_pro : plan !== 'free';
  const proExpiresAt = profile?.pro_expires_at || null;
  const lastResetDate = profile?.last_reset_date || getTodayString();

  // Multi-Pool credit balances
  const dailyFreeCredits = typeof profile?.daily_free_credits === 'number' ? profile.daily_free_credits : 5;
  const paidCredits = typeof profile?.paid_credits === 'number' ? profile.paid_credits : 0;
  const planCredits = typeof profile?.plan_credits === 'number' ? profile.plan_credits : 0;

  // Computed total
  const totalCredits = isPro && plan === 'unlimited'
    ? 9999
    : dailyFreeCredits + paidCredits + planCredits;

  return {
    id: authUser.id,
    email: email,
    name: name,
    avatar: avatar,
    plan: plan,
    credits: totalCredits,
    dailyFreeCredits,
    paidCredits,
    planCredits,
    proExpiresAt,
    lastResetDate,
    isPro: isPro,
    createdAt: profile?.created_at || authUser.created_at || new Date().toISOString(),
    token: accessToken,
    provider: (authUser.app_metadata?.provider as any) || 'custom',
    emailVerified: Boolean(authUser.email_confirmed_at || metadata.email_verified),
  };
}

/**
 * Upserts or updates a user profile in Supabase 'profiles' table.
 */
export async function syncProfileToSupabase(user: UserProfile): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;

  try {
    const payload: SupabaseProfileRow = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar,
      plan: user.plan,
      credits: user.credits,
      daily_free_credits: user.dailyFreeCredits ?? 5,
      paid_credits: user.paidCredits ?? 0,
      plan_credits: user.planCredits ?? 0,
      pro_expires_at: user.proExpiresAt || null,
      last_reset_date: user.lastResetDate || getTodayString(),
      is_pro: user.isPro,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Warning syncing profile to database table:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase] Profile sync exception:', err);
  }
}

/**
 * Fetches user profile record from Supabase 'profiles' table.
 */
export async function fetchProfileFromSupabase(userId: string): Promise<Partial<SupabaseProfileRow> | null> {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Error fetching profile:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[Supabase] Exception fetching profile:', err);
    return null;
  }
}

/**
 * Atomically deducts 1 credit from the user's account using the Supabase RPC function.
 * Follows the 3-tier priority:
 *   1. Unlimited Pass bypass
 *   2. Daily Free Credits
 *   3. Active Subscription Plan Credits
 *   4. Non-expiring Paid Credits (PAYG)
 * Throws an error if credits are 0 or less, or if network/database operation fails.
 */
export async function deductCreditFromSupabaseRpc(userId: string): Promise<{
  updatedCredits: number;
  dailyFreeCredits?: number;
  paidCredits?: number;
  planCredits?: number;
}> {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.rpc('deduct_credit', {
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message || 'Insufficient credits or deduction failed');
  }

  if (typeof data === 'number') {
    return { updatedCredits: data };
  } else if (data && typeof data === 'object') {
    return {
      updatedCredits: typeof data.credits === 'number' ? data.credits : Number(data.credits || 0),
      dailyFreeCredits: data.daily_free_credits,
      paidCredits: data.paid_credits,
      planCredits: data.plan_credits,
    };
  }

  return { updatedCredits: Number(data) || 0 };
}
