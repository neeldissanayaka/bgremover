import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  FileText,
  Lock,
  Sparkles,
  CheckCircle2,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Scale,
  RefreshCw,
  Mail,
  EyeOff,
  Database,
  Globe,
} from 'lucide-react';

export type LegalModalType = 'privacy' | 'terms';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalModalType;
  onOpenPricing?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  onOpenPricing,
}) => {
  const [activeTab, setActiveTab] = useState<LegalModalType>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#0B0F19] border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] overflow-hidden z-10 text-slate-200 font-sans">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/10 bg-[#070A12]/90 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
              {activeTab === 'privacy' ? (
                <Shield className="w-5 h-5 text-cyan-300" />
              ) : (
                <Scale className="w-5 h-5 text-cyan-300" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>{activeTab === 'privacy' ? 'Privacy & Data Protection' : 'Terms of Service'}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  bgremover.art
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switch buttons */}
            <div className="hidden sm:flex items-center bg-white/[0.06] p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'terms'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Terms of Service
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex sm:hidden border-b border-white/10 bg-[#060911] p-1.5 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 text-center rounded-lg font-bold transition-all ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 text-center rounded-lg font-bold transition-all ${
              activeTab === 'terms'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Terms of Service
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-8 text-sm leading-relaxed text-slate-300">
          
          {activeTab === 'privacy' ? (
            /* ================= PRIVACY POLICY CONTENT ================= */
            <div className="space-y-7 animate-in fade-in duration-150">
              
              {/* Highlight Card: 5-Minute Auto-Purge Guarantee */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/40 border border-cyan-500/30 shadow-lg">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <h3 className="font-bold text-white text-base font-['Outfit'] flex items-center gap-2">
                      <span>Strict 5-Minute Automated Ephemeral Purge</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        Zero Data Retention
                      </span>
                    </h3>
                    <p className="text-slate-300">
                      We treat your media with absolute confidentiality. All uploaded images and AI-isolated cutouts are processed strictly in volatile memory and permanently purged from our servers within <strong>5 minutes</strong>. We never store, catalogue, or sell your original photography.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-cyan-400" />
                  1. Information We Collect and Process
                </h3>
                <p>
                  At <strong>bgremover.art</strong>, data minimization is our core engineering standard. Depending on your interactions, we may collect:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>
                    <strong className="text-white">Transient Image Data:</strong> Image files you upload for background removal. These are utilized solely for computing alpha masks and are purged automatically within 5 minutes.
                  </li>
                  <li>
                    <strong className="text-white">Account Information (Optional):</strong> When you authenticate via Google Sign-In or email, we receive your email address, name, and profile picture to maintain credit balances and plan tiers.
                  </li>
                  <li>
                    <strong className="text-white">Local Browser Storage:</strong> We use your browser's <code className="text-cyan-300 bg-white/[0.06] px-1 py-0.5 rounded text-xs">localStorage</code> to track free daily quota counters (5 free removals/day) and local editor preferences without cross-site tracking.
                  </li>
                  <li>
                    <strong className="text-white">Payment & Billing Records:</strong> Subscription and credit transactions are handled exclusively through our Merchant of Record (<strong className="text-white">Lemon Squeezy</strong>). We never store raw credit card numbers or banking secrets on our servers.
                  </li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  2. AI Model Training & Data Isolation Guarantee
                </h3>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <p className="font-semibold text-white">
                    Does bgremover.art use my images to train AI models?
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300">
                    <strong>No. Absolutely not.</strong> Your images are never fed into machine learning datasets, never used for training or fine-tuning neural networks, and never inspected by human reviewers without your explicit consent.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  3. GDPR & CCPA Compliance (Your Rights)
                </h3>
                <p>
                  Regardless of your geographic location, we extend full global privacy protections:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <p className="font-bold text-white text-xs mb-1">Right to Access & Portability</p>
                    <p className="text-xs text-slate-400">Request an export of your registered account information and transaction ledger anytime.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <p className="font-bold text-white text-xs mb-1">Right to Erasure (Be Forgotten)</p>
                    <p className="text-xs text-slate-400">Request instant deletion of your user profile, email address, and associated credits.</p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  4. Contacting Our Data Privacy Team
                </h3>
                <p>
                  If you have inquiries regarding this Privacy Policy or wish to exercise your data rights, contact us at:
                </p>
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-300">privacy@bgremover.art</span>
                  <span className="text-xs text-slate-400">Response within 24–48 hours</span>
                </div>
              </section>

            </div>
          ) : (
            /* ================= TERMS OF SERVICE CONTENT ================= */
            <div className="space-y-7 animate-in fade-in duration-150">
              
              {/* Highlight Card: Commercial Rights */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/40 border border-blue-500/30 shadow-lg">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-300 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <h3 className="font-bold text-white text-base font-['Outfit'] flex items-center gap-2">
                      <span>100% Commercial & Creative Ownership</span>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                        Royalty-Free
                      </span>
                    </h3>
                    <p className="text-slate-300">
                      You retain full copyright, ownership, and commercial exploitation rights to all images processed through bgremover.art. Use your cutouts freely in print, e-commerce stores (Amazon, Shopify, Etsy), marketing ads, and client productions with zero royalties.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  1. Acceptance of Terms
                </h3>
                <p>
                  By accessing or using <strong>bgremover.art</strong> (the "Service"), you agree to be bound by these Terms of Service. If you disagree with any portion of these terms, you may not access or use our image processing utilities.
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  2. Acceptable Use & Prohibited Content
                </h3>
                <p>
                  You agree to use our background removal service responsibly. You may not upload or process:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>Media depicting non-consensual imagery, abuse, violence, or child sexual abuse material (CSAM).</li>
                  <li>Images that infringe on third-party intellectual property, trademarks, or publicity rights.</li>
                  <li>Malicious payloads, corrupted files, or scripts intended to exploit our FastAPI and neural processing infrastructure.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  3. Pricing, Credits & Subscription Plans
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <p>
                    bgremover.art offers multiple tiers to suit individual creators and enterprise teams:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="font-bold text-white text-xs">Free Daily Quota</p>
                      <p className="text-slate-400 text-xs mt-0.5">5 free removals every 24 hours for anonymous visitors and standard members.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="font-bold text-white text-xs">Pay-As-You-Go Packs</p>
                      <p className="text-slate-400 text-xs mt-0.5">Non-expiring credit bundles starting from $2.00 (10–50 credits).</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="font-bold text-white text-xs">Lite & Pro Subscriptions</p>
                      <p className="text-slate-400 text-xs mt-0.5">Monthly plans with recurring credit allotments and ultra-fast priority GPU servers.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="font-bold text-white text-xs">Unlimited Annual Pass</p>
                      <p className="text-slate-400 text-xs mt-0.5">Unlimited HD cutouts, batch processing queue, and dedicated priority support.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  4. Refund Policy & Money-Back Guarantee
                </h3>
                <p>
                  We strive for 100% satisfaction. If you experience technical defects, system downtime, or unsatisfactory AI cutout accuracy with paid credits, contact our support within <strong>7 days</strong> of purchase for a replacement credit or full refund.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-cyan-400" />
                  5. Service Availability & Disclaimers
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  The service is provided on an "AS IS" and "AS AVAILABLE" basis. While our distributed neural server architecture maintains 99.9% uptime, we are not liable for transient network disruptions or third-party ISP outages.
                </p>
              </section>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#070A12]/90 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-slate-400 flex items-center gap-2 text-center sm:text-left">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted with 256-bit SSL • PCI-DSS Compliant via Lemon Squeezy</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {onOpenPricing && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
              >
                View Plans & Pricing
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              I Understand
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
