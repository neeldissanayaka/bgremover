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
  Printer,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Cpu,
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

  const handlePrint = () => {
    window.print();
  };

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
      <div className="relative w-full max-w-4xl bg-[#090D16] border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] overflow-hidden z-10 text-slate-200 font-sans">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/10 bg-[#060911]/90 backdrop-blur-xl shrink-0">
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
                <span>{activeTab === 'privacy' ? 'Privacy Policy & Data Protection' : 'Terms of Service'}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  bgremover.art
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Legal Agreement • Last Updated: September 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10"
              title="Print legal document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

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
                      <span>Strict 5-Minute Automated Ephemeral Purge Guarantee</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        Zero Data Retention
                      </span>
                    </h3>
                    <p className="text-slate-300">
                      We treat your media with absolute confidentiality. All uploaded images and AI-isolated cutouts are processed strictly in volatile memory or client-side WebAssembly and permanently purged within <strong>5 minutes</strong>. We never store, catalogue, or sell your original photography.
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
                  At <strong>bgremover.art</strong>, data minimization is our core engineering standard. We only collect the minimal information necessary to deliver our background removal services:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-300">
                  <li>
                    <strong className="text-white">Transient Image Data:</strong> The image files you upload for background removal. Processing occurs on-device (via WebAssembly) or through ephemeral microservices. Images are used solely for calculating alpha transparency masks and are purged automatically within 5 minutes.
                  </li>
                  <li>
                    <strong className="text-white">Account Information (Optional):</strong> When you create an account via Google Sign-In or email/password, we store your email address, name, and profile avatar to maintain your credits balance and subscription plan.
                  </li>
                  <li>
                    <strong className="text-white">Local Browser Storage:</strong> We use your browser's <code className="text-cyan-300 bg-white/[0.06] px-1 py-0.5 rounded text-xs">localStorage</code> to track free daily quota counters (5 free removals/day) and editor preferences without cross-site tracking or tracking cookies.
                  </li>
                  <li>
                    <strong className="text-white">Payment & Billing Records:</strong> All payment transactions are processed exclusively through our Merchant of Record (<strong className="text-white">Lemon Squeezy</strong>), which adheres to PCI-DSS Level 1 security standards. We never store raw credit card numbers or banking secrets on our servers.
                  </li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  2. AI Model Training & Data Isolation Guarantee
                </h3>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <p className="font-semibold text-white">
                    Does bgremover.art use my images to train AI models?
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300">
                    <strong>No. Absolutely not.</strong> Your images are never used to train, retrain, or fine-tune neural network models, machine learning algorithms, or generative datasets. Your images remain private, isolated, and strictly temporary.
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
                  Under European General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), users have strict rights regarding their personal data:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <p className="font-bold text-white text-xs mb-1">Right to Access & Portability</p>
                    <p className="text-xs text-slate-400">Request a full copy of your registered profile information and credit balance anytime.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <p className="font-bold text-white text-xs mb-1">Right to Erasure (Be Forgotten)</p>
                    <p className="text-xs text-slate-400">Request instant deletion of your account, authentication records, and associated data.</p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  4. Security Protocols & Encryption
                </h3>
                <p>
                  We implement robust enterprise cybersecurity protections:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>256-bit TLS/HTTPS in-transit encryption for all communications.</li>
                  <li>Cryptographic password hashing using Web Crypto API SHA-256 + CSPRNG Salt.</li>
                  <li>Magic Bytes header signature inspection against malware, polyglots, and disguised binaries.</li>
                  <li>Protection against Decompression Bomb (Pixel Flood) attacks and SSRF network probing.</li>
                  <li>Brute-force login defense with automatic account rate-limiting lockout.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  5. Contacting Our Data Privacy Team
                </h3>
                <p>
                  If you have questions regarding this Privacy Policy or wish to exercise your data rights, contact us directly:
                </p>
                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-mono text-cyan-300">privacy@bgremover.art</span>
                  <span className="text-xs text-slate-400">Response guaranteed within 24–48 hours</span>
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
                      You retain full copyright, ownership, and commercial rights to all images processed through bgremover.art. Use your cutouts freely in print, e-commerce stores (Amazon, Shopify, Etsy), marketing campaigns, client projects, and social media with zero royalty obligations.
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
                  By accessing or using <strong>bgremover.art</strong> (the "Service"), you agree to be legally bound by these Terms of Service. If you do not agree to all terms, you may not use our image background removal platform.
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  2. Acceptable Use & Content Policy
                </h3>
                <p>
                  You agree to use bgremover.art only for lawful purposes. You are strictly prohibited from uploading or processing:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>Non-consensual sexual imagery, child exploitation material (CSAM), or extreme violence.</li>
                  <li>Images that infringe upon third-party copyrights, trademarks, or personal privacy rights.</li>
                  <li>Corrupted files, viruses, malware, or malicious payloads designed to harm the platform.</li>
                  <li>Automated bot scraping or high-volume DDoS attacks bypassing fair use limits.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  3. Pricing, Credits & Subscriptions
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <p>
                    bgremover.art provides free and paid plans to cater to individual creators and businesses:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="font-bold text-white text-xs">Free Daily Quota</p>
                      <p className="text-slate-400 text-xs mt-0.5">5 free high-quality removals every 24 hours with zero watermarks.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="font-bold text-white text-xs">Pay-As-You-Go Packs</p>
                      <p className="text-slate-400 text-xs mt-0.5">Non-expiring credit bundles starting from $2.00 (3, 10, or 50 credits).</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="font-bold text-white text-xs">Lite & Pro Subscriptions</p>
                      <p className="text-slate-400 text-xs mt-0.5">Monthly recurring credit allowances with priority rendering speeds.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="font-bold text-white text-xs">Unlimited Annual Pass</p>
                      <p className="text-slate-400 text-xs mt-0.5">Unlimited HD cutouts and VIP priority queue for high-volume workflows.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  4. Cancellation & 7-Day Refund Policy
                </h3>
                <p>
                  Subscriptions can be cancelled at any time with one click through your Lemon Squeezy customer portal. If you experience technical defects or are unsatisfied with credit performance, contact us within <strong>7 days</strong> of purchase for a replacement credit or full refund.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-cyan-400" />
                  5. Disclaimers & Limitation of Liability
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  The Service is provided on an "as-is" and "as-available" basis. While we strive for maximum accuracy and 99.9% uptime, bgremover.art is not liable for indirect, incidental, or consequential damages resulting from service usage or internet downtime.
                </p>
              </section>

              {/* Section 6 */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  6. Contact & Legal Inquiries
                </h3>
                <p>
                  For legal notices, DMCA takedown requests, or terms clarification, contact:
                </p>
                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-mono text-cyan-300">legal@bgremover.art</span>
                  <span className="text-xs text-slate-400">Support: support@bgremover.art</span>
                </div>
              </section>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#060911]/90 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
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

