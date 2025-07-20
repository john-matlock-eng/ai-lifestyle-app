import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

export interface AnimatedShihTzuProps {
  mood?: 'idle' | 'happy' | 'sleeping' | 'curious' | 'walking';
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AnimatedShihTzu: React.FC<AnimatedShihTzuProps> = ({ 
  mood = 'idle', 
  position = { x: 100, y: 100 },
  onPositionChange,
  onClick,
  size = 'md',
  className
}) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isMoving, setIsMoving] = useState(false);
  const [currentMood, setCurrentMood] = useState(mood);
  const shihTzuRef = useRef<HTMLDivElement>(null);
  const positionTimerRef = useRef<NodeJS.Timeout>();

  const sizeMap = {
    sm: { width: 60, height: 60 },
    md: { width: 80, height: 80 },
    lg: { width: 100, height: 100 }
  };

  const currentSize = sizeMap[size];

  // Sync mood changes from props
  useEffect(() => {
    if (mood !== currentMood) {
      setCurrentMood(mood);
    }
  }, [mood]); // Only depend on mood, not currentMood to avoid loops

  // Handle position changes
  useEffect(() => {
    // Clear any existing timer
    if (positionTimerRef.current) {
      clearTimeout(positionTimerRef.current);
    }

    // Check if position actually changed
    if (position.x !== currentPosition.x || position.y !== currentPosition.y) {
      setIsMoving(true);
      
      positionTimerRef.current = setTimeout(() => {
        setCurrentPosition(position);
        setIsMoving(false);
        
        // Only call onPositionChange if it exists and position actually changed
        if (onPositionChange) {
          onPositionChange(position);
        }
      }, 50);
    }
    
    // Cleanup function
    return () => {
      if (positionTimerRef.current) {
        clearTimeout(positionTimerRef.current);
      }
    };
  }, [position.x, position.y]); // Only depend on position values, not the entire object or callbacks

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      // Default behavior: cycle through moods
      const moods: Array<AnimatedShihTzuProps['mood']> = ['idle', 'happy', 'sleeping', 'curious', 'walking'];
      const currentIndex = moods.indexOf(currentMood);
      const nextMood = moods[(currentIndex + 1) % moods.length];
      setCurrentMood(nextMood || 'idle');
    }
  };

  return (
    <div
      ref={shihTzuRef}
      className={clsx(
        "absolute cursor-pointer transition-all duration-1000 ease-in-out",
        className
      )}
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        transform: isMoving ? 'translateY(-10px)' : 'translateY(0)',
      }}
      onClick={handleClick}
    >
      <svg
        width={currentSize.width}
        height={currentSize.height}
        viewBox="0 0 100 100"
        className={clsx(
          currentMood === 'happy' && 'animate-bounce',
          currentMood === 'walking' && 'animate-walk'
        )}
      >
        {/* Define custom animations */}
        <defs>
          <style>
            {`
              @keyframes wag {
                0%, 100% { transform: rotate(-45deg); }
                25% { transform: rotate(-70deg); }
                75% { transform: rotate(-20deg); }
              }
              
              @keyframes walk {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
              }
              
              @keyframes walk-front-leg {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(2px); }
              }
              
              @keyframes walk-back-leg {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(-2px); }
              }
              
              @keyframes sparkle {
                0% { opacity: 0; transform: scale(0) rotate(0deg); }
                50% { opacity: 1; transform: scale(1) rotate(180deg); }
                100% { opacity: 0; transform: scale(0) rotate(360deg); }
              }
              
              @keyframes float {
                0%, 100% { transform: translateY(0) translateX(0); }
                50% { transform: translateY(-10px) translateX(5px); }
              }
              
              @keyframes float-subtle {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
              }
              
              @keyframes gentle-breathe {
                0%, 100% { transform: scaleY(1); }
                50% { transform: scaleY(0.95); }
              }
              
              .animate-wag {
                animation: wag 0.5s ease-in-out infinite;
                transform-origin: 30px 57px;
              }
              
              .animate-walk {
                animation: walk 0.4s ease-in-out infinite;
              }
              
              .animate-walk-front-leg {
                animation: walk-front-leg 0.4s ease-in-out infinite;
              }
              
              .animate-walk-back-leg {
                animation: walk-back-leg 0.4s ease-in-out infinite;
                animation-delay: 0.2s;
              }
              
              .animate-sparkle {
                animation: sparkle 1.5s ease-in-out infinite;
              }
              
              .animate-sparkle-delayed {
                animation: sparkle 1.5s ease-in-out infinite;
                animation-delay: 0.5s;
              }
              
              .animate-sparkle-delayed-2 {
                animation: sparkle 1.5s ease-in-out infinite;
                animation-delay: 1s;
              }
              
              .animate-float {
                animation: float 2s ease-in-out infinite;
              }
              
              .animate-float-delayed {
                animation: float 2s ease-in-out infinite;
                animation-delay: 0.5s;
              }
              
              .animate-float-subtle {
                animation: float-subtle 2s ease-in-out infinite;
              }
              
              .animate-gentle-breathe {
                animation: gentle-breathe 3s ease-in-out infinite;
              }
            `}
          </style>
        </defs>

        {/* Body */}
        <ellipse
          cx="50"
          cy="60"
          rx="25"
          ry="20"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="1"
          className={currentMood === 'sleeping' ? 'animate-gentle-breathe' : ''}
        />
        
        {/* Head group - this will rotate for curiosity */}
        <g 
          transform={currentMood === 'curious' ? undefined : 'rotate(0 50 35)'}
          style={{ transformOrigin: '50px 35px' }}
        >
          {currentMood === 'curious' && (
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              values="0 50 35; 0 50 35; 12 50 35; 12 50 35; 12 50 35; 0 50 35"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
          
          {/* Ears - drawn first so they appear behind the head */}
          {/* Left ear - attaches at top-side of head */}
          <path
            d="M 33 25 Q 25 35 28 48 Q 30 52 33 48 Q 35 40 33 25"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          
          {/* Right ear - attaches at top-side of head */}
          <path
            d="M 67 25 Q 75 35 72 48 Q 70 52 67 48 Q 65 40 67 25"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          
          {/* Head */}
          <circle
            cx="50"
            cy="35"
            r="20"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          
          {/* Eyes */}
          {currentMood !== 'sleeping' ? (
            <>
              <circle cx="42" cy="35" r={currentMood === 'curious' ? "4" : "3"} fill="black">
                {currentMood === 'happy' && (
                  <animate attributeName="cy" values="35;33;35" dur="0.3s" repeatCount="indefinite" />
                )}
              </circle>
              <circle cx="58" cy="35" r={currentMood === 'curious' ? "4" : "3"} fill="black">
                {currentMood === 'happy' && (
                  <animate attributeName="cy" values="35;33;35" dur="0.3s" repeatCount="indefinite" />
                )}
              </circle>
              <circle cx="43" cy="34" r="1" fill="white" />
              <circle cx="59" cy="34" r="1" fill="white" />
            </>
          ) : (
            <>
              <path d="M 39 35 Q 42 37 45 35" stroke="black" strokeWidth="1.5" fill="none" />
              <path d="M 55 35 Q 58 37 61 35" stroke="black" strokeWidth="1.5" fill="none" />
            </>
          )}
          
          {/* Eyebrows for curious expression */}
          {currentMood === 'curious' && (
            <>
              <path d="M 37 30 L 42 28" stroke="black" strokeWidth="1" fill="none" />
              <path d="M 58 28 L 63 30" stroke="black" strokeWidth="1" fill="none" />
            </>
          )}
          
          {/* Nose */}
          <ellipse cx="50" cy="42" rx="3" ry="2" fill="#8B4513" />
          
          {/* Mouth */}
          {currentMood === 'happy' ? (
            <path d="M 45 44 Q 50 48 55 44" stroke="black" strokeWidth="1.5" fill="none">
              <animate attributeName="d" 
                values="M 45 44 Q 50 48 55 44;M 45 44 Q 50 49 55 44;M 45 44 Q 50 48 55 44" 
                dur="0.5s" 
                repeatCount="indefinite" />
            </path>
          ) : (
            <path d="M 47 44 Q 50 46 53 44" stroke="black" strokeWidth="1" fill="none" />
          )}
        </g>
        
        {/* Tail */}
        <ellipse
          cx="25"
          cy="55"
          rx="10"
          ry="5"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="1"
          transform="rotate(-45 25 55)"
          className={currentMood === 'happy' ? 'animate-wag' : ''}
        />
        
        {/* Front Legs */}
        <rect x="40" y="70" width="6" height="15" rx="3" fill="white" stroke="#e5e7eb" strokeWidth="1"
          className={currentMood === 'walking' ? 'animate-walk-front-leg' : ''} />
        <rect x="54" y="70" width="6" height="15" rx="3" fill="white" stroke="#e5e7eb" strokeWidth="1"
          className={currentMood === 'walking' ? 'animate-walk-back-leg' : ''} />
        
        {/* Happy sparkles */}
        {currentMood === 'happy' && (
          <>
            <text x="70" y="25" className="animate-sparkle" fontSize="12">✨</text>
            <text x="20" y="20" className="animate-sparkle-delayed" fontSize="10">✨</text>
            <text x="25" y="45" className="animate-sparkle-delayed-2" fontSize="8">✨</text>
          </>
        )}
        
        {/* Sleeping Z's */}
        {currentMood === 'sleeping' && (
          <>
            <text x="65" y="30" className="animate-float" fontSize="14" fill="#6b7280">Z</text>
            <text x="70" y="20" className="animate-float-delayed" fontSize="10" fill="#9ca3af">z</text>
          </>
        )}
        
        {/* Curious question mark */}
        {currentMood === 'curious' && (
          <text x="70" y="25" className="animate-float-subtle" fontSize="16" fill="#3b82f6">?</text>
        )}
      </svg>
      
      {/* Optional mood indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-center mt-1">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize">
            {currentMood}
          </span>
        </div>
      )}
    </div>
  );
};

AnimatedShihTzu.displayName = 'AnimatedShihTzu';

export default AnimatedShihTzu;