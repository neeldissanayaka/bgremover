import React, { useState, useRef, useEffect } from 'react';
import { Crown, Zap, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { UserProfile } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  remainingQuota: number;
  totalQuota: number;
  onQuotaReset: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenPricing: () => void;
  onOpenLegal?: (type: 'privacy' | 'terms') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  remainingQuota,
  totalQuota,
  currentUser,
  onOpenAuth,
  onOpenPricing,
  onOpenLegal,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#05070B]/90 backdrop-blur-xl border-b border-white/10 shrink-0 transition-all text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8 lg:space-x-12">
            <a href="/" className="flex items-center group cursor-pointer">
              <Logo size="md" variant="dark" />
            </a>

            {/* Clean User-Focused Navigation Links: [ How It Works ] [ Tools ] [ Passport ID ] [ FAQ ] [ Pricing ] */}
            <nav className="hidden md:flex items-center space-x-7 text-sm font-semibold text-slate-300">
              <a
                href="#how-it-works"
                className="cursor-pointer hover:text-cyan-400 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#features"
                className="cursor-pointer hover:text-cyan-400 transition-colors"
              >
                Tools
              </a>
              <a
                href="#passport-presets"
                className="cursor-pointer hover:text-cyan-400 transition-colors"
              >
                Passport & ID
              </a>
              <a
                href="#faq"
                className="cursor-pointer hover:text-cyan-400 transition-colors"
              >
                FAQ
              </a>
              <button
                type="button"
                onClick={onOpenPricing}
                className="cursor-pointer hover:text-cyan-400 transition-colors font-semibold flex items-center gap-1"
              >
                <span>Pricing</span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-[10px] font-extrabold uppercase">
                  Pro
                </span>
              </button>
            </nav>
          </div>

          {/* Right Action & User Profile / Login Area */}
          <div className="hidden sm:flex items-center space-x-4">
            
            {/* PRO or Credits or Daily Free Quota Badge */}
            {currentUser?.isPro && currentUser.plan === 'unlimited' ? (
              <div className="bg-amber-500/15 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold border border-amber-400/30 flex items-center gap-1.5 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-extrabold tracking-wide">PRO UNLIMITED</span>
              </div>
            ) : currentUser && typeof currentUser.credits === 'number' && currentUser.credits > 0 ? (
              <div className="bg-emerald-500/15 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>
                  <strong className="font-extrabold">{currentUser.credits}</strong> {currentUser.credits === 1 ? 'CREDIT' : 'CREDITS'}
                </span>
              </div>
            ) : currentUser && currentUser.credits === 0 ? (
              <button
                type="button"
                onClick={onOpenPricing}
                className="bg-rose-500/15 text-rose-300 px-3 py-1.5 rounded-full text-xs font-bold border border-rose-400/30 flex items-center gap-1.5 hover:bg-rose-500/25 transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                <span>0 Credits · <strong>Top Up</strong></span>
              </button>
            ) : (
              <div className="bg-white/[0.06] text-slate-200 px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/15 flex items-center">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse shadow-[0_0_8px_#38bdf8]" />
                <span>
                  <strong className="font-extrabold text-white">{remainingQuota}/{totalQuota}</strong> FREE LEFT
                </span>
              </div>
            )}

            {/* Upgrade CTA if not Pro */}
            {!currentUser?.isPro && (
              <button
                type="button"
                onClick={onOpenPricing}
                className="text-xs font-bold text-slate-200 hover:text-cyan-300 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Upgrade</span>
              </button>
            )}

            {/* User Auth Section */}
            {currentUser ? (
              /* Logged In: User Profile Avatar & Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-white/[0.08] transition-colors border border-white/15 cursor-pointer bg-white/[0.04]"
                >
                  <img
                    src={
                      currentUser.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                        currentUser.email
                      )}`
                    }
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full bg-slate-800 object-cover"
                  />
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-white leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[110px]">
                      {currentUser.email}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0E131F] rounded-2xl shadow-2xl border border-white/15 py-2.5 animate-in fade-in zoom-in-95 duration-150 z-50 text-white">
                    <div className="px-4 py-2.5 border-b border-white/10">
                      <p className="text-xs font-bold text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            currentUser.isPro
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {currentUser.isPro
                            ? currentUser.plan === 'unlimited'
                              ? 'VIP Unlimited'
                              : `${currentUser.plan.toUpperCase()} Member`
                            : currentUser.plan === 'payg'
                            ? 'PAYG Account'
                            : 'Free Account'}
                        </span>
                        <span className="text-[11px] text-cyan-300 font-bold">
                          {currentUser.isPro && currentUser.plan === 'unlimited' ? '∞' : currentUser.credits} Credits
                        </span>
                      </div>

                      {/* Pool Breakdown */}
                      <div className="mt-2 pt-2 border-t border-white/10 space-y-1 text-[10px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Daily Free:</span>
                          <span className="font-semibold text-slate-200">{currentUser.dailyFreeCredits ?? 5}/5</span>
                        </div>
                        {Boolean(currentUser.planCredits) && (
                          <div className="flex justify-between">
                            <span>Monthly Plan:</span>
                            <span className="font-semibold text-slate-200">{currentUser.planCredits}</span>
                          </div>
                        )}
                        {Boolean(currentUser.paidCredits) && (
                          <div className="flex justify-between">
                            <span>Non-Expiring:</span>
                            <span className="font-semibold text-slate-200">{currentUser.paidCredits}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!currentUser.isPro && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenPricing();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-cyan-400 hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Crown className="w-4 h-4 text-cyan-400" />
                        <span>Upgrade to Unlimited Pro</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenLegal?.('privacy');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Privacy Policy</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenLegal?.('terms');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Terms of Service</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors border-t border-white/10 mt-1 pt-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Non-Logged In: [ Login / Sign Up ] Button */
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="text-sm font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5 border border-blue-400/30"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}

          </div>

          {/* Mobile menu hamburger */}
          <div className="flex items-center gap-2.5 sm:hidden">
            {currentUser?.isPro ? (
              <div className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-amber-400/30">
                PRO
              </div>
            ) : currentUser && typeof currentUser.credits === 'number' && currentUser.credits > 0 ? (
              <div className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-400/30">
                {currentUser.credits} cr
              </div>
            ) : currentUser && currentUser.credits === 0 ? (
              <button
                type="button"
                onClick={onOpenPricing}
                className="bg-rose-500/20 text-rose-300 px-2 py-1 rounded-full text-[10px] font-bold border border-rose-400/30"
              >
                0 cr
              </button>
            ) : (
              <div className="bg-white/10 text-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/15">
                {remainingQuota}/{totalQuota} left
              </div>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#0B0F19] border-b border-white/10 px-6 pt-3 pb-6 space-y-4 shadow-2xl animate-in fade-in text-white">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-slate-400">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <img
                    src={
                      currentUser.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                        currentUser.email
                      )}`
                    }
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full bg-slate-800"
                  />
                  <div>
                    <p className="font-bold text-white">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400">{currentUser.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">
                    {currentUser.isPro ? 'PRO UNLIMITED' : `${currentUser.credits || 0} Credits`}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <span>Daily Free Removals:</span>
                <span className="font-bold text-cyan-400">{remainingQuota} / {totalQuota} Remaining</span>
              </>
            )}
          </div>

          <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-300">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-white/[0.06]"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-white/[0.06]"
            >
              Tools & Features
            </a>
            <a
              href="#passport-presets"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-white/[0.06]"
            >
              Passport & ID Standards
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-white/[0.06]"
            >
              Frequently Asked Questions
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPricing();
              }}
              className="text-left px-3 py-2 rounded-xl hover:bg-white/[0.06] font-bold text-cyan-400 flex items-center justify-between"
            >
              <span>Pricing & Plans</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 text-[10px] border border-blue-400/30">
                $4.99/mo
              </span>
            </button>
            <div className="pt-2 border-t border-white/10 flex items-center gap-4 px-3 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLegal?.('privacy');
                }}
                className="hover:text-white"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLegal?.('terms');
                }}
                className="hover:text-white"
              >
                Terms of Service
              </button>
            </div>
          </nav>

          <div className="pt-2 flex flex-col gap-2">
            {currentUser ? (
              <>
                {!currentUser.isPro && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenPricing();
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white text-center shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 border border-blue-400/30"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Upgrade to Pro Plan</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 text-center border border-rose-500/20"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signin');
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/[0.06] hover:bg-white/10 text-center border border-white/10"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signup');
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 text-center shadow-md shadow-blue-600/30 border border-blue-400/30"
                >
                  Sign Up Free
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
