import React from 'react';
import type { Habit } from '@/types/habits';
import { BarChart3 } from 'lucide-react';

interface WeeklyProgressChartProps {
  habits: Habit[];
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({ habits }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  
  // Calculate completion rate for each day
  const dailyCompletions = days.map((_, index) => {
    const totalHabitsForDay = habits.length;
    const completedForDay = habits.filter(h => h.weekProgress[index]).length;
    return totalHabitsForDay > 0 ? (completedForDay / totalHabitsForDay) * 100 : 0;
  });
  
  return (
    <div className="glass rounded-lg p-4 border border-surface-muted hover-lift">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-theme">Weekly Progress</h3>
        <BarChart3 className="w-4 h-4 text-accent" />
      </div>
      
      <div className="space-y-3">
        {days.map((day, index) => {
          const isToday = index === today;
          const completion = dailyCompletions[index];
          
          return (
            <div key={day} className="flex items-center space-x-3">
              <span className={`text-xs w-8 ${isToday ? 'text-accent font-bold' : 'text-muted'}`}>
                {day}
              </span>
              <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    isToday ? 'bg-gradient-to-r from-accent to-accent-hover glow' : 'bg-accent opacity-70'
                  }`}
                  style={{ width: `${completion}%` }}
                />
              </div>
              <span className="text-xs text-muted w-10 text-right">
                {Math.round(completion)}%
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-surface-muted">
        <div className="flex justify-between text-xs">
          <span className="text-muted">Average</span>
          <span className="text-theme font-semibold">
            {Math.round(dailyCompletions.reduce((a, b) => a + b, 0) / 7)}%
          </span>
        </div>
      </div>
    </div>
  );
};
