import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GoalList from '../../features/goals/components/display/GoalList';
import { useGoals } from '../../features/goals/hooks/useGoals';
import QuickLogModal from '../../features/goals/components/logging/QuickLogModal';
import type { Goal } from '../../features/goals/types/api.types';
import HeroGreeting from '../../features/wellness/components/HeroGreeting';
import StatTile from '../../features/wellness/components/StatTile';
import GoalCardMini from '../../features/wellness/components/GoalCardMini';
import EmptyGoalsIllustration from '../../features/wellness/components/EmptyGoalsIllustration';
import AIInsightBanner from '../../features/wellness/components/AIInsightBanner';
import { CheckCircle, Flame, PercentCircle, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

const WellnessDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGoals({ status: ['active'] });
  const [quickLogGoalId, setQuickLogGoalId] = useState<string | null>(null);

  const goals = data?.goals || [];

  const stats = useMemo(() => {
    const active = goals.length;
    const longestStreak = goals.reduce(
      (m, g) => Math.max(m, g.progress.currentStreak || 0),
      0
    );
    const avgSuccess =
      active > 0
        ? Math.round(
            goals.reduce((sum, g) => sum + g.progress.successRate, 0) / active
          )
        : 0;
    const avgCompletion =
      active > 0
        ? Math.round(
            goals.reduce((sum, g) => sum + g.progress.percentComplete, 0) /
              active
          )
        : 0;
    return { active, longestStreak, avgSuccess, avgCompletion };
  }, [goals]);

  const handleQuickLog = (goalId: string) => {
    const goal: Goal | undefined = goals.find((g) => g.goalId === goalId);
    const maybeType = goal as unknown as { goalType?: string } | undefined;
    if (maybeType?.goalType === 'journal') {
      navigate('/journal');
      return;
    }
    setQuickLogGoalId(goalId);
  };

  useEffect(() => {
    if (
      goals.length > 0 &&
      goals.every(
        (g) => g.schedule?.frequency === 'daily' && g.progress.percentComplete >= 100
      )
    ) {
      confetti();
    }
  }, [goals]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <HeroGreeting />
        <AIInsightBanner />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile icon={CheckCircle} label="Active Goals" value={stats.active} />
          <StatTile icon={Flame} label="Longest Streak" value={stats.longestStreak} />
          <StatTile icon={PercentCircle} label="Avg Success" value={`${stats.avgSuccess}%`} />
          <StatTile
            icon={TrendingUp}
            label="Today"
            value={`${stats.avgCompletion}%`}
            progress={stats.avgCompletion}
          />
        </div>
        {isLoading ? (
          <GoalList goals={[]} isLoading />
        ) : goals.length === 0 ? (
          <EmptyGoalsIllustration />
        ) : (
          <div className="space-y-3">
            {goals.map((g) => (
              <GoalCardMini key={g.goalId} goal={g} onQuickLog={handleQuickLog} />
            ))}
          </div>
        )}
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

export default WellnessDashboardPage;
