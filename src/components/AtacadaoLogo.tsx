import React from 'react';

interface AtacadaoLogoProps {
  className?: string;
  showReflection?: boolean;
}

export const AtacadaoLogo: React.FC<AtacadaoLogoProps> = ({ className = "h-16", showReflection = false }) => {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Atacadão Striped 'A' Icon */}
        <svg viewBox="0 0 100 100" className="h-full w-auto aspect-square drop-shadow-sm">
          <defs>
            <linearGradient id="aGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F96302" />
              <stop offset="100%" stopColor="#D84900" />
            </linearGradient>
          </defs>
          {/* Orange 3D Letter A shape */}
          <path d="M 50 10 L 85 85 L 65 85 L 50 52 L 35 85 L 15 85 Z" fill="url(#aGrad)" />
          {/* Inner triangle cutout */}
          <path d="M 50 28 L 59 48 L 41 48 Z" fill="#FFFFFF" />
          {/* Green Horizontal Stripes */}
          <rect x="5" y="32" width="90" height="4" fill="#006B3F" rx="2" />
          <rect x="5" y="44" width="90" height="4" fill="#006B3F" rx="2" />
          <rect x="5" y="56" width="90" height="4" fill="#006B3F" rx="2" />
          <rect x="5" y="68" width="90" height="4" fill="#006B3F" rx="2" />
        </svg>

        {/* ATACADÃO Italic Green Text */}
        <span className="text-[#006B3F] font-black italic tracking-tighter text-3xl md:text-4xl drop-shadow-xs font-sans">
          ATACADÃO
        </span>
      </div>

      {showReflection && (
        <div className={`flex items-center gap-3 ${className} reflection-logo -mt-1 pointer-events-none`}>
          <svg viewBox="0 0 100 100" className="h-full w-auto aspect-square">
            <path d="M 50 10 L 85 85 L 65 85 L 50 52 L 35 85 L 15 85 Z" fill="#006B3F" />
            <path d="M 50 28 L 59 48 L 41 48 Z" fill="#FFFFFF" />
            <rect x="5" y="32" width="90" height="4" fill="#006B3F" rx="2" />
            <rect x="5" y="44" width="90" height="4" fill="#006B3F" rx="2" />
            <rect x="5" y="56" width="90" height="4" fill="#006B3F" rx="2" />
            <rect x="5" y="68" width="90" height="4" fill="#006B3F" rx="2" />
          </svg>
          <span className="text-[#006B3F] font-black italic tracking-tighter text-3xl md:text-4xl font-sans">
            ATACADÃO
          </span>
        </div>
      )}
    </div>
  );
};

export default AtacadaoLogo;
