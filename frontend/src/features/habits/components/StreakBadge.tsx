import React from 'react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  milestone?: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, milestone = 7 }) => {
  const isMilestone = milestone && streak > 0 && streak % milestone === 0;
  const isNearMilestone = milestone && streak >= milestone - 3 && streak < milestone && (streak % milestone) >= milestone - 3;
  
  return (
    <div className={`
      inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium
      ${isMilestone 
        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg animate-pulse' 
        : isNearMilestone
        ? 'bg-orange-100 text-orange-700 border border-orange-200'
        : 'bg-gray-100 text-gray-700 border border-gray-200'}
    `}>
      <Flame className={`w-4 h-4 ${isMilestone ? 'animate-bounce' : ''}`} />
      <span>{streak} day{streak !== 1 ? 's' : ''}</span>
      {isNearMilestone && milestone && (
        <span className="text-xs opacity-75">
          ({milestone - (streak % milestone)} to milestone!)
        </span>
      )}
    </div>
  );
};
