import React from 'react';
import { ShieldAlert, X, Crown, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DailyLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
}

export const DailyLimitModal: React.FC<DailyLimitModalProps> = ({
  isOpen,
  onClose,
  onOpenPricing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 sm:p-8 text-center overflow-hidden animate-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Badge */}
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black uppercase tracking-wider mb-2">
          Daily Quota Reached (3/3)
        </span>

        <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] text-slate-900 mb-2">
          You've used all 3 free daily removals
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-5">
          Your free daily limit resets automatically every 24 hours at midnight. Upgrade to Pro for unlimited background removals with zero wait times.
        </p>

        {/* Pro Plan Highlight */}
        <div className="bg-amber-50/60 rounded-2xl p-4 mb-5 text-left border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-amber-900 font-['Outfit'] flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              Pro & Unlimited Plans
            </span>
            <span className="text-xs font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
              From $4.99/mo
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Higher limits or unlimited background removals</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>100% Ad-Free interface & Ultra-HD 4K exports</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Fast VIP priority processing queue</span>
            </div>
          </div>
        </div>

        {/* Single Production Action Button */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              onClose();
              onOpenPricing();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>View Subscription & Credit Plans</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
