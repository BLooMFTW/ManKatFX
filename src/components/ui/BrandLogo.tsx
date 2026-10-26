import React, { useState } from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  withTagline?: boolean;
  tagline?: string;
  badge?: string;
  className?: string;
  usePng?: boolean;
  pngSrc?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  withText = false,
  withTagline = false,
  tagline = 'Institutional Terminal',
  badge = 'PRO',
  className = '',
  usePng = true,
  pngSrc = '/logo.png',
}) => {
  const [imgError, setImgError] = useState(false);

  const dimensions = {
    xs: { box: 'w-7 h-7', rounded: 'rounded-lg', font: 'text-xs', badge: 'text-[8px] px-1' },
    sm: { box: 'w-8 h-8', rounded: 'rounded-xl', font: 'text-sm', badge: 'text-[9px] px-1.5' },
    md: { box: 'w-10 h-10', rounded: 'rounded-xl', font: 'text-base', badge: 'text-[10px] px-1.5' },
    lg: { box: 'w-14 h-14', rounded: 'rounded-2xl', font: 'text-2xl', badge: 'text-xs px-2' },
    xl: { box: 'w-18 h-18', rounded: 'rounded-2xl', font: 'text-3xl', badge: 'text-xs px-2.5' },
  }[size];

  const logoMark = (
    <div
      className={`relative ${dimensions.box} ${dimensions.rounded} bg-[#0E0D0A] border border-[#D4AF37]/50 shadow-md shadow-amber-500/10 flex items-center justify-center shrink-0 p-0.5 select-none overflow-hidden group`}
    >
      {usePng && !imgError ? (
        <img
          src={pngSrc}
          alt="ManKatFx Brand Emblem"
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover ${dimensions.rounded}`}
        />
      ) : (
        /* Bespoke Luxury Vector Monogram Fallback */
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_4px_rgba(212,175,55,0.3)]"
        >
          <defs>
            <linearGradient id="mankatGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF8DB" />
              <stop offset="35%" stopColor="#F2D675" />
              <stop offset="70%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8C6D1F" />
            </linearGradient>

            <linearGradient id="mankatRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FFF6DB" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8C6D1F" stopOpacity="0.7" />
            </linearGradient>

            <radialGradient id="mankatGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r="42" fill="url(#mankatGlow)" />

          <path
            d="M50 8 L86 28 L86 72 L50 92 L14 72 L14 28 Z"
            stroke="url(#mankatRimGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            opacity="0.6"
          />

          <path
            d="M26 72 L26 30 L40 50 L50 36 L60 50 L74 30 L74 72"
            stroke="url(#mankatGoldGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M50 48 L68 72"
            stroke="url(#mankatGoldGrad)"
            strokeWidth="5.5"
            strokeLinecap="round"
          />

          <line
            x1="50"
            y1="18"
            x2="50"
            y2="32"
            stroke="#FFF6DB"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <polygon points="50,42 54,48 50,54 46,48" fill="#FFF9E0" />
        </svg>
      )}
    </div>
  );

  if (!withText) {
    return <div className={`inline-flex items-center ${className}`}>{logoMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {logoMark}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span
            className={`${dimensions.font} font-black tracking-tight bg-gradient-to-r from-[#FFF6DB] via-[#F2D675] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-sm`}
          >
            ManKatFx
          </span>
          {badge && (
            <span
              className={`${dimensions.badge} uppercase font-extrabold tracking-widest rounded bg-gradient-to-r from-amber-500/15 to-amber-600/10 text-amber-300 border border-amber-500/30 shadow-sm`}
            >
              {badge}
            </span>
          )}
        </div>
        {withTagline && (
          <span className="text-[10px] text-zinc-400 font-medium tracking-wide">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};
