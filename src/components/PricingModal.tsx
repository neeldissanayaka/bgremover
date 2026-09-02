import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  Zap,
  Crown,
  Sparkles,
  CreditCard,
  ArrowRight,
  ChevronDown,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  buildCheckoutUrl,
  redirectToLemonSqueezyCheckout,
  setupLemonSqueezyListeners,
} from '../utils/lemonsqueezy';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onRequireAuth: (planId: string) => void;
  onUpgradeSuccess?: (user: UserProfile) => void;
  alertMessage?: string | null;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRequireAuth,
  alertMessage,
}) => {
  const [paygOption, setPaygOption] = useState<'3' | '10' | '50'>('10');
  const [redirectingPlan, setRedirectingPlan] = useState<string | null>(null);

  // Manual reset / unfreeze handler
  const handleCancelRedirect = useCallback(() => {
    setRedirectingPlan(null);
  }, []);

  // Set up Lemon Squeezy event listeners & Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Listen for Lemon Squeezy overlay close/cancelled events
    const unsubscribeLs = setupLemonSqueezyListeners(() => {
      handleCancelRedirect();
    });

    // Escape key listener to close modal and reset pending redirect state
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelRedirect();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribeLs();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleCancelRedirect, onClose]);

  // Safety timeout: auto-unfreeze loading state after 6 seconds in case of network stalls or pop-up blocker
  useEffect(() => {
    if (!redirectingPlan) return;

    const timer = setTimeout(() => {
      setRedirectingPlan(null);
    }, 6000);

    return () => clearTimeout(timer);
  }, [redirectingPlan]);

  if (!isOpen) return null;

  const paygPrices = {
    '3': { price: '$2.00', credits: 3, perImage: '$0.66', planKey: 'payg_3' },
    '10': { price: '$5.00', credits: 10, perImage: '$0.50', planKey: 'payg_10' },
    '50': { price: '$15.00', credits: 50, perImage: '$0.30', planKey: 'payg_50' },
  };

  const handleCheckout = (planId: string) => {
    // 1. Authentication Gate Check
    if (!currentUser) {
      // User is not logged in: block redirect, store plan, open Google / Supabase Auth modal
      onRequireAuth(planId);
      return;
    }

    // 2. User is already authenticated: proceed to Lemon Squeezy checkout with full user context
    setRedirectingPlan(planId);
    setTimeout(() => {
      redirectToLemonSqueezyCheckout(planId, currentUser);
    }, 150);
  };

  const handleModalClose = () => {
    handleCancelRedirect();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      onClick={handleModalClose}
    >
      <div
        className="relative w-full max-w-6xl bg-white rounded-2xl sm:rounded-3xl lg:rounded-[36px] shadow-2xl border border-slate-100 p-5 sm:p-7 lg:p-9 my-auto overflow-hidden animate-in zoom-in-95 duration-200 max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Explicit Close / Cancel Modal Button */}
        <button
          onClick={handleModalClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100/80 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Close modal"
          title="Close / Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* In-Flight Checkout Connecting / Unfreeze Banner */}
        {redirectingPlan && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
              <span>Connecting to Lemon Squeezy secure checkout...</span>
            </div>
            <button
              type="button"
              onClick={handleCancelRedirect}
              className="px-3 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-[11px] font-bold text-amber-900 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Cancel / Unfreeze</span>
            </button>
          </div>
        )}

        {/* Credit Exhaustion Notification Banner */}
        {alertMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3.5 shadow-xs animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-rose-950 text-sm">Credits Exhausted</p>
              <p className="text-rose-700 font-medium">{alertMessage}</p>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 text-blue-600" />
            <span>Pricing & Subscription Plans</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-['Outfit'] text-slate-900 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Pay as you go or subscribe for monthly allowances. Instant activation with a 100% money-back guarantee.
          </p>

          {/* User Authentication Status Indicator */}
          <div className="pt-2">
            {currentUser ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>
                  Ready to upgrade: <strong>{currentUser.email}</strong>
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Secure account sign-in verified before checkout</span>
              </div>
            )}
          </div>
        </div>

        {/* 4-Tier Pricing Cards Grid - Fully Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-5 mb-6 sm:mb-8 items-stretch">
          
          {/* CARD 1: Pay-as-you-go */}
          <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 bg-white flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3.5">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  One-Off Purchase
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-['Outfit'] mt-0.5">
                  Pay-as-you-go
                </h3>
                <p className="text-xs text-slate-500 mt-1">One-time payment, no subscription</p>
              </div>

              {/* Dropdown Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Credit Pack:
                </label>
                <div className="relative">
                  <select
                    value={paygOption}
                    onChange={(e) => setPaygOption(e.target.value as '3' | '10' | '50')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer pr-8"
                  >
                    <option value="3">3 credits - $2.00 ($0.66/img)</option>
                    <option value="10">10 credits - $5.00 ($0.50/img)</option>
                    <option value="50">50 credits - $15.00 ($0.30/img)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Price Display */}
              <div className="pt-1 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
                  {paygPrices[paygOption].price}
                </span>
                <span className="text-xs text-slate-400 font-semibold">one-time</span>
              </div>

              {/* Features List */}
              <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>One-time payment</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Credits never expire</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>No monthly renewal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Lossless PNG export</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-auto">
              <button
                type="button"
                onClick={() => handleCheckout(paygPrices[paygOption].planKey)}
                disabled={redirectingPlan !== null}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-70"
              >
                {redirectingPlan === paygPrices[paygOption].planKey ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Opening Checkout...</span>
                  </span>
                ) : (
                  <>
                    <span>Buy Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CARD 2: Lite ($4.99 / month) */}
          <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 bg-white flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3.5">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Entry Subscription
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-['Outfit'] mt-0.5">
                  Lite
                </h3>
                <p className="text-xs text-slate-500 mt-1">For casual individuals & creators</p>
              </div>

              {/* Price Display */}
              <div className="pt-1 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
                  $4.99
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ month</span>
              </div>

              {/* Features List */}
              <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2 font-semibold text-slate-800">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>40 credits every month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>AI Background Removal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Custom Color & Blur Canvas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Standard HD Quality</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>100% Ad-Free UI</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-auto">
              <button
                type="button"
                onClick={() => handleCheckout('lite_monthly')}
                disabled={redirectingPlan !== null}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {redirectingPlan === 'lite_monthly' ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Opening Checkout...</span>
                  </span>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CARD 3: Pro ($20.00 / month) - Most Popular */}
          <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-amber-400 bg-amber-50/20 shadow-lg flex flex-col justify-between">
            {/* Most Popular Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
              <span>Most Popular</span>
            </div>

            <div className="space-y-3.5">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-amber-700 tracking-wider">
                  Best Value
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-['Outfit'] mt-0.5 flex items-center gap-1.5">
                  <span>Pro</span>
                  <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                </h3>
                <p className="text-xs text-slate-500 mt-1">For active designers & studios</p>
              </div>

              {/* Price Display */}
              <div className="pt-1 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
                  $20.00
                </span>
                <span className="text-xs text-slate-500 font-semibold">/ month</span>
              </div>

              {/* Features List */}
              <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-amber-200/70">
                <li className="flex items-center gap-2 font-bold text-slate-900">
                  <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>200 credits / month</span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-amber-950">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Ultra-HD 4K exports</span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-amber-950">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>100% Ad-Free Experience</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Priority processing speed</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Batch processing capability</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-auto">
              <button
                type="button"
                onClick={() => handleCheckout('pro_monthly')}
                disabled={redirectingPlan !== null}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {redirectingPlan === 'pro_monthly' ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Opening Checkout...</span>
                  </span>
                ) : (
                  <>
                    <span>Subscribe · $20.00</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CARD 4: Unlimited Pass ($300 / year) */}
          <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 bg-white flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3.5">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Enterprise / VIP
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-['Outfit'] mt-0.5">
                  Unlimited Pass
                </h3>
                <p className="text-xs text-slate-500 mt-1">High volume & e-commerce brands</p>
              </div>

              {/* Price Display */}
              <div className="pt-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
                    $300
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ year</span>
                </div>
                <p className="text-[11px] text-slate-400">Billed annually</p>
              </div>

              {/* Features List */}
              <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2 font-bold text-slate-900">
                  <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Unlimited removals</span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-slate-800">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>VIP Instant Queue</span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-slate-800">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Full Commercial Rights</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Ultra-HD 4K downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>24/7 Priority Support</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-auto">
              <button
                type="button"
                onClick={() => handleCheckout('unlimited_monthly')}
                disabled={redirectingPlan !== null}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-70"
              >
                {redirectingPlan === 'unlimited_monthly' ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Opening Checkout...</span>
                  </span>
                ) : (
                  <>
                    <span>Get Pass · $300 / yr</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Trust Badges & Guarantee Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-Bit SSL Encrypted Official Lemon Squeezy Checkout</span>
          </div>

          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Visa, Mastercard, Apple Pay, Google Pay, PayPal</span>
          </div>
        </div>

      </div>
    </div>
  );
};
