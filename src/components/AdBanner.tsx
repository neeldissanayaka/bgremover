import React from 'react';
import { ExternalLink, Sparkles, Shield, Zap } from 'lucide-react';

interface AdBannerProps {
  type: 'header' | 'sidebar' | 'download';
  className?: string;
  isPro?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ type, className = '', isPro = false }) => {
  if (isPro) return null;

  if (type === 'header') {
    return (
      <div className={`w-full max-w-[728px] mx-auto my-4 ${className}`}>
        <div className="relative rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3 flex flex-col items-center justify-center min-h-[90px] shadow-sm hover:border-slate-400 transition-colors overflow-hidden group">
          <div className="absolute top-1 right-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            Advertisement
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center text-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">
                  Ultra-Fast Cloud Hosting & GPUs for AI
                </p>
                <p className="text-[11px] text-slate-500">
                  Deploy machine learning models with 99.99% uptime. $200 free credit.
                </p>
              </div>
            </div>
            <a
              href="#ad-sponsored"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-blue-600 transition-colors shadow-xs"
            >
              Learn More
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'sidebar') {
    return (
      <div className={`w-full max-w-[300px] mx-auto ${className}`}>
        <div className="relative rounded-2xl border border-dashed border-slate-300 bg-gradient-to-b from-slate-50 to-slate-100/70 p-5 flex flex-col items-center justify-between min-h-[250px] shadow-sm hover:border-slate-400 transition-all text-center">
          <span className="absolute top-2 right-3 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            Advertisement
          </span>
          
          <div className="mt-2 w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-1 my-2">
            <h4 className="text-sm font-bold text-slate-800">
              Pro Photo Retouching Suite
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Batch process 10,000+ e-commerce product photos in seconds with neural enhancements.
            </p>
          </div>

          <div className="w-full pt-2">
            <a
              href="#ad-sponsor-sidebar"
              onClick={(e) => e.preventDefault()}
              className="block w-full py-2 px-3 text-center text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              Claim Free Trial
            </a>
            <p className="text-[10px] text-slate-400 mt-1.5">Zero credit card required</p>
          </div>
        </div>
      </div>
    );
  }

  // Download section banner (728x90 Leaderboard)
  return (
    <div className={`w-full max-w-[728px] mx-auto my-6 ${className}`}>
      <div className="relative rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-4 flex items-center justify-between flex-wrap gap-4 shadow-xs">
        <div className="absolute top-1 right-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          Sponsored Link
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900">
              Enterprise Image CDN & Compression API
            </h5>
            <p className="text-[11px] text-slate-600">
              Reduce image payload size by 85% with next-gen AVIF & WebP optimization.
            </p>
          </div>
        </div>
        <a
          href="#ad-download"
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-2xs"
        >
          View API Docs
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
