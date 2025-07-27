import React, { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";

interface SimplifiedEllieProps {
  mood?:
    | "idle"
    | "happy"
    | "waving"
    | "sleeping"
    | "curious"
    | "walking"
    | "excited";
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onClick?: () => void;
  onPet?: () => void;
  size?: "sm" | "md" | "lg";
  showThoughtBubble?: boolean;
  thoughtText?: string;
  particleEffect?: "hearts" | "sparkles" | "treats" | "zzz" | null;
  className?: string;
}

const SimplifiedEllie: React.FC<SimplifiedEllieProps> = ({
  mood = "idle",
  position = { x: 100, y: 100 },
  onPositionChange,
  onClick,
  onPet,
  size = "md",
  showThoughtBubble = false,
  thoughtText = "",
  particleEffect = null,
  className,
}) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isMoving, setIsMoving] = useState(false);
  const [isPetting, setIsPetting] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const particleIdRef = useRef(0);

  const sizeMap = {
    sm: { width: 60, height: 60 },
    md: { width: 80, height: 80 },
    lg: { width: 100, height: 100 },
  };

  const currentSize = sizeMap[size];

  // Handle position changes
  useEffect(() => {
    if (position.x !== currentPosition.x || position.y !== currentPosition.y) {
      setIsMoving(true);
      const timer = setTimeout(() => {
        setCurrentPosition(position);
        setIsMoving(false);
        if (onPositionChange) {
          onPositionChange(position);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [position.x, position.y]);

  // Handle particle effects
  useEffect(() => {
    if (particleEffect) {
      const newParticles = Array.from({ length: 5 }, () => ({
        id: particleIdRef.current++,
        x: Math.random() * 60 - 30,
        y: Math.random() * -30 - 10,
      }));
      setParticles((prev) => [...prev, ...newParticles]);

      const timer = setTimeout(() => {
        setParticles([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [particleEffect]);

  // Handle petting
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPet) {
      setIsPetting(true);
      onPet();
    }
  };

  const handleMouseUp = () => {
    setIsPetting(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={clsx(
        "absolute cursor-pointer transition-all duration-1000 ease-in-out select-none",
        isPetting && "scale-110",
        className,
      )}
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        transform: isMoving ? "translateY(-10px)" : "translateY(0)",
        zIndex: 100,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Thought Bubble */}
      {showThoughtBubble && thoughtText && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-white rounded-full px-4 py-2 shadow-lg relative text-black">
            <p className="text-sm font-medium">{thoughtText}</p>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full ml-1 mt-1"></div>
            </div>
          </div>
        </div>
      )}

      {/* Particle Effects */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none text-2xl animate-float-up"
          style={{
            left: "50%",
            top: "20%",
            transform: `translate(${particle.x}px, ${particle.y}px)`,
          }}
        >
          {particleEffect === "hearts" && "❤️"}
          {particleEffect === "sparkles" && "✨"}
          {particleEffect === "treats" && "🦴"}
          {particleEffect === "zzz" && "Z"}
        </div>
      ))}

      <svg
        width={currentSize.width}
        height={currentSize.height}
        viewBox="0 0 100 100"
        className={clsx(
          mood === "happy" && "animate-bounce",
          mood === "excited" && "animate-wiggle",
          mood === "walking" && "animate-walk",
        )}
      >
        <defs>
          <radialGradient id="simpleBodyGradient">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f9fafb" />
          </radialGradient>

          <filter id="simpleShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="3" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="85" rx="20" ry="4" fill="#000000" opacity="0.1" />

        {/* Body */}
        <ellipse
          cx="50"
          cy="60"
          rx="23"
          ry="25"
          fill="url(#simpleBodyGradient)"
          filter="url(#simpleShadow)"
        />

        {/* Head */}
        <circle
          cx="50"
          cy="35"
          r="20"
          fill="#ffffff"
          filter="url(#simpleShadow)"
        />

        {/* Ears */}
        <ellipse
          cx="35"
          cy="25"
          rx="10"
          ry="12"
          fill="#ffffff"
          filter="url(#simpleShadow)"
        />
        <ellipse
          cx="65"
          cy="25"
          rx="10"
          ry="12"
          fill="#ffffff"
          filter="url(#simpleShadow)"
        />

        {/* Inner ears (subtle) */}
        <ellipse cx="35" cy="27" rx="5" ry="6" fill="#fce7f3" opacity="0.3" />
        <ellipse cx="65" cy="27" rx="5" ry="6" fill="#fce7f3" opacity="0.3" />

        {/* Eyes */}
        {mood !== "sleeping" ? (
          <>
            <circle cx="42" cy="35" r="2.5" fill="#1f2937" />
            <circle cx="58" cy="35" r="2.5" fill="#1f2937" />
            <circle cx="42.5" cy="34.5" r="0.8" fill="#ffffff" />
            <circle cx="58.5" cy="34.5" r="0.8" fill="#ffffff" />
          </>
        ) : (
          <>
            <path
              d="M 39 35 Q 42 37 45 35"
              stroke="#1f2937"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M 55 35 Q 58 37 61 35"
              stroke="#1f2937"
              strokeWidth="1.5"
              fill="none"
            />
          </>
        )}

        {/* Nose */}
        <ellipse cx="50" cy="41" rx="3" ry="2" fill="#92400e" />

        {/* Mouth (subtle) */}
        <path
          d="M 46 43 Q 50 45 54 43"
          stroke="#d4d4d8"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arms */}
        {mood === "waving" || mood === "excited" ? (
          <>
            {/* Waving arm */}
            <ellipse
              cx="30"
              cy="55"
              rx="7"
              ry="10"
              fill="#ffffff"
              transform="rotate(-40 30 55)"
              filter="url(#simpleShadow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-40 30 55; -50 30 55; -30 30 55; -40 30 55"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </ellipse>
            <ellipse
              cx="70"
              cy="58"
              rx="7"
              ry="10"
              fill="#ffffff"
              transform="rotate(20 70 58)"
              filter="url(#simpleShadow)"
            />
          </>
        ) : (
          <>
            <ellipse
              cx="32"
              cy="58"
              rx="7"
              ry="10"
              fill="#ffffff"
              transform="rotate(-20 32 58)"
              filter="url(#simpleShadow)"
            />
            <ellipse
              cx="68"
              cy="58"
              rx="7"
              ry="10"
              fill="#ffffff"
              transform="rotate(20 68 58)"
              filter="url(#simpleShadow)"
            />
          </>
        )}

        {/* Feet with paw pads */}
        <ellipse
          cx="40"
          cy="75"
          rx="8"
          ry="6"
          fill="#ffffff"
          filter="url(#simpleShadow)"
        />
        <ellipse
          cx="60"
          cy="75"
          rx="8"
          ry="6"
          fill="#ffffff"
          filter="url(#simpleShadow)"
        />

        {/* Paw pads */}
        <ellipse cx="40" cy="75" rx="4" ry="3" fill="#d4c5b0" opacity="0.6" />
        <ellipse cx="60" cy="75" rx="4" ry="3" fill="#d4c5b0" opacity="0.6" />

        {/* Mood-specific elements */}
        {mood === "happy" && (
          <text x="70" y="25" className="animate-sparkle" fontSize="12">
            ✨
          </text>
        )}

        {mood === "sleeping" && (
          <>
            <text
              x="65"
              y="30"
              className="animate-float"
              fontSize="14"
              fill="#6b7280"
            >
              Z
            </text>
            <text
              x="70"
              y="20"
              className="animate-float-delayed"
              fontSize="10"
              fill="#9ca3af"
            >
              z
            </text>
          </>
        )}

        {mood === "curious" && (
          <text
            x="70"
            y="25"
            className="animate-float-subtle"
            fontSize="16"
            fill="#3b82f6"
          >
            ?
          </text>
        )}
      </svg>

      {/* Petting feedback */}
      {isPetting && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded-full whitespace-nowrap">
            Good pup! 🥰
          </span>
        </div>
      )}
    </div>
  );
};

export default SimplifiedEllie;
