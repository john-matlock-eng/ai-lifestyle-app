import React from 'react';
import type { Habit } from '@/types/habits';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeeklyProgressChartProps {
  habits: Habit[];
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({ habits }) => {
  // Calculate daily completion rates for the week
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  
  const dailyCompletions = weekDays.map((day, index) => {
    const completedCount = habits.filter(h => h.weekProgress[index]).length;
    const totalCount = habits.length;
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    return {
      day,
      completedCount,
      totalCount,
      percentage,
      isToday: index === today,
      isFuture: index > today
    };
  });

  // Calculate week-over-week trend
  const thisWeekAvg = dailyCompletions
    .slice(0, today + 1)
    .reduce((sum, d) => sum + d.percentage, 0) / (today + 1);
  
  const lastWeekAvg = 65; // This would come from historical data
  const trend = thisWeekAvg - lastWeekAvg;

  const getTrendIcon = () => {
    if (trend > 5) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < -5) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendText = () => {
    if (trend > 5) return 'Improving';
    if (trend < -5) return 'Needs attention';
    return 'Stable';
  };

  const maxHeight = 100; // pixels

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Progress</h3>
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <span className="text-sm text-gray-600">{getTrendText()}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between h-32 mb-3">
        {dailyCompletions.map((day, index) => (
          <div
            key={index}
            className="flex flex-col items-center flex-1 px-1"
          >
            <div className="w-full flex flex-col items-center">
              {/* Percentage label */}
              <span className={`text-xs mb-1 ${
                day.isToday ? 'font-bold text-blue-600' : 'text-gray-500'
              }`}>
                {!day.isFuture && `${Math.round(day.percentage)}%`}
              </span>
              
              {/* Bar */}
              <div className="w-full max-w-[40px] bg-gray-200 rounded-t-lg relative">
                <div
                  className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${
                    day.isToday
                      ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                      : day.isFuture
                      ? 'bg-gray-300'
                      : day.percentage >= 80
                      ? 'bg-green-500'
                      : day.percentage >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ 
                    height: `${day.isFuture ? 0 : (day.percentage / 100) * maxHeight}px`,
                    minHeight: day.percentage > 0 && !day.isFuture ? '4px' : '0'
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Day labels */}
      <div className="flex justify-between">
        {dailyCompletions.map((day, index) => (
          <div
            key={index}
            className={`text-xs flex-1 text-center ${
              day.isToday
                ? 'font-bold text-blue-600'
                : 'text-gray-500'
            }`}
          >
            {day.day}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Week Average</span>
          <span className="text-sm font-medium text-gray-900">
            {Math.round(thisWeekAvg)}% completion
          </span>
        </div>
        {trend !== 0 && (
          <div className="mt-1 text-xs text-gray-500">
            {Math.abs(Math.round(trend))}% {trend > 0 ? 'better' : 'lower'} than last week
          </div>
        )}
      </div>
    </div>
  );
};
