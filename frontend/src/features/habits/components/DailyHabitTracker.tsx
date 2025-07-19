import React from 'react';
import { HabitCard } from './HabitCard';
import type { Habit } from '@/types/habits';
import { Target, TrendingUp, Flame, Award } from 'lucide-react';

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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Habits</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Completed Today"
          value={`${completedToday}/${totalHabits}`}
          icon={<Target className="w-6 h-6 text-blue-500" />}
        />
        <StatsCard
          label="Daily Progress"
          value={`${Math.round(completionPercentage)}%`}
          icon={<TrendingUp className="w-6 h-6 text-green-500" />}
        />
        <StatsCard
          label="Total Streak Days"
          value={totalStreak}
          icon={<Flame className="w-6 h-6 text-orange-500" />}
        />
        <StatsCard
          label="Weekly Score"
          value={habits.reduce((sum, h) => sum + h.weekProgress.filter(Boolean).length, 0)}
          icon={<Award className="w-6 h-6 text-purple-500" />}
        />
      </div>
      
      {/* Overall Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Today's Progress</span>
          <span className="text-sm text-gray-500">{completedToday} of {totalHabits} habits</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out progress-shine"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Habit Cards */}
      {totalHabits === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">No habits yet. Create your first habit to get started!</p>
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
}> = ({ label, value, icon }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
      {icon}
    </div>
  </div>
);
