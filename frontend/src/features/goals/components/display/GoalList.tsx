import React from 'react';
import { Goal } from '../../types/api.types';
import GoalCard from './GoalCard';
import EmptyState from './EmptyState';

interface GoalListProps {
  goals: Goal[];
  isLoading: boolean;
  onQuickLog?: (goalId: string) => void;
}

const GoalList: React.FC<GoalListProps> = ({ goals, isLoading, onQuickLog }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border-2 p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-2 bg-gray-200 rounded-full w-full"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <GoalCard key={goal.goalId} goal={goal} onQuickLog={onQuickLog} />
      ))}
    </div>
  );
};

export default GoalList;
