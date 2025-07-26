import React from 'react';
import { HabitCard } from './HabitCard';
import type { Habit } from '@/types/habits';
import { Target, TrendingUp, Flame, Award } from 'lucide-react';
import { clsx } from 'clsx';

interface DailyHabitTrackerProps {
  habits: Habit[];
  onHabitToggle: (habitId: string, completed: boolean) => void;
  onSkipHabit: (habitId: string) => void;
}

export const DailyHabitTracker: React.FC<DailyHabitTrackerProps> = ({ 
  habits, 
  onHabitToggle,
  onSkipHabit 
}) => {
  const completedToday = habits.filter(h => h.completedToday).length;
  const totalHabits = habits.length;
  const completionPercentage = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
  const totalStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0);
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Today's Habits
        </span>
      </h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Completed Today"
          value={`${completedToday}/${totalHabits}`}
          icon={<Target className="w-6 h-6" />}
          gradient="from-blue-500 to-cyan-500"
          iconBg="bg-blue-500/20"
        />
        <StatsCard
          label="Daily Progress"
          value={`${Math.round(completionPercentage)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-emerald-500 to-teal-500"
          iconBg="bg-emerald-500/20"
        />
        <StatsCard
          label="Total Streak Days"
          value={totalStreak}
          icon={<Flame className="w-6 h-6" />}
          gradient="from-orange-500 to-red-500"
          iconBg="bg-orange-500/20"
        />
        <StatsCard
          label="Weekly Score"
          value={habits.reduce((sum, h) => sum + h.weekProgress.filter(Boolean).length, 0)}
          icon={<Award className="w-6 h-6" />}
          gradient="from-purple-500 to-pink-500"
          iconBg="bg-purple-500/20"
        />
      </div>
      
      {/* Overall Progress Bar */}
      <div className="relative overflow-hidden rounded-xl p-6 mb-6 bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold text-[var(--text)]">Today's Progress</span>
            <span className="text-sm text-[var(--text-muted)]">{completedToday} of {totalHabits} habits</span>
          </div>
          <div className="h-6 bg-[var(--surface-muted)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${completionPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          {completionPercentage === 100 && (
            <p className="mt-3 text-center font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎆 Perfect Day! All habits completed! 🎆
            </p>
          )}
        </div>
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 blur-2xl" />
      </div>
      
      {/* Habit Cards */}
      {totalHabits === 0 ? (
        <div className="text-center py-12 rounded-xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-hover)] border border-[var(--surface-muted)]">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-lg font-medium text-[var(--text)] mb-2">No habits yet!</p>
          <p className="text-[var(--text-muted)]">Create your first habit to start your journey.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map(habit => (
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
}> = ({ label, value, icon, gradient, iconBg }) => (
  <div className="relative overflow-hidden rounded-lg bg-[var(--surface)] border border-[var(--surface-muted)] p-4 hover:scale-105 transition-transform cursor-pointer group">
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className={clsx("text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent", gradient)} 
           style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
          {value}
        </p>
      </div>
      <div className={clsx("p-2 rounded-lg", iconBg)}>
        <div className={clsx("bg-gradient-to-br bg-clip-text text-transparent", gradient)}>
          {icon}
        </div>
      </div>
    </div>
    <div className={clsx(
      "absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity",
      gradient
    )} />
  </div>
);
