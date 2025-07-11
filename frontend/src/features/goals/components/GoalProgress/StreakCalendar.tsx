import React from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';

interface StreakCalendarProps {
  currentStreak: number;
  longestStreak: number;
  completedDates: string[]; // ISO date strings
  skippedDates?: string[];
  month?: Date;
  onMonthChange?: (date: Date) => void;
  color?: string;
  className?: string;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
  currentStreak,
  longestStreak,
  completedDates,
  skippedDates = [],
  month = new Date(),
  onMonthChange,
  color = '#F59E0B',
  className = '',
}) => {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();
  
  const completedSet = new Set(completedDates);
  const skippedSet = new Set(skippedDates);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const handlePrevMonth = () => {
    const prev = new Date(month.getFullYear(), month.getMonth() - 1);
    onMonthChange?.(prev);
  };
  
  const handleNextMonth = () => {
    const next = new Date(month.getFullYear(), month.getMonth() + 1);
    onMonthChange?.(next);
  };
  
  const getDayStatus = (day: number): 'completed' | 'skipped' | 'future' | 'none' => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date > today) return 'future';
    if (completedSet.has(dateStr)) return 'completed';
    if (skippedSet.has(dateStr)) return 'skipped';
    return 'none';
  };
  
  const getStreakClass = (status: string) => {
    switch (status) {
      case 'completed':
        return `bg-opacity-100 text-white shadow-md transform scale-105`;
      case 'skipped':
        return 'bg-gray-200 text-gray-500';
      case 'future':
        return 'bg-gray-50 text-gray-300 cursor-not-allowed';
      default:
        return 'bg-[var(--surface)] text-gray-400 border border-gray-200';
    }
  };
  
  // Calculate streak intensity for heat map effect
  const getStreakIntensity = (day: number): number => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!completedSet.has(dateStr)) return 0;
    
    // Find consecutive days before this date
    let streak = 1;
    // eslint-disable-next-line prefer-const
    let checkDate = new Date(date);
    checkDate.setDate(checkDate.getDate() - 1);
    
    while (completedSet.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Return opacity based on streak length
    return Math.min(100, 40 + (streak * 10));
  };
  
  const days = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} />);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const status = getDayStatus(day);
    const intensity = getStreakIntensity(day);
    
    days.push(
      <button
        key={day}
        className={`
          relative h-10 w-10 rounded-lg transition-all duration-200
          ${getStreakClass(status)}
          ${status === 'completed' ? 'hover:shadow-lg' : ''}
        `}
        style={{
          backgroundColor: status === 'completed' ? color : undefined,
          opacity: status === 'completed' ? intensity / 100 : undefined,
        }}
        disabled={status === 'future'}
        aria-label={`${monthNames[month.getMonth()]} ${day}, ${status}`}
      >
        <span className={status === 'completed' ? 'font-semibold' : ''}>
          {day}
        </span>
        {status === 'completed' && currentStreak > 0 && day === new Date().getDate() && (
          <Flame className="absolute -top-1 -right-1 h-4 w-4 text-orange-500 animate-pulse" />
        )}
      </button>
    );
  }
  
  return (
    <div className={`bg-[var(--surface)] rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">Streak Calendar</h3>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5" style={{ color }} />
              <span className="text-sm font-medium text-gray-700">
                Current: {currentStreak} days
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Best: {longestStreak} days
            </div>
          </div>
        </div>
        
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-muted" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
            {monthNames[month.getMonth()]} {month.getFullYear()}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-muted" />
          </button>
        </div>
      </div>
      
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded"
            style={{ backgroundColor: color }}
          />
          <span className="text-muted">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <span className="text-muted">Skipped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-gray-200 bg-[var(--surface)]" />
          <span className="text-muted">Missed</span>
        </div>
      </div>
    </div>
  );
};

// Mini streak display for compact views
export const StreakBadge: React.FC<{
  currentStreak: number;
  showFlame?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}> = ({ currentStreak, showFlame = true, size = 'md', color = '#F59E0B' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };
  
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {showFlame && <Flame className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />}
      <span>{currentStreak} day streak</span>
    </div>
  );
};
