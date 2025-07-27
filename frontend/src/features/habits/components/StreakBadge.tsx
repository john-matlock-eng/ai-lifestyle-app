import React from "react";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
  milestone?: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak,
  milestone = 7,
}) => {
  const isMilestone = milestone && streak > 0 && streak % milestone === 0;
  const isNearMilestone =
    milestone &&
    streak >= milestone - 3 &&
    streak < milestone &&
    streak % milestone >= milestone - 3;

  return (
    <div
      className={`
      inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-all
      ${
        isMilestone
          ? "bg-gradient-to-r from-warning to-orange-500 text-white shadow-lg animate-pulse glow"
          : isNearMilestone
            ? "bg-warning-bg text-warning border border-warning"
            : "bg-surface text-muted border border-surface-muted"
      }
    `}
    >
      <Flame className={`w-4 h-4 ${isMilestone ? "animate-bounce" : ""}`} />
      <span>
        {streak} day{streak !== 1 ? "s" : ""}
      </span>
      {isNearMilestone && milestone && (
        <span className="text-xs opacity-75">
          ({milestone - (streak % milestone)} to milestone!)
        </span>
      )}
    </div>
  );
};
