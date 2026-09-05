import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  showText?: boolean;
  className?: string;
}

/**
 * Pixel-perfect SVG Icon based on the reference design:
 * - Folded document/image frame
 * - Left side solid vibrant blue
 * - Dynamic white swoosh blade
 * - Right side transparent checkerboard grid
 * - Person silhouette with blue-to-purple gradient
 * - Glowing 4-point AI magic sparkle stars
 */
export const LogoIcon: React.FC<{ sizeClass?: string; className?: string }> = ({
  sizeClass = 'w-9 h-9',
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl overflow-visible ${sizeClass} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Transparent Checkerboard Pattern */}
          <pattern id="logoCheckGrid" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="#E2E8F0" />
            <rect x="4" width="4" height="4" fill="#FFFFFF" />
            <rect y="4" width="4" height="4" fill="#FFFFFF" />
            <rect x="4" y="4" width="4" height="4" fill="#E2E8F0" />
          </pattern>

          {/* Gradients */}
          <linearGradient id="blueCardGrad" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0066FF" />
            <stop offset="0.6" stopColor="#0052CC" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>

          <linearGradient id="foldGrad" x1="24" y1="18" x2="42" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="1" stopColor="#0047BA" />
          </linearGradient>

          <linearGradient id="personGrad" x1="38" y1="30" x2="68" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0066FF" />
            <stop offset="0.5" stopColor="#4F46E5" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>

          <linearGradient id="sparkleCyan" x1="68" y1="10" x2="82" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#0080FF" />
          </linearGradient>

          <linearGradient id="sparklePurple" x1="72" y1="24" x2="84" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C084FC" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>

          {/* Clip path for main rounded image card */}
          <clipPath id="cardClip">
            <rect x="24" y="18" width="52" height="60" rx="12" />
          </clipPath>

          {/* Outer Ring Glow */}
          <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0066FF" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* 1. Main Document Card Container */}
        <g clipPath="url(#cardClip)">
          {/* Base Left Side: Royal Blue */}
          <rect x="24" y="18" width="52" height="60" fill="url(#blueCardGrad)" />

          {/* Right Side: Transparent Checkerboard Background */}
          <rect x="48" y="18" width="28" height="60" fill="url(#logoCheckGrid)" />

          {/* Person Silhouette (Inside Card) */}
          <g>
            {/* Person Head */}
            <circle cx="50" cy="42" r="8" fill="url(#personGrad)" />
            {/* Person Torso / Shoulders */}
            <path
              d="M34 76C34 65 41 57 50 57C59 57 66 65 66 76V78H34V76Z"
              fill="url(#personGrad)"
            />
          </g>

          {/* Dynamic White Cutting Arc Blade */}
          <path
            d="M20 78C32 75 42 66 52 50C62 34 68 22 72 16C73 18 69 32 58 48C48 64 36 74 20 78Z"
            fill="#FFFFFF"
            opacity="0.95"
          />
        </g>

        {/* Top-Left Folded Paper Flap Effect */}
        <path
          d="M24 18H40C40 28 34 34 24 34V18Z"
          fill="url(#foldGrad)"
          opacity="0.95"
        />
        <path
          d="M24 34C34 34 40 28 40 18L24 18V34Z"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="0.5"
          opacity="0.5"
        />

        {/* Card Border Line */}
        <rect
          x="24"
          y="18"
          width="52"
          height="60"
          rx="12"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Dynamic Sweeping Swoosh Extended Tail */}
        <path
          d="M18 78C26 78 36 74 46 64C56 54 66 38 74 16"
          fill="none"
          stroke="#0084FF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* AI Magic Sparkle Stars (Top Right) */}
        {/* Star 1: Primary Cyan Star */}
        <path
          d="M78 12L80 6L82 12L88 14L82 16L80 22L78 16L72 14L78 12Z"
          fill="url(#sparkleCyan)"
        />
        {/* Star 2: Small Blue Star */}
        <path
          d="M71 22L72 19L73 22L76 23L73 24L72 27L71 24L68 23L71 22Z"
          fill="#38BDF8"
        />
        {/* Star 3: Medium Purple Star */}
        <path
          d="M85 27L86.5 22L88 27L93 28.5L88 30L86.5 35L85 30L80 28.5L85 27Z"
          fill="url(#sparklePurple)"
        />
      </svg>
    </div>
  );
};

/**
 * Full Badge Logo matching the exact layout of reference_image_0.png:
 * Circular container with neon blue-to-purple gradient ring, centered emblem,
 * bold "bgremover.art" text, "REMOVE BACKGROUND INSTANTLY" subtitle, and gradient pill bar.
 */
export const FullBadgeLogo: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 320,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        <defs>
          {/* Outer Ring Gradient (Cyan to Vivid Purple) */}
          <linearGradient id="ringGrad" x1="40" y1="40" x2="360" y2="360" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0080FF" />
            <stop offset="0.5" stopColor="#4F46E5" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>

          {/* Underline Pill Gradient */}
          <linearGradient id="pillGrad" x1="160" y1="330" x2="240" y2="330" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0066FF" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>

          {/* Background Badge Drop Shadow */}
          <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#0F172A" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* 1. Outer Gradient Ring */}
        <circle cx="200" cy="200" r="185" stroke="url(#ringGrad)" strokeWidth="7" fill="none" />

        {/* 2. Inner White Badge Base */}
        <circle cx="200" cy="200" r="176" fill="#FFFFFF" filter="url(#badgeShadow)" />
        <circle cx="200" cy="200" r="176" fill="#F8FAFC" fillOpacity="0.5" />

        {/* 3. Centered Emblem Symbol */}
        <g transform="translate(110, 60) scale(1.8)">
          <LogoIcon sizeClass="w-[100px] h-[100px]" />
        </g>

        {/* 4. Brand Typography: bgremover.art */}
        <text
          x="200"
          y="282"
          textAnchor="middle"
          fontFamily="Outfit, Plus Jakarta Sans, sans-serif"
          fontWeight="900"
          fontSize="34"
          letterSpacing="-0.8px"
        >
          <tspan fill="#0066FF">bgremover</tspan>
          <tspan fill="#0F172A">.art</tspan>
        </text>

        {/* 5. Subtitle: REMOVE BACKGROUND INSTANTLY */}
        <text
          x="200"
          y="312"
          textAnchor="middle"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="700"
          fontSize="11.5"
          letterSpacing="2.8px"
          fill="#64748B"
        >
          REMOVE BACKGROUND INSTANTLY
        </text>

        {/* 6. Accent Underline Pill */}
        <rect x="175" y="328" width="50" height="4" rx="2" fill="url(#pillGrad)" />
      </svg>
    </div>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'auto',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', text: 'text-xl', badge: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-2xl', badge: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl', badge: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-4xl', badge: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      <LogoIcon sizeClass={currentSize.icon} />

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-black tracking-tight font-['Outfit'] leading-none ${currentSize.text} ${
              variant === 'dark'
                ? 'text-white'
                : variant === 'light'
                ? 'text-slate-900'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            <span className="text-blue-600">bgremover</span>
            <span className={variant === 'dark' ? 'text-white' : 'text-slate-900'}>.art</span>
          </span>
          <span className={`text-slate-400 font-bold uppercase tracking-wider text-[9px] mt-0.5 hidden sm:inline`}>
            AI Background Remover
          </span>
        </div>
      )}
    </div>
  );
};
