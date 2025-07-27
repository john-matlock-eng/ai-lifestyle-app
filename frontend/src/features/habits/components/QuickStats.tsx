import React from "react";
import type { UserStats } from "@/types/habits";
import { Trophy, Zap, Star } from "lucide-react";
import { useTheme } from "@/contexts/useTheme";

interface QuickStatsProps {
  stats: UserStats;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  const { theme } = useTheme();
  const isBalloonTheme = theme === "balloon";

  return (
    <div
      className={`flex items-center space-x-3 ${isBalloonTheme ? "bg-black/10 backdrop-blur-sm rounded-lg p-3" : "bg-surface/50 rounded-lg p-3"}`}
    >
      <div className="flex items-center space-x-2">
        <div
          className={`p-2 rounded-lg ${isBalloonTheme ? "bg-white/20" : "bg-success-bg"}`}
        >
          <Trophy
            className={`w-5 h-5 ${isBalloonTheme ? "text-white" : "text-success"}`}
          />
        </div>
        <div>
          <p
            className={`text-xs ${isBalloonTheme ? "text-white/80" : "text-muted"}`}
          >
            Points
          </p>
          <p
            className={`text-sm font-bold ${isBalloonTheme ? "text-white" : "text-theme"}`}
          >
            {stats.totalPoints}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div
          className={`p-2 rounded-lg ${isBalloonTheme ? "bg-white/20" : "bg-warning-bg"}`}
        >
          <Zap
            className={`w-5 h-5 ${isBalloonTheme ? "text-white" : "text-warning"}`}
          />
        </div>
        <div>
          <p
            className={`text-xs ${isBalloonTheme ? "text-white/80" : "text-muted"}`}
          >
            Streak
          </p>
          <p
            className={`text-sm font-bold ${isBalloonTheme ? "text-white" : "text-theme"}`}
          >
            {stats.weeklyStreak}d
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div
          className={`p-2 rounded-lg ${isBalloonTheme ? "bg-white/20" : "bg-accent"}`}
          style={isBalloonTheme ? {} : { background: "var(--button-hover-bg)" }}
        >
          <Star
            className={`w-5 h-5 ${isBalloonTheme ? "text-white" : "text-accent"}`}
          />
        </div>
        <div>
          <p
            className={`text-xs ${isBalloonTheme ? "text-white/80" : "text-muted"}`}
          >
            Level
          </p>
          <p
            className={`text-sm font-bold ${isBalloonTheme ? "text-white" : "text-theme"}`}
          >
            {stats.currentLevel}
          </p>
        </div>
      </div>
    </div>
  );
};
