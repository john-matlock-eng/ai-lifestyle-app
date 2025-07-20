import React from 'react';

interface EllieLogo {
  variant?: 'full' | 'icon' | 'horizontal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const EllieLogo: React.FC<EllieLogo> = ({ 
  variant = 'full', 
  size = 'md',
  className = '',
  animated = true
}) => {
  const sizeMap = {
    sm: { full: 60, icon: 24, horizontal: { width: 140, height: 40 } },
    md: { full: 120, icon: 32, horizontal: { width: 280, height: 80 } },
    lg: { full: 180, icon: 48, horizontal: { width: 420, height: 120 } },
    xl: { full: 240, icon: 64, horizontal: { width: 560, height: 160 } }
  };

  const currentSize = sizeMap[size];

  if (variant === 'icon') {
    return (
      <svg 
        width={currentSize.icon} 
        height={currentSize.icon} 
        viewBox="0 0 32 32" 
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="iconGradient">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f3f4f6" />
          </radialGradient>
        </defs>
        
        <ellipse cx="16" cy="28" rx="8" ry="2" fill="#000000" opacity="0.1" />
        <ellipse cx="16" cy="20" rx="9" ry="7" fill="url(#iconGradient)" />
        <circle cx="16" cy="12" r="8" fill="url(#iconGradient)" />
        <circle cx="10" cy="9" r="3" fill="#ffffff" />
        <circle cx="22" cy="9" r="3" fill="#ffffff" />
        <circle cx="13" cy="12" r="1.5" fill="#1f2937" />
        <circle cx="19" cy="12" r="1.5" fill="#1f2937" />
        <circle cx="13.5" cy="11.5" r="0.5" fill="#ffffff" />
        <circle cx="19.5" cy="11.5" r="0.5" fill="#ffffff" />
        <ellipse cx="16" cy="14.5" rx="1.5" ry="1" fill="#8B4513" />
        <path d="M 14 15 Q 16 16 18 15" stroke="#1f2937" strokeWidth="0.5" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'horizontal') {
    const dims = currentSize.horizontal as { width: number; height: number };
    return (
      <svg 
        width={dims.width} 
        height={dims.height} 
        viewBox="0 0 280 80" 
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="headerLogoGradient">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f3f4f6" />
          </radialGradient>
          
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          
          <filter id="headerSoftShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
            <feOffset dx="0" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        <g transform="translate(10, 10)">
          <ellipse cx="30" cy="55" rx="15" ry="4" fill="#000000" opacity="0.1" />
          <ellipse cx="30" cy="45" rx="18" ry="15" fill="url(#headerLogoGradient)" filter="url(#headerSoftShadow)" />
          <circle cx="30" cy="28" r="15" fill="url(#headerLogoGradient)" filter="url(#headerSoftShadow)" />
          <ellipse cx="18" cy="23" rx="6" ry="8" fill="#ffffff" transform="rotate(-25 18 23)" filter="url(#headerSoftShadow)" />
          <ellipse cx="42" cy="23" rx="6" ry="8" fill="#ffffff" transform="rotate(25 42 23)" filter="url(#headerSoftShadow)" />
          <circle cx="24" cy="28" r="2" fill="#1f2937" />
          <circle cx="36" cy="28" r="2" fill="#1f2937" />
          <circle cx="24.5" cy="27.5" r="0.7" fill="#ffffff" />
          <circle cx="36.5" cy="27.5" r="0.7" fill="#ffffff" />
          <ellipse cx="30" cy="33" rx="2" ry="1.5" fill="#8B4513" />
          <path d="M 27 34 Q 30 35.5 33 34" stroke="#1f2937" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          <ellipse cx="22" cy="53" rx="5" ry="6" fill="#ffffff" filter="url(#headerSoftShadow)" />
          <ellipse cx="38" cy="53" rx="5" ry="6" fill="#ffffff" filter="url(#headerSoftShadow)" />
          <ellipse cx="15" cy="42" rx="8" ry="4" fill="#ffffff" transform="rotate(-45 15 42)" filter="url(#headerSoftShadow)" />
        </g>
        
        <g transform="translate(80, 25)">
          <text x="0" y="0" fontFamily="system-ui, -apple-system, sans-serif" fontSize="24" fontWeight="700" fill="url(#textGradient)">
            AI Lifestyle
          </text>
          <text x="0" y="25" fontFamily="system-ui, -apple-system, sans-serif" fontSize="14" fontWeight="400" fill="#6b7280">
            with Ellie, your wellness companion
          </text>
        </g>
        
        {animated && (
          <circle cx="250" cy="20" r="2" fill="#fbbf24" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    );
  }

  // Default: full logo
  return (
    <svg 
      width={currentSize.full} 
      height={currentSize.full} 
      viewBox="0 0 120 120" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="logoBodyGradient">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3f4f6" />
        </radialGradient>
        
        <filter id="logoSoftShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="60" cy="60" r="58" fill="#faf9f7" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
      <ellipse cx="60" cy="95" rx="25" ry="6" fill="#000000" opacity="0.1" />
      <ellipse cx="60" cy="70" rx="28" ry="23" fill="url(#logoBodyGradient)" filter="url(#logoSoftShadow)" />
      <ellipse cx="60" cy="75" rx="15" ry="10" fill="#ffffff" opacity="0.8" />
      <circle cx="60" cy="45" r="22" fill="url(#logoBodyGradient)" filter="url(#logoSoftShadow)" />
      <ellipse cx="40" cy="35" rx="8" ry="12" fill="#ffffff" transform="rotate(-20 40 35)" filter="url(#logoSoftShadow)" />
      <ellipse cx="80" cy="35" rx="8" ry="12" fill="#ffffff" transform="rotate(20 80 35)" filter="url(#logoSoftShadow)" />
      <ellipse cx="42" cy="37" rx="4" ry="6" fill="#f3f4f6" transform="rotate(-20 42 37)" opacity="0.5" />
      <ellipse cx="78" cy="37" rx="4" ry="6" fill="#f3f4f6" transform="rotate(20 78 37)" opacity="0.5" />
      <circle cx="50" cy="45" r="3" fill="#1f2937" />
      <circle cx="70" cy="45" r="3" fill="#1f2937" />
      <circle cx="51" cy="44" r="1" fill="#ffffff" />
      <circle cx="71" cy="44" r="1" fill="#ffffff" />
      <ellipse cx="60" cy="52" rx="3" ry="2" fill="#8B4513" />
      <path d="M 55 54 Q 60 56 65 54" stroke="#1f2937" strokeWidth="1" fill="none" strokeLinecap="round" />
      <ellipse cx="45" cy="85" rx="7" ry="9" fill="#ffffff" filter="url(#logoSoftShadow)" />
      <ellipse cx="75" cy="85" rx="7" ry="9" fill="#ffffff" filter="url(#logoSoftShadow)" />
      <ellipse cx="45" cy="87" rx="3" ry="2" fill="#8B4513" opacity="0.3" />
      <ellipse cx="75" cy="87" rx="3" ry="2" fill="#8B4513" opacity="0.3" />
      <ellipse cx="35" cy="65" rx="12" ry="6" fill="#ffffff" transform="rotate(-45 35 65)" filter="url(#logoSoftShadow)" />
      
      {animated && (
        <circle cx="85" cy="25" r="2" fill="#fbbf24" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
};

export default EllieLogo;