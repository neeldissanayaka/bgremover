import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  RotateCcw,
  Sparkles,
  Palette,
  Sliders,
  Image as ImageIcon,
  Layers,
  Check,
  Upload,
  Eye,
  Columns,
  Share2,
  Lock,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ComparisonSlider } from './ComparisonSlider';
import { AdBanner } from './AdBanner';
import { PASSPORT_PRESETS, SOLID_PALETTE, SCENIC_BACKDROPS } from '../data/samples';
import { ProcessedImage, BackgroundMode, UserProfile } from '../types';
import { renderCompositeCanvas, downloadCanvasImage } from '../utils/imageProcessing';

interface ImageEditorProps {
  processedImage: ProcessedImage;
  onReset: () => void;
  onUploadNew: () => void;
  onLimitExceeded: () => void;
  currentUser?: UserProfile | null;
  onOpenPricing?: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  processedImage,
  onReset,
  onUploadNew,
  onLimitExceeded,
  currentUser,
  onOpenPricing,
}) => {
  const [bgMode, setBgMode] = useState<BackgroundMode>('transparent');
  const [solidColor, setSolidColor] = useState<string>('#FFFFFF');
  const [blurRadius, setBlurRadius] = useState<number>(18);
  const [customBackdropUrl, setCustomBackdropUrl] = useState<string | undefined>(undefined);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp'>('png');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'slider' | 'preview'>('slider');
  
  const backdropInputRef = useRef<HTMLInputElement>(null);

  // Trigger download from canvas
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const canvas = await renderCompositeCanvas({
        originalUrl: processedImage.originalUrl,
        transparentUrl: processedImage.transparentUrl,
        mode: bgMode,
        solidColor,
        blurRadius,
        customBackdropUrl,
      });

      await downloadCanvasImage(
        canvas,
        processedImage.fileName || 'bgremover_cutout',
        downloadFormat,
        0.95
      );

      // Trigger celebratory confetti animation
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCustomBackdropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setCustomBackdropUrl(url);
      setBgMode('customImage');
    }
  };

  return (
    <section className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Top Header / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Check className="w-3 h-3" /> Cutout Ready
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {processedImage.width} × {processedImage.height} px
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-slate-900">
            Background Remover Studio
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onUploadNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Another Image
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Left: Canvas Preview / Slider, Right: Editing Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* ================= LEFT 7 COLS: CANVAS & COMPARISON SLIDER ================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* View mode switcher tabs */}
          <div className="flex items-center justify-between bg-slate-100/80 p-1 rounded-xl w-fit">
            <button
              onClick={() => setViewMode('slider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'slider'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Before / After Slider
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Cutout Result
            </button>
          </div>

          {/* Interactive Canvas / Slider View */}
          {viewMode === 'slider' ? (
            <ComparisonSlider
              originalUrl={processedImage.originalUrl}
              processedUrl={processedImage.transparentUrl}
              bgMode={bgMode}
              solidColor={solidColor}
              blurRadius={blurRadius}
              customBackdropUrl={customBackdropUrl}
            />
          ) : (
            <div className="relative w-full h-[360px] sm:h-[480px] lg:h-[540px] rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-950 flex items-center justify-center">
              {/* Background Layer */}
              {bgMode === 'transparent' && <div className="absolute inset-0 bg-checkerboard w-full h-full" />}
              {bgMode === 'color' && <div className="absolute inset-0 w-full h-full transition-colors" style={{ backgroundColor: solidColor }} />}
              {bgMode === 'blur' && (
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <img
                    src={processedImage.originalUrl}
                    alt="Blurred background"
                    className="absolute inset-0 w-full h-full object-contain scale-110 opacity-90 transition-[filter] duration-75"
                    style={{ filter: blurRadius > 0 ? `blur(${blurRadius}px)` : 'none' }}
                  />
                </div>
              )}
              {bgMode === 'customImage' && customBackdropUrl && (
                <img
                  src={customBackdropUrl}
                  alt="Custom backdrop"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Subject Cutout */}
              <img
                src={processedImage.transparentUrl}
                alt="Cutout Subject"
                className="absolute inset-0 w-full h-full object-contain z-10"
              />
            </div>
          )}

          {/* Ad Space below the slider */}
          <AdBanner type="header" className="!my-3" />

        </div>

        {/* ================= RIGHT 5 COLS: CONTROLS & BACKGROUND CHANGER ================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Background Replacement Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-lg space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-600" />
                Custom Background Changer
              </h3>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                HTML5 Canvas
              </span>
            </div>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setBgMode('transparent')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  bgMode === 'transparent'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-checkerboard border border-slate-300 mb-1" />
                Transparent
              </button>

              <button
                type="button"
                onClick={() => setBgMode('color')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  bgMode === 'color'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-lg border border-slate-300 mb-1"
                  style={{ backgroundColor: solidColor }}
                />
                Solid Color
              </button>

              <button
                type="button"
                onClick={() => setBgMode('blur')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  bgMode === 'blur'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 to-rose-400 blur-[2px] border border-slate-300 mb-1" />
                Blur Bokeh
              </button>

              <button
                type="button"
                onClick={() => setBgMode('customImage')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  bgMode === 'customImage'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                Backdrop
              </button>
            </div>

            {/* Mode-Specific Sub-Panels */}
            
            {/* 1. Solid Color & Passport Presets */}
            {bgMode === 'color' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                
                {/* Official Passport / ID Presets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800">
                      Passport & ID Official Presets
                    </label>
                    <span className="text-[10px] text-slate-400">ICAO & Visa Compliant</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PASSPORT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSolidColor(preset.hexColor);
                          setBgMode('color');
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all ${
                          solidColor.toUpperCase() === preset.hexColor.toUpperCase()
                            ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/50 font-bold'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                          style={{ backgroundColor: preset.hexColor }}
                        />
                        <span className="truncate text-slate-800 text-[11px]">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Swatches + Native Hex Picker */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800">
                      Palette & Custom Hex
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {solidColor.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {SOLID_PALETTE.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => setSolidColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-7 h-7 rounded-lg border border-slate-300 shadow-2xs transition-transform hover:scale-110 focus:outline-none ${
                          solidColor.toUpperCase() === hex.toUpperCase()
                            ? 'ring-2 ring-blue-600 scale-110'
                            : ''
                        }`}
                        title={hex}
                      />
                    ))}

                    {/* Custom HTML Color Picker */}
                    <label
                      className="relative w-8 h-8 rounded-lg border border-dashed border-slate-400 bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer overflow-hidden"
                      title="Custom Color"
                    >
                      <input
                        type="color"
                        value={solidColor}
                        onChange={(e) => setSolidColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Palette className="w-4 h-4 text-slate-600" />
                    </label>
                  </div>
                </div>

              </div>
            )}

            {/* 2. Blur Background Settings */}
            {bgMode === 'blur' && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    Blur Depth Radius
                  </span>
                  <span className="font-mono text-blue-600 font-bold">{blurRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={blurRadius}
                  onChange={(e) => setBlurRadius(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-[11px] text-slate-500">
                  Blurs the original environment to simulate DSLR portrait depth-of-field bokeh.
                </p>
              </div>
            )}

            {/* 3. Custom Scenic Backdrops */}
            {bgMode === 'customImage' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Scenic Backdrop Presets
                  </label>
                  <button
                    onClick={() => backdropInputRef.current?.click()}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Upload Backdrop
                  </button>
                  <input
                    ref={backdropInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomBackdropUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {SCENIC_BACKDROPS.map((backdrop) => (
                    <button
                      key={backdrop.id}
                      onClick={() => setCustomBackdropUrl(backdrop.imageUrl)}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        customBackdropUrl === backdrop.imageUrl
                          ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={backdrop.previewUrl}
                        alt={backdrop.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] font-bold text-white py-0.5 text-center truncate px-1">
                        {backdrop.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ================= DOWNLOAD BOX & FORMAT SELECTOR ================= */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl space-y-5">
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold font-['Outfit'] flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  Download Image
                </h4>
                <p className="text-xs text-slate-400">100% Free • High Definition • No Watermark</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                HD Quality
              </span>
            </div>

            {/* Format Toggle (PNG vs WebP) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDownloadFormat('png')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                  downloadFormat === 'png'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>PNG (Lossless)</span>
                {downloadFormat === 'png' && <Check className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setDownloadFormat('webp')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                  downloadFormat === 'webp'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>WebP (Ultra-Fast)</span>
                {downloadFormat === 'webp' && <Check className="w-4 h-4" />}
              </button>
            </div>

            {/* Big Action Download CTA */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-[0.98] text-white font-bold text-base shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Generating Cutout...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Free {downloadFormat.toUpperCase()} ({processedImage.width}×{processedImage.height})
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Resolution: {processedImage.width} × {processedImage.height} px</span>
              <span className="text-emerald-400 font-semibold">Zero Compression Loss</span>
            </div>

          </div>

          {/* Sidebar Advertisement Container (Hidden for PRO users) */}
          <AdBanner type="sidebar" isPro={currentUser?.isPro} />

        </div>

      </div>

    </section>
  );
};
