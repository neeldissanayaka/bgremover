import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  KeyRound,
  User,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPasswordWithEmail } from '../utils/auth';
import {
  validateEmail,
  validatePassword,
  validateName,
  sanitizeEmail,
  sanitizePassword,
  sanitizeName,
  AUTH_LIMITS,
} from '../utils/security';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
  initialMode?: 'signin' | 'signup' | 'reset';
  pendingPlanName?: string | null;
  onOpenLegal?: (tab: 'privacy' | 'terms') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
  pendingPlanName,
  onOpenLegal,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Locking ref to prevent rapid multi-clicks/race conditions
  const isSubmittingRef = useRef(false);

  // Reset form errors and mode when modal reopens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessNotice(null);
      isSubmittingRef.current = false;
    }
  }, [isOpen, initialMode]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading && !isGoogleLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, isGoogleLoading, onClose]);

  if (!isOpen) return null;

  // Real Google OAuth Trigger with prompt: 'select_account'
  const handleGoogleSignIn = async () => {
    if (isSubmittingRef.current || loading || isGoogleLoading) return;
    isSubmittingRef.current = true;
    setIsGoogleLoading(true);
    setError(null);

    try {
      const user = await signInWithGoogle({
        prompt: 'select_account',
      });

      if (pendingPlanName) {
        setSuccessNotice(`Signed in as ${user.name}! Forwarding to checkout...`);
      } else {
        setSuccessNotice(`Signed in with Google as ${user.name}`);
      }
      setTimeout(() => {
        if (onSuccess) onSuccess(user);
        onClose();
        setSuccessNotice(null);
      }, 400);
    } catch (err: any) {
      const msg = String(err?.message || '');
      const isCancelled =
        err?.isCancelled ||
        msg.toLowerCase().includes('popup window closed') ||
        msg.toLowerCase().includes('popup_closed') ||
        msg.toLowerCase().includes('closed before completing') ||
        msg.toLowerCase().includes('popup was closed') ||
        msg.toLowerCase().includes('cancelled') ||
        msg.toLowerCase().includes('canceled');

      if (isCancelled) {
        // User closed or dismissed the popup: cleanly reset without an error
        setError(null);
      } else {
        console.warn('[Auth] Google sign-in notice:', err);
        setError(err?.message || 'Google authentication could not be completed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent rapid multi-submits
    if (isSubmittingRef.current || loading || isGoogleLoading) {
      return;
    }

    setError(null);
    setSuccessNotice(null);

    // 1. Sanitize and Validate Email
    const emailVal = validateEmail(email);
    if (!emailVal.isValid || !emailVal.sanitizedValue) {
      setError(emailVal.error || 'Please enter a valid email address.');
      return;
    }
    const cleanEmail = emailVal.sanitizedValue;

    // 2. Handle Password Reset Mode
    if (mode === 'reset') {
      isSubmittingRef.current = true;
      setLoading(true);
      try {
        const res = await resetPasswordWithEmail(cleanEmail);
        setSuccessNotice(res.message);
      } catch (err: any) {
        console.error('Reset error:', err);
        setError(err?.message || 'Could not send reset link. Please check the email entered.');
      } finally {
        setLoading(false);
        isSubmittingRef.current = false;
      }
      return;
    }

    // 3. Validate Password for Sign In / Sign Up
    const passVal = validatePassword(password);
    if (!passVal.isValid || !passVal.sanitizedValue) {
      setError(passVal.error || 'Password must be at least 8 characters long.');
      return;
    }
    const cleanPassword = passVal.sanitizedValue;

    // 4. Validate Name for Sign Up
    let cleanName = '';
    if (mode === 'signup') {
      const nameVal = validateName(name);
      cleanName = nameVal.sanitizedValue || '';
    }

    // Lock submission state
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      let user: UserProfile;
      if (mode === 'signup') {
        user = await signUpWithEmail(cleanEmail, cleanPassword, cleanName);
        setSuccessNotice(pendingPlanName ? 'Account created! Forwarding to checkout...' : 'Account created successfully! Logging you in...');
      } else {
        user = await signInWithEmail(cleanEmail, cleanPassword);
        setSuccessNotice(pendingPlanName ? `Welcome back, ${user.name}! Forwarding to checkout...` : `Welcome back, ${user.name}!`);
      }

      setTimeout(() => {
        if (onSuccess) onSuccess(user);
        onClose();
        setSuccessNotice(null);
      }, 400);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      onClick={() => {
        if (!loading && !isGoogleLoading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-slate-100 p-6 sm:p-8 my-auto overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading || isGoogleLoading}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer z-10 disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pending Checkout Intent Header Banner */}
        {pendingPlanName && (
          <div className="mb-4 p-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Sign in to proceed with <strong>{pendingPlanName}</strong>
            </span>
          </div>
        )}

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-1 shadow-2xs">
            {mode === 'reset' ? <KeyRound className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <h3 className="text-2xl font-black font-['Outfit'] text-slate-900 tracking-tight">
            {pendingPlanName
              ? 'Sign In to Continue'
              : mode === 'signin'
              ? 'Welcome Back'
              : mode === 'signup'
              ? 'Create Free Account'
              : 'Reset Password'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            {pendingPlanName
              ? 'Your purchase and credits will be securely linked to your authenticated account.'
              : mode === 'signin'
              ? 'Sign in to access your cutout history and manage your PRO subscription.'
              : mode === 'signup'
              ? 'Join over 2.4M+ creators and designers using bgremover.art.'
              : 'Enter your account email to receive secure password reset instructions.'}
          </p>
        </div>

        {/* Success Alert */}
        {successNotice && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button (Only in signin/signup mode) */}
        {mode !== 'reset' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200 shadow-xs flex items-center justify-center gap-3 text-sm font-bold text-slate-700 transition-all cursor-pointer mb-5 disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-100 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                or with email
              </span>
              <div className="border-t border-slate-100 w-full" />
            </div>
          </>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={AUTH_LIMITS.NAME_MAX_LENGTH}
                  value={name}
                  onChange={(e) => setName(sanitizeName(e.target.value))}
                  placeholder="Alex Morgan"
                  disabled={loading || isGoogleLoading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 disabled:bg-slate-100"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                maxLength={AUTH_LIMITS.EMAIL_MAX_LENGTH}
                value={email}
                onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                placeholder="you@example.com"
                disabled={loading || isGoogleLoading}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 disabled:bg-slate-100"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setError(null);
                      setSuccessNotice(null);
                    }}
                    tabIndex={-1}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={AUTH_LIMITS.PASSWORD_MAX_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                  placeholder="••••••••"
                  disabled={loading || isGoogleLoading}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 disabled:bg-slate-100"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Minimum 8 characters. Maximum 128 characters.
                </p>
              )}
            </div>
          )}

          {/* Form Action Button with Lock / Spinner */}
          <button
            type="submit"
            disabled={loading || isGoogleLoading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>
                  {mode === 'reset'
                    ? 'Sending reset link...'
                    : mode === 'signup'
                    ? 'Creating account...'
                    : 'Signing in...'}
                </span>
              </span>
            ) : (
              <>
                <span>
                  {mode === 'reset'
                    ? 'Send Reset Link'
                    : mode === 'signin'
                    ? 'Sign In'
                    : 'Create Free Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch Mode Toggle & Navigation */}
        <div className="mt-5 text-center text-xs text-slate-500 space-y-1">
          {mode === 'signin' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Back to Sign in
              </button>
            </p>
          )}

          {mode === 'signup' && onOpenLegal && (
            <p className="pt-2 text-[11px] text-slate-400">
              By creating an account, you agree to our{' '}
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="text-slate-600 font-semibold hover:text-blue-600 underline cursor-pointer"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="text-slate-600 font-semibold hover:text-blue-600 underline cursor-pointer"
              >
                Privacy Policy
              </button>
              .
            </p>
          )}
        </div>

        {/* Security / Privacy Trust Badge */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>RFC 5322 Validated · 256-Bit SSL · XSS Protected</span>
        </div>
      </div>
    </div>
  );
};
