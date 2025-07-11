import React from 'react';
import type { Goal } from '../../types/api.types';

interface GoalsSummaryHeaderProps {
  goals: Goal[];
}

const GoalsSummaryHeader: React.FC<GoalsSummaryHeaderProps> = ({ goals }) => {
  const activeCount = goals.length;
  const longestStreak = goals.reduce(
    (max, g) => Math.max(max, g.progress.currentStreak || 0),
    0
  );
  const avgSuccess =
    activeCount > 0
      ? Math.round(
          goals.reduce((sum, g) => sum + g.progress.successRate, 0) / activeCount
        )
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-sm p-4 text-center">
        <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
        <p className="text-sm text-gray-600">Active Goals</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 text-center">
        <div className="flex items-center justify-center text-2xl font-bold text-orange-600 gap-1">
          <span>{longestStreak}</span>
          <span>🔥</span>
        </div>
        <p className="text-sm text-gray-600">Current Streak</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 text-center">
        <div className="text-2xl font-bold text-primary-600">{avgSuccess}%</div>
        <p className="text-sm text-gray-600">Avg Success</p>
      </div>
    </div>
  );
};

export default GoalsSummaryHeader;
