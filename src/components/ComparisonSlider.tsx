import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, MoveHorizontal, Eye, EyeOff, Scaling } from 'lucide-react';

interface ComparisonSliderProps {
  originalUrl: string;
  processedUrl: string;
  bgMode?: 'transparent' | 'color' | 'blur' | 'customImage';
  solidColor?: string;
  blurRadius?: number;
  customBackdropUrl?: string;
  heightClass?: string;
  fitMode?: 'cover' | 'contain';
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalUrl,
  processedUrl,
  bgMode = 'transparent',
  solidColor = '#FFFFFF',
  blurRadius = 15,
  customBackdropUrl,
  heightClass = 'h-[360px] sm:h-[480px] lg:h-[540px]',
  fitMode: initialFitMode = 'contain',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showOriginalOnly, setShowOriginalOnly] = useState<boolean>(false);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>(initialFitMode);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      className={`relative w-full ${heightClass} select-none rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-950 flex items-center justify-center`}
    >
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold shadow-md flex items-center gap-1.5 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Interactive Comparison
        </span>
      </div>

      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        {/* Toggle Object Fit (Cover vs Contain) */}
        <button
          onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
          className="px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-medium transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          title={`Switch image scaling (Current: ${fitMode})`}
        >
          <Scaling className="w-3.5 h-3.5 text-blue-400" />
          <span className="capitalize">{fitMode}</span>
        </button>

        {/* Toggle Original Only View */}
        <button
          onClick={() => setShowOriginalOnly(!showOriginalOnly)}
          className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md text-xs font-medium transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
            showOriginalOnly
              ? 'bg-blue-600 text-white shadow-blue-500/30'
              : 'bg-black/60 text-white hover:bg-black/80'
          }`}
          title="Hold/Toggle Original"
        >
          {showOriginalOnly ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Original Only</span>
        </button>
      </div>

      {/* Main Slider Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-full cursor-ew-resize overflow-hidden"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
      >
        {/* ========================================================================= */}
        {/* LAYER 1: AFTER / PROCESSED (CUTOUT) - IDENTICAL ABSOLUTE 100% POSITIONING */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {/* Custom Background behind the transparent cutout */}
          {bgMode === 'transparent' && (
            <div className="absolute inset-0 w-full h-full bg-checkerboard" />
          )}

          {bgMode === 'color' && (
            <div
              className="absolute inset-0 w-full h-full transition-colors"
              style={{ backgroundColor: solidColor }}
            />
          )}

          {bgMode === 'blur' && (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <img
                src={originalUrl}
                alt="Blurred Background"
                className="absolute inset-0 w-full h-full scale-110 opacity-90 transition-[filter] duration-75"
                style={{
                  objectFit: fitMode,
                  objectPosition: 'center',
                  filter: blurRadius > 0 ? `blur(${blurRadius}px)` : 'none',
                }}
              />
            </div>
          )}

          {bgMode === 'customImage' && customBackdropUrl && (
            <img
              src={customBackdropUrl}
              alt="Custom Scenic Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Cutout Subject Image: absolute inset-0 w-full h-full matching fitMode */}
          <img
            src={processedUrl}
            alt="Cutout Subject"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{
              objectFit: fitMode,
              objectPosition: 'center',
            }}
          />

          {/* Badge Label */}
          <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-xs font-bold tracking-wide pointer-events-none shadow-md">
            AFTER (Cutout)
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LAYER 2: BEFORE / ORIGINAL - IDENTICAL POSITION & SIZING WITH CLIP-PATH   */}
        {/* ========================================================================= */}
        {!showOriginalOnly ? (
          <div
            className="absolute inset-0 w-full h-full overflow-hidden z-20 pointer-events-none"
            style={{
              clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
              WebkitClipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
            }}
          >
            {/* Dark contrast backdrop to match container */}
            <div className="absolute inset-0 w-full h-full bg-slate-950/40" />

            {/* Original Photo: identical position: absolute, inset-0, w-full, h-full, matching fitMode & position */}
            <img
              src={originalUrl}
              alt="Original Photo"
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                objectFit: fitMode,
                objectPosition: 'center',
              }}
            />

            {/* Badge Label */}
            <div className="absolute bottom-4 left-4 z-20 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-xs font-bold tracking-wide pointer-events-none shadow-md">
              BEFORE (Original)
            </div>
          </div>
        ) : (
          /* Full Original Toggle Mode */
          <div className="absolute inset-0 w-full h-full z-20 bg-slate-950">
            <img
              src={originalUrl}
              alt="Original View"
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: fitMode,
                objectPosition: 'center',
              }}
            />
            <div className="absolute bottom-4 left-4 z-20 px-3 py-1 rounded-lg bg-black/75 text-white text-xs font-bold">
              ORIGINAL PHOTO
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LAYER 3: VERTICAL SLIDER DIVIDER LINE & DRAGGABLE HANDLE BUTTON           */}
        {/* ========================================================================= */}
        {!showOriginalOnly && (
          <div
            className="absolute top-0 bottom-0 z-30 -translate-x-1/2 pointer-events-none transition-none"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* High-visibility divider line */}
            <div className="w-[3px] h-full bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)]" />

            {/* Circular Handle Grab Button */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-slate-900 shadow-2xl border-2 border-blue-600 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
              <MoveHorizontal className="w-5 h-5 text-blue-600" />
            </div>

            {/* Percentage Indicator Badge */}
            <div className="absolute top-3 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-white whitespace-nowrap shadow-md">
              {Math.round(sliderPosition)}%
            </div>
          </div>
        )}
      </div>

      {/* Instructional Helper Hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-[11px] font-medium text-white/80 bg-black/60 backdrop-blur-sm px-3.5 py-0.5 rounded-full hidden sm:block shadow-sm">
        Drag slider left or right to inspect cut accuracy
      </div>
    </div>
  );
};
