import React from 'react';
import type { UserStats } from '@/types/habits';
import { getLevelConfig } from '@/types/habits';
import { Trophy, Zap, Flame, Target } from 'lucide-react';

interface QuickStatsProps {
  stats: UserStats;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  const levelConfig = getLevelConfig(stats.currentLevel);
  
  const statItems = [
    {
      icon: <Trophy className="w-5 h-5 text-yellow-500" />,
      label: 'Level',
      value: stats.currentLevel,
      subtext: levelConfig.label
    },
    {
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      label: 'Points',
      value: stats.totalPoints.toLocaleString(),
      subtext: `${100 - stats.nextLevelProgress}% to next`
    },
    {
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      label: 'Week Streak',
      value: stats.weeklyStreak,
      subtext: 'days'
    },
    {
      icon: <Target className="w-5 h-5 text-blue-500" />,
      label: 'Today',
      value: `${stats.habitsCompletedToday}/${stats.totalHabits}`,
      subtext: 'completed'
    }
  ];

  return (
    <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200"
        >
          <div className="flex-shrink-0">{stat.icon}</div>
          <div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900">
              {stat.value}
              {stat.subtext && (
                <span className="text-xs font-normal text-gray-500 ml-1">
                  {stat.subtext}
                </span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
