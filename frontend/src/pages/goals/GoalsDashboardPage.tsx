import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoalList from '../../features/goals/components/display/GoalList';
import GoalsSummaryHeader from '../../features/goals/components/display/GoalsSummaryHeader';
import { useGoals } from '../../features/goals/hooks/useGoals';
import QuickLogModal from '../../features/goals/components/logging/QuickLogModal';
import type { Goal } from '../../features/goals/types/api.types';

const GoalsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGoals({ status: ['active'] });
  const [quickLogGoalId, setQuickLogGoalId] = useState<string | null>(null);

  const handleQuickLog = (goalId: string) => {
    const goal: Goal | undefined = data?.goals.find((g) => g.goalId === goalId);
    const maybeType = goal as unknown as { goalType?: string } | undefined;
    if (maybeType?.goalType === 'journal') {
      navigate('/journal');
      return;
    }
    setQuickLogGoalId(goalId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Wellness Dashboard</h1>
        <GoalsSummaryHeader goals={data?.goals || []} />
        <GoalList goals={data?.goals || []} isLoading={isLoading} onQuickLog={handleQuickLog} />
      </div>
      {quickLogGoalId && (
        <QuickLogModal
          goalId={quickLogGoalId}
          isOpen={!!quickLogGoalId}
          onClose={() => setQuickLogGoalId(null)}
        />
      )}
    </div>
  );
};

export default GoalsDashboardPage;
