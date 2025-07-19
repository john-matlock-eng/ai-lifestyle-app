import React from "react";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = "#3B82F6",
  backgroundColor = "var(--surface-muted)",
  showPercentage = true,
  className = "",
  children,
}) => {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-label={`Progress: ${safeProgress}%`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter:
              progress > 0 ? `drop-shadow(0 0 6px ${color}40)` : undefined,
          }}
        />

        {/* Completion celebration effect */}
        {safeProgress === 100 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + strokeWidth}
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeDasharray="4 4"
            className="animate-pulse"
            opacity={0.3}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center">
        {showPercentage && !children && (
          <span
            className="text-2xl font-bold"
            style={{ color: safeProgress > 0 ? color : backgroundColor }}
          >
            {Math.round(safeProgress)}%
          </span>
        )}
        {children}
      </div>
    </div>
  );
};

// Compound component for goal-specific progress
interface GoalProgressRingProps
  extends Omit<ProgressRingProps, "children" | "progress"> {
  current: number;
  target: number;
  unit: string;
  goalType?: "recurring" | "milestone" | "target" | "limit" | "streak";
}

export const GoalProgressRing: React.FC<GoalProgressRingProps> = ({
  current,
  target,
  unit,
  goalType = "recurring",
  ...ringProps
}) => {
  const progress = target > 0 ? (current / target) * 100 : 0;
  const isOverTarget = current > target;

  // Adjust color for limit goals when over target
  const color =
    goalType === "limit" && isOverTarget
      ? "var(--error)" // Red for exceeded limits
      : ringProps.color;

  return (
    <ProgressRing
      {...ringProps}
      progress={Math.min(progress, 100)}
      color={color}
    >
      <div className="text-center">
        <div
          className="text-xl font-bold"
          style={{ color: progress > 0 ? color : "var(--text-muted)" }}
        >
          {current.toFixed(2)}
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          of {target.toFixed(2)} {unit}
        </div>
        {isOverTarget && goalType !== "limit" && (
          <div className="text-xs text-[var(--success)] font-medium mt-1">
            +{(current - target).toFixed(2)}
          </div>
        )}
      </div>
    </ProgressRing>
  );
};

// Mini progress ring for compact displays
export const MiniProgressRing: React.FC<{
  progress: number;
  color?: string;
  size?: number;
}> = ({ progress, color = "#3B82F6", size = 40 }) => {
  return (
    <ProgressRing
      progress={progress}
      size={size}
      strokeWidth={4}
      color={color}
      showPercentage={false}
    >
      <span className="text-xs font-medium" style={{ color }}>
        {Math.round(progress)}%
      </span>
    </ProgressRing>
  );
};
