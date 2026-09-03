import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { SAMPLE_IMAGES } from '../data/samples';
import { SampleImage } from '../types';
import { validateImageFile } from '../utils/imageProcessing';

interface HeroSectionProps {
  onFileSelected: (file: File) => void;
  onSampleSelected: (sample: SampleImage) => void;
  onOpenUrlModal: () => void;
  isProcessing: boolean;
  progressPct: number;
  progressStep: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onFileSelected,
  onSampleSelected,
  onOpenUrlModal,
  isProcessing,
  progressPct,
  progressStep,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global clipboard paste listener (Ctrl+V / Cmd+V anywhere on page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileValidationAndUpload(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isProcessing]);

  const handleFileValidationAndUpload = (file: File) => {
    setErrorMsg(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid image file.');
      return;
    }
    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileValidationAndUpload(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileValidationAndUpload(file);
      // Reset input value so re-selecting same file fires change
      e.target.value = '';
    }
  };

  return (
    <section className="relative w-full min-h-[calc(100vh-80px)] flex flex-col justify-center py-6 sm:py-10 lg:py-12 overflow-x-hidden overflow-y-visible isolate bg-[#05070B] text-white">
      
      {/* ================= HERO BACKGROUND: LUXURY MONOCHROMATIC OBSIDIAN PATTERN & MESH ================= */}
      <div 
        className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden w-full max-w-full" 
        aria-hidden="true"
      >
        {/* 1. Deep Luxury Dark Obsidian & Slate Gradient Canvas */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030407] via-[#06080F] to-[#0A0E18] pointer-events-none" />

        {/* 2. Ambient Deep Luxury Atmospheric Glows */}
        <div className="absolute -top-32 left-1/4 -translate-x-1/2 w-[350px] sm:w-[750px] h-[350px] sm:h-[750px] bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-purple-600/10 rounded-full blur-[70px] sm:blur-[100px] animate-vivid-pulse-1 pointer-events-none" />
        <div className="absolute top-10 -right-24 w-[320px] sm:w-[700px] h-[320px] sm:h-[700px] bg-gradient-to-bl from-cyan-500/20 via-blue-600/15 to-indigo-700/10 rounded-full blur-[80px] sm:blur-[110px] animate-vivid-pulse-2 pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 -translate-x-1/2 w-[300px] sm:w-[600px] h-[250px] sm:h-[400px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-transparent rounded-full blur-[60px] sm:blur-[90px] pointer-events-none" />

        {/* 3. High-Tech Precision Dark Grid & Laser Crosshair Pattern */}
        <svg
          className="absolute inset-0 w-full h-full text-white/[0.07] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="hero-dark-tech-grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              {/* Subtle Dark Checkerboard squares */}
              <rect x="0" y="0" width="24" height="24" fill="white" opacity="0.02" />
              <rect x="24" y="24" width="24" height="24" fill="white" opacity="0.02" />
              
              {/* Fine boundary grid lines */}
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.8"
              />
              {/* Glowing precision cyber nodes */}
              <circle cx="0" cy="0" r="1.5" fill="#38BDF8" opacity="0.75" />
              <circle cx="48" cy="0" r="1.5" fill="#FFFFFF" opacity="0.6" />
              <circle cx="0" cy="48" r="1.5" fill="#818CF8" opacity="0.6" />
              <circle cx="48" cy="48" r="1.5" fill="#38BDF8" opacity="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dark-tech-grid)" />
        </svg>

        {/* 4. Luxury Monochromatic Flowing Bezier Curves */}
        <svg
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[750px] opacity-60 pointer-events-none"
          viewBox="0 0 1440 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-80 320C220 140 540 500 860 240C1180 -20 1380 340 1560 220"
            stroke="url(#dark-flow-grad-1)"
            strokeWidth="2.5"
            strokeDasharray="8 6"
          />
          <path
            d="M-60 200C320 380 720 100 1120 380C1360 520 1540 180 1660 300"
            stroke="url(#dark-flow-grad-2)"
            strokeWidth="2"
          />
          <path
            d="M-40 450C260 280 660 580 1060 320C1320 140 1480 440 1620 380"
            stroke="url(#dark-flow-grad-3)"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <defs>
            <linearGradient id="dark-flow-grad-1" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" stopOpacity="0.1" />
              <stop offset="0.3" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="0.6" stopColor="#818CF8" stopOpacity="0.9" />
              <stop offset="0.85" stopColor="#E2E8F0" stopOpacity="0.7" />
              <stop offset="1" stopColor="#38BDF8" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="dark-flow-grad-2" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0EA5E9" stopOpacity="0.1" />
              <stop offset="0.4" stopColor="#38BDF8" stopOpacity="0.7" />
              <stop offset="0.7" stopColor="#60A5FA" stopOpacity="0.8" />
              <stop offset="1" stopColor="#0EA5E9" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="dark-flow-grad-3" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818CF8" stopOpacity="0.1" />
              <stop offset="0.5" stopColor="#C084FC" stopOpacity="0.6" />
              <stop offset="1" stopColor="#38BDF8" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* 5. Floating Luxury Frosted Micro-Shapes */}
        <div className="absolute top-20 left-[6%] w-7 h-7 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md animate-subtle-float shadow-lg pointer-events-none" />
        <div className="absolute top-36 right-[8%] w-8 h-8 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md animate-subtle-float-reverse shadow-lg pointer-events-none" />
        <div className="absolute bottom-28 left-[12%] w-5 h-5 rounded-lg bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-md animate-subtle-float pointer-events-none" />
        <div className="absolute bottom-20 right-[15%] w-6 h-6 rounded-xl bg-blue-500/10 border border-blue-400/20 backdrop-blur-md animate-subtle-float-reverse pointer-events-none" />

        {/* 6. Subtle Radial Vignette for Deep Luxury Focus */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#05070B_95%)] opacity-80 pointer-events-none" />
      </div>

      {/* Seamless Bottom Gradient Transition to Light/Slate Section */}
      <div 
        className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#f8fafc] via-[#05070B]/50 to-transparent pointer-events-none select-none z-0" 
        aria-hidden="true" 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        
        {/* Error Notification Banner if file error */}
        {errorMsg && (
          <div
            className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-sm flex items-center justify-between shadow-lg backdrop-blur-md animate-in fade-in"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-bold text-rose-300 hover:text-white px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-16 items-center">
          
          {/* ================= LEFT COLUMN: HERO HEADLINE & VALUE PROPOSITION ================= */}
          <div
            className="lg:col-span-6 space-y-4 sm:space-y-6 lg:space-y-8 text-center lg:text-left"
          >
            
            {/* Top Pill Badge */}
            <div
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-cyan-300 text-[10px] sm:text-xs font-bold tracking-wide uppercase shadow-lg shadow-black/40 backdrop-blur-md"
            >
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-cyan-400 animate-pulse" />
              Next-Gen AI Image Cutout
            </div>

            {/* Main Headline */}
            <div className="space-y-2 sm:space-y-4">
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[66px] xl:text-[74px] font-extrabold leading-[1.12] sm:leading-[1.05] tracking-tight text-white font-['Outfit'] drop-shadow-sm">
                <span className="sr-only">bgremover - Free AI </span>
                Remove Image <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Background
                </span>
              </h1>

              {/* Subtitle with vibrant blue badge for 'Free' */}
              <div className="flex items-center justify-center lg:justify-start space-x-2 sm:space-x-3.5 flex-wrap">
                <p className="text-sm sm:text-lg lg:text-2xl text-slate-300 font-light">
                  100% Automatically and
                </p>
                <span className="bg-blue-600 text-white px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-lg text-xs sm:text-base lg:text-lg font-black uppercase tracking-widest shadow-xl shadow-blue-500/35 transition-transform hover:scale-105 inline-block border border-blue-400/30">
                  Free
                </span>
              </div>
            </div>


            {/* Social Proof & Features */}
            <div className="space-y-3 sm:space-y-5 pt-1">
              
              {/* Avatar stack */}
              <div className="flex gap-2.5 sm:gap-3 items-center justify-center lg:justify-start text-slate-400">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-slate-200 shadow-sm">JD</div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-slate-100 shadow-sm">SK</div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-900 border-2 border-slate-600 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-cyan-200 shadow-sm">AL</div>
                </div>
                <p className="text-[11px] sm:text-sm font-medium text-slate-300">
                  Used by 2.4M+ designers & creators worldwide
                </p>
              </div>

              {/* Feature Pill Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3.5 w-full max-w-md mx-auto lg:mx-0">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs font-bold text-slate-200 uppercase tracking-tighter bg-white/[0.05] p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg backdrop-blur-md hover:bg-white/[0.09] hover:border-white/20 hover:scale-[1.02] transition-all">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap">HD PNG Download</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs font-bold text-slate-200 uppercase tracking-tighter bg-white/[0.05] p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg backdrop-blur-md hover:bg-white/[0.09] hover:border-white/20 hover:scale-[1.02] transition-all">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
                  <span className="whitespace-nowrap">5-Sec AI Cutout</span>
                </div>
              </div>

              {/* Trust note */}
              <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-400 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Auto-purged in 5 mins
                </span>
                <span className="text-slate-600">•</span>
                <span>Max 10MB JPG, PNG, WebP</span>
              </div>

            </div>

          </div>

          {/* ================= RIGHT COLUMN: FLOATING DROPZONE & UPLOAD CARD ================= */}
          <div
            className="lg:col-span-6 flex flex-col items-center relative w-full z-20"
          >
            
            {/* Dynamic Ambient Luxury Glow behind Upload Card */}
            <div
              className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 via-indigo-600/25 to-cyan-500/30 rounded-[50px] blur-3xl -z-10 pointer-events-none select-none animate-pulse"
              style={{ animationDuration: '5s' }}
              aria-hidden="true"
            />

            {/* Main Upload Card - Luxury Frosted Dark Glass */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full max-w-md bg-[#0B0F19]/90 rounded-3xl sm:rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.85)] p-4 sm:p-7 lg:p-9 border transition-all duration-200 backdrop-blur-2xl ${
                isDragOver
                  ? 'border-blue-400 ring-4 ring-blue-500/20 bg-blue-950/40 scale-[1.01]'
                  : 'border-white/12 hover:border-white/25'
              }`}
            >
              
              {/* Hidden Native File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleInputChange}
                className="hidden"
              />

              {/* Processing Overlay State */}
              {isProcessing ? (
                <div className="py-8 sm:py-12 px-2 sm:px-4 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 animate-in fade-in">
                  <div className="relative w-14 h-14 sm:w-20 sm:h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce" />
                    </div>
                  </div>

                  <div className="space-y-1 w-full max-w-xs">
                    <h3 className="text-base sm:text-xl font-bold text-white font-['Outfit']">
                      Removing Background...
                    </h3>
                    <p className="text-xs text-slate-400">{progressStep}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-xs bg-slate-800/80 h-2 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {progressPct}%
                  </span>
                </div>
              ) : (
                /* Standard Upload Dropzone UI */
                <div className="space-y-3.5 sm:space-y-5">
                  
                  <div className="text-center space-y-2 sm:space-y-3">
                    {/* Big Rounded Blue CTA Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] hover:scale-[1.01] text-white py-3.5 sm:py-5 lg:py-5.5 rounded-2xl sm:rounded-3xl text-base sm:text-xl lg:text-2xl font-bold transition-all shadow-xl shadow-blue-600/35 hover:shadow-2xl hover:shadow-blue-500/50 cursor-pointer flex items-center justify-center gap-2.5 sm:gap-3 group border border-blue-400/30 touch-manipulation"
                    >
                      <Upload className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-y-0.5 transition-transform" />
                      <span>Upload Image</span>
                    </button>

                    {/* Drag & Drop Area Text */}
                    <p className="text-slate-400 text-xs sm:text-sm font-medium">
                      or drop a file, paste image or{' '}
                      <button
                        type="button"
                        onClick={onOpenUrlModal}
                        className="text-cyan-400 underline cursor-pointer decoration-2 underline-offset-4 font-semibold hover:text-cyan-300 hover:decoration-cyan-300 touch-manipulation"
                      >
                        URL
                      </button>
                    </p>
                  </div>

                  {/* Drag & Drop Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 rounded-2xl sm:rounded-[32px] h-24 sm:h-36 lg:h-38 bg-white/[0.02] flex flex-col items-center justify-center space-y-1 sm:space-y-2 group cursor-pointer hover:border-cyan-400/60 hover:bg-blue-600/[0.08] active:scale-[0.99] hover:scale-[1.01] transition-all touch-manipulation"
                  >
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/10 border border-white/10 shadow-sm flex items-center justify-center text-slate-300 group-hover:text-cyan-300 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest group-hover:text-cyan-300 transition-colors">
                      Drag & Drop Here
                    </span>
                    <span className="text-[9px] sm:text-[11px] text-slate-400">
                      or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[9px] sm:text-[10px] text-slate-200 font-mono shadow-xs">Ctrl+V</kbd>
                    </span>
                  </div>

                </div>
              )}

            </div>

            {/* Sample Image Picker Bar (Below the card as requested) */}
            <div 
              className="mt-4 sm:mt-6 w-full max-w-md z-20"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  No image? Try one of these:
                </p>
                <span
                  onClick={() => onSampleSelected(SAMPLE_IMAGES[0])}
                  className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest cursor-pointer hover:text-cyan-300 transition-colors touch-manipulation"
                >
                  Instant AI Demo
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {SAMPLE_IMAGES.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => onSampleSelected(sample)}
                    className="aspect-square rounded-xl sm:rounded-2xl bg-[#131826] border border-white/15 shadow-md cursor-pointer hover:border-cyan-400/80 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 overflow-hidden relative group touch-manipulation"
                    title={`Try sample: ${sample.title}`}
                  >
                    <img
                      src={sample.thumbnailUrl}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1 sm:p-1.5 pointer-events-none">
                      <span className="text-[9px] sm:text-[10px] font-bold text-white leading-tight truncate">
                        {sample.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
