import React from 'react';
import type { UserStats } from '@/types/habits';
import { Trophy, Zap, TrendingUp, Star } from 'lucide-react';

interface QuickStatsProps {
  stats: UserStats;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-lg bg-success-bg">
          <Trophy className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="text-xs text-muted">Points</p>
          <p className="text-sm font-bold text-theme">{stats.totalPoints}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-lg bg-warning-bg">
          <Zap className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-xs text-muted">Streak</p>
          <p className="text-sm font-bold text-theme">{stats.weeklyStreak}d</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-lg bg-accent" style={{ background: 'var(--button-hover-bg)' }}>
          <Star className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted">Level</p>
          <p className="text-sm font-bold text-theme">{stats.currentLevel}</p>
        </div>
      </div>
    </div>
  );
};
