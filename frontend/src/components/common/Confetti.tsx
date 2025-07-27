import React from "react";

interface ConfettiProps {
  show: boolean;
}

export const Confetti: React.FC<ConfettiProps> = ({ show }) => {
  if (!show) return null;

  const colors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];
  const confettiCount = 50;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(confettiCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-fall"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                colors[Math.floor(Math.random() * colors.length)],
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};
