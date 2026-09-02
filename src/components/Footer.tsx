import React from 'react';
import { Sparkles, Shield, Lock, Zap, Crown } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  onOpenPricing: () => void;
  onOpenAuth?: () => void;
  onOpenLegal?: (type: 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPricing, onOpenAuth, onOpenLegal }) => {
  return (
    <>
      {/* Clean Minimalist Ad & Keyword Sub-bar matching theme */}
      <div className="bg-white border-t border-slate-100 py-4 px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="hidden lg:block w-[280px] text-[10px] font-black text-slate-300 uppercase tracking-widest">
          bg remover • background remover • transparent png
        </div>
        <div className="flex-1 flex justify-center w-full max-w-[468px]">
          <div className="w-full h-[42px] bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Advertisement - 468x40
          </div>
        </div>
        <div className="text-center md:text-right text-[10px] text-slate-400 leading-tight">
          © {new Date().getFullYear()} bgremover.art • High-performance AI • Auto-purged after 5 min
        </div>
      </div>

      {/* Main Dark Minimalist Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
            
            {/* Col 1 & 2: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Logo size="md" variant="dark" />
              </div>
              
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                The automatic AI background remover utility. Designed for creators, e-commerce sellers, and teams worldwide with high resolution outputs and zero watermarks.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Auto-Purge 5 Min</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-blue-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>100% Privacy</span>
                </div>
              </div>
            </div>

            {/* Col 3: Popular Tools */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Popular Tools
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Transparent PNG Maker
                  </a>
                </li>
                <li>
                  <a href="#passport-presets" className="hover:text-white transition-colors">
                    Passport Photo Colors
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Background Blur Tool
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    E-Commerce Product Cutouts
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Plans & Help */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Plans & Pricing
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={onOpenPricing}
                    className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                  >
                    Pay-as-you-go (from $2.00)
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenPricing}
                    className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                  >
                    Lite ($4.99/mo)
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenPricing}
                    className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Pro ($20.00/mo)
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenPricing}
                    className="hover:text-purple-400 transition-colors text-left cursor-pointer"
                  >
                    Unlimited Pass ($300/year)
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 5: Security & Policy */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Security & Privacy
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="text-xs text-slate-400">
                  Uploaded images are processed securely and automatically purged from memory within 5 minutes.
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenLegal?.('privacy')}
                    className="hover:text-cyan-400 text-slate-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span>Privacy Policy & Data Security</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenLegal?.('terms')}
                    className="hover:text-cyan-400 text-slate-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span>Terms of Service & License</span>
                  </button>
                </li>
                <li className="text-xs text-slate-500 pt-1">
                  Domain: <strong className="text-slate-300">bgremover.art</strong>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} bgremover.art. All rights reserved. Automatic Background Removal Utility.</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onOpenLegal?.('privacy')}
                className="hover:text-slate-300 cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal?.('terms')}
                className="hover:text-slate-300 cursor-pointer"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button onClick={onOpenPricing} className="hover:text-slate-300 cursor-pointer">
                Pricing
              </button>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
};

