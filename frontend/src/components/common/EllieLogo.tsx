import React from "react";

interface EllieLogo {
  variant?: "full" | "icon" | "horizontal";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animated?: boolean;
}

const EllieLogo: React.FC<EllieLogo> = ({
  variant = "full",
  size = "md",
  className = "",
  animated = true,
}) => {
  const sizeMap = {
    sm: { full: 60, icon: 24, horizontal: { width: 140, height: 40 } },
    md: { full: 120, icon: 32, horizontal: { width: 280, height: 80 } },
    lg: { full: 180, icon: 48, horizontal: { width: 420, height: 120 } },
    xl: { full: 240, icon: 64, horizontal: { width: 560, height: 160 } },
  };

  const currentSize = sizeMap[size];

  if (variant === "icon") {
    return (
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 32 32"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="iconBodyGradient">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f9fafb" />
          </radialGradient>
        </defs>

        <ellipse cx="16" cy="28" rx="8" ry="2" fill="#000000" opacity="0.1" />
        <circle cx="16" cy="20" r="9" fill="url(#iconBodyGradient)" />
        <circle cx="16" cy="11" r="7" fill="#ffffff" />
        <circle cx="11" cy="8" r="3" fill="#ffffff" />
        <circle cx="21" cy="8" r="3" fill="#ffffff" />
        <circle cx="13.5" cy="11" r="1.2" fill="#1f2937" />
        <circle cx="18.5" cy="11" r="1.2" fill="#1f2937" />
        <ellipse cx="16" cy="13.5" rx="1.5" ry="1" fill="#92400e" />
        <ellipse
          cx="10"
          cy="18"
          rx="3"
          ry="4"
          fill="#ffffff"
          transform="rotate(-30 10 18)"
        />
        <ellipse cx="22" cy="20" rx="2.5" ry="3.5" fill="#ffffff" />
      </svg>
    );
  }

  if (variant === "horizontal") {
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
          <radialGradient id="headerBodyGradient">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f9fafb" />
          </radialGradient>

          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>

          <filter id="headerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform="translate(20, 15)">
          <ellipse
            cx="25"
            cy="45"
            rx="15"
            ry="3"
            fill="#000000"
            opacity="0.1"
          />
          <ellipse
            cx="25"
            cy="35"
            rx="18"
            ry="16"
            fill="url(#headerBodyGradient)"
            filter="url(#headerShadow)"
          />
          <circle
            cx="25"
            cy="20"
            r="15"
            fill="#ffffff"
            filter="url(#headerShadow)"
          />
          <ellipse
            cx="15"
            cy="15"
            rx="7"
            ry="9"
            fill="#ffffff"
            filter="url(#headerShadow)"
          />
          <ellipse
            cx="35"
            cy="15"
            rx="7"
            ry="9"
            fill="#ffffff"
            filter="url(#headerShadow)"
          />
          <circle cx="20" cy="20" r="2" fill="#1f2937" />
          <circle cx="30" cy="20" r="2" fill="#1f2937" />
          <circle cx="20.5" cy="19.5" r="0.7" fill="#ffffff" />
          <circle cx="30.5" cy="19.5" r="0.7" fill="#ffffff" />
          <ellipse cx="25" cy="24" rx="2.5" ry="1.8" fill="#92400e" />
          <ellipse
            cx="12"
            cy="30"
            rx="5"
            ry="8"
            fill="#ffffff"
            transform="rotate(-35 12 30)"
            filter="url(#headerShadow)"
          />
          <ellipse
            cx="38"
            cy="33"
            rx="5"
            ry="7"
            fill="#ffffff"
            transform="rotate(20 38 33)"
            filter="url(#headerShadow)"
          />
          <ellipse
            cx="18"
            cy="42"
            rx="6"
            ry="5"
            fill="#ffffff"
            filter="url(#headerShadow)"
          />
          <ellipse
            cx="32"
            cy="42"
            rx="6"
            ry="5"
            fill="#ffffff"
            filter="url(#headerShadow)"
          />
          <ellipse
            cx="18"
            cy="42"
            rx="3"
            ry="2.5"
            fill="#d4c5b0"
            opacity="0.6"
          />
          <ellipse
            cx="32"
            cy="42"
            rx="3"
            ry="2.5"
            fill="#d4c5b0"
            opacity="0.6"
          />
        </g>

        <g transform="translate(80, 25)">
          <text
            x="0"
            y="0"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="24"
            fontWeight="700"
            fill="url(#textGradient)"
          >
            AI Lifestyle
          </text>
          <text
            x="0"
            y="25"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="14"
            fontWeight="400"
            fill="#6b7280"
          >
            with Ellie, your wellness companion
          </text>
        </g>

        {animated && (
          <circle cx="250" cy="20" r="2" fill="#fbbf24" opacity="0.8">
            <animate
              attributeName="opacity"
              values="0.8;0.3;0.8"
              dur="2s"
              repeatCount="indefinite"
            />
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
        <radialGradient id="bodyGradient">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f9fafb" />
        </radialGradient>

        <filter id="softShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.15" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="60" cy="60" r="55" fill="#9ca3af" opacity="0.3" />
      <ellipse cx="60" cy="100" rx="25" ry="5" fill="#000000" opacity="0.1" />
      <ellipse
        cx="60"
        cy="75"
        rx="28"
        ry="30"
        fill="url(#bodyGradient)"
        filter="url(#softShadow)"
      />
      <circle
        cx="60"
        cy="45"
        r="25"
        fill="url(#bodyGradient)"
        filter="url(#softShadow)"
      />
      <ellipse
        cx="45"
        cy="35"
        rx="12"
        ry="15"
        fill="#ffffff"
        filter="url(#softShadow)"
      />
      <ellipse
        cx="75"
        cy="35"
        rx="12"
        ry="15"
        fill="#ffffff"
        filter="url(#softShadow)"
      />
      <ellipse cx="45" cy="37" rx="6" ry="8" fill="#fce7f3" opacity="0.5" />
      <ellipse cx="75" cy="37" rx="6" ry="8" fill="#fce7f3" opacity="0.5" />
      <circle cx="50" cy="45" r="3" fill="#1f2937" />
      <circle cx="70" cy="45" r="3" fill="#1f2937" />
      <circle cx="51" cy="44" r="1" fill="#ffffff" />
      <circle cx="71" cy="44" r="1" fill="#ffffff" />
      <ellipse cx="60" cy="52" rx="4" ry="3" fill="#92400e" />
      <path
        d="M 56 54 Q 60 56 64 54"
        stroke="#d4d4d8"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx="40"
        cy="70"
        rx="8"
        ry="12"
        fill="#ffffff"
        transform="rotate(-20 40 70)"
        filter="url(#softShadow)"
      />
      <ellipse
        cx="80"
        cy="70"
        rx="8"
        ry="12"
        fill="#ffffff"
        transform="rotate(20 80 70)"
        filter="url(#softShadow)"
      />
      <ellipse
        cx="48"
        cy="90"
        rx="10"
        ry="8"
        fill="#ffffff"
        filter="url(#softShadow)"
      />
      <ellipse
        cx="72"
        cy="90"
        rx="10"
        ry="8"
        fill="#ffffff"
        filter="url(#softShadow)"
      />
      <ellipse cx="48" cy="90" rx="5" ry="4" fill="#d4c5b0" opacity="0.6" />
      <ellipse cx="72" cy="90" rx="5" ry="4" fill="#d4c5b0" opacity="0.6" />

      {animated && (
        <circle cx="85" cy="25" r="2" fill="#fbbf24" opacity="0.8">
          <animate
            attributeName="opacity"
            values="0.8;0.3;0.8"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  );
};

export default EllieLogo;
