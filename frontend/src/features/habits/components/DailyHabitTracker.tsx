import React from "react";
import { HabitCard } from "./HabitCard";
import type { Habit } from "@/types/habits";
import { Target, TrendingUp, Flame, Award } from "lucide-react";
import { clsx } from "clsx";
import { useTheme } from "@/contexts/useTheme";

interface DailyHabitTrackerProps {
  habits: Habit[];
  onHabitToggle: (habitId: string, completed: boolean) => void;
  onSkipHabit: (habitId: string) => void;
}

export const DailyHabitTracker: React.FC<DailyHabitTrackerProps> = ({
  habits,
  onHabitToggle,
  onSkipHabit,
}) => {
  const { theme } = useTheme();
  const isBalloonTheme = theme === "balloon";

  const completedToday = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;
  const completionPercentage =
    totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
  const totalStreak = habits.reduce(
    (sum, h) => sum + (h.currentStreak || 0),
    0,
  );
  const weeklyScore = habits.reduce(
    (sum, h) => sum + (h.weekProgress?.filter(Boolean).length || 0),
    0,
  );

  return (
    <div className={isBalloonTheme ? "glass-morphism rounded-xl p-6" : ""}>
      <h2 className="text-2xl font-bold mb-6">
        <span
          className={clsx(
            "bg-gradient-to-r bg-clip-text text-transparent",
            isBalloonTheme
              ? "from-[#8b5cf6] via-[#ec4899] to-[#06b6d4]"
              : "from-purple-600 to-pink-600",
          )}
        >
          Today's Habits
        </span>
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Completed Today"
          value={`${completedToday}/${totalHabits}`}
          icon={<Target className="w-6 h-6" />}
          gradient={
            isBalloonTheme
              ? "from-[#06b6d4] to-[#0891b2]"
              : "from-blue-500 to-cyan-500"
          }
          iconBg={isBalloonTheme ? "bg-[#06b6d4]/20" : "bg-blue-500/20"}
          isBalloonTheme={isBalloonTheme}
        />
        <StatsCard
          label="Daily Progress"
          value={`${Math.round(completionPercentage)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          gradient={
            isBalloonTheme
              ? "from-[#8b5cf6] to-[#7c3aed]"
              : "from-emerald-500 to-teal-500"
          }
          iconBg={isBalloonTheme ? "bg-[#8b5cf6]/20" : "bg-emerald-500/20"}
          isBalloonTheme={isBalloonTheme}
        />
        <StatsCard
          label="Total Streak Days"
          value={totalStreak}
          icon={<Flame className="w-6 h-6" />}
          gradient={
            isBalloonTheme
              ? "from-[#ec4899] to-[#db2777]"
              : "from-orange-500 to-red-500"
          }
          iconBg={isBalloonTheme ? "bg-[#ec4899]/20" : "bg-orange-500/20"}
          isBalloonTheme={isBalloonTheme}
        />
        <StatsCard
          label="Weekly Score"
          value={weeklyScore}
          icon={<Award className="w-6 h-6" />}
          gradient={
            isBalloonTheme
              ? "from-[#f9a8d4] to-[#ec4899]"
              : "from-purple-500 to-pink-500"
          }
          iconBg={isBalloonTheme ? "bg-[#f9a8d4]/20" : "bg-purple-500/20"}
          isBalloonTheme={isBalloonTheme}
        />
      </div>

      {/* Overall Progress Bar */}
      <div
        className={clsx(
          "relative overflow-hidden rounded-xl p-6 mb-6 border",
          isBalloonTheme
            ? "bg-gradient-to-br from-[#8b5cf6]/10 via-[#ec4899]/10 to-[#06b6d4]/10 border-white/20"
            : "bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-500/20",
        )}
      >
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold text-[var(--text)]">
              Today's Progress
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              {completedToday} of {totalHabits} habits
            </span>
          </div>
          <div className="h-6 bg-[var(--surface-muted)] rounded-full overflow-hidden">
            <div
              className={clsx(
                "h-full transition-all duration-1000 ease-out relative overflow-hidden",
                isBalloonTheme
                  ? "bg-gradient-to-r from-[#f9a8d4] via-[#ec4899] via-[#8b5cf6] to-[#06b6d4]"
                  : "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500",
              )}
              style={{ width: `${completionPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          {completionPercentage === 100 && (
            <p
              className={clsx(
                "mt-3 text-center font-medium bg-gradient-to-r bg-clip-text text-transparent",
                isBalloonTheme
                  ? "from-[#8b5cf6] via-[#ec4899] to-[#06b6d4]"
                  : "from-purple-600 to-pink-600",
              )}
            >
              🎆 Perfect Day! All habits completed! 🎆
            </p>
          )}
        </div>
        <div
          className={clsx(
            "absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20 blur-2xl",
            isBalloonTheme
              ? "bg-gradient-to-br from-[#8b5cf6] via-[#ec4899] to-[#06b6d4]"
              : "bg-gradient-to-br from-purple-500 to-pink-500",
          )}
        />
      </div>

      {/* Habit Cards */}
      {totalHabits === 0 ? (
        <div className="text-center py-12 rounded-xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-hover)] border border-[var(--surface-muted)]">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-lg font-medium text-[var(--text)] mb-2">
            No habits yet!
          </p>
          <p className="text-[var(--text-muted)]">
            Create your first habit to start your journey.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={(completed) => onHabitToggle(habit.id, completed)}
              onSkip={() => onSkipHabit(habit.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const StatsCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  isBalloonTheme?: boolean;
}> = ({ label, value, icon, gradient, iconBg, isBalloonTheme }) => (
  <div
    className={clsx(
      "relative overflow-hidden rounded-lg border p-4 hover:scale-105 transition-transform cursor-pointer group",
      isBalloonTheme
        ? "bg-white/95 border-white/20 shadow-xl"
        : "bg-[var(--surface)] border-[var(--surface-muted)]",
    )}
  >
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p
          className={clsx(
            "text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
            gradient,
          )}
          style={{
            backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
          }}
        >
          {value}
        </p>
      </div>
      <div className={clsx("p-2 rounded-lg", iconBg)}>
        <div
          className={clsx(
            "bg-gradient-to-br bg-clip-text",
            isBalloonTheme ? "" : "text-transparent",
            gradient,
          )}
        >
          {icon}
        </div>
      </div>
    </div>
    <div
      className={clsx(
        "absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity",
        gradient,
      )}
    />
  </div>
);
