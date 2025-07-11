import React, { useState, useEffect } from 'react';
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
import { UtensilsCrossed, Dumbbell, HeartPulse, ListTodo } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  useTodayMealsCount,
  useWeekWorkoutsCount,
  useWellnessScore,
  useActiveRoutines,
} from '../../features/wellness/hooks';

const WellnessDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGoals({ status: ['active'] });
  const [quickLogGoalId, setQuickLogGoalId] = useState<string | null>(null);

  const goals = data?.goals || [];

  const { data: meals = 0 } = useTodayMealsCount();
  const { data: workouts = 0 } = useWeekWorkoutsCount();
  const { data: wellness = 0 } = useWellnessScore();
  const { data: routines = 0 } = useActiveRoutines();

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
    <main role="main" aria-labelledby="wellness-dashboard-heading" className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <HeroGreeting />
        <AIInsightBanner />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile icon={UtensilsCrossed} label="Meals Today" value={meals} />
          <StatTile icon={Dumbbell} label="Workouts" value={workouts} />
          <StatTile icon={HeartPulse} label="Wellness Score" value={wellness} percent={wellness} />
          <StatTile icon={ListTodo} label="Active Routines" value={routines} />
        </div>
        {isLoading ? (
          <GoalList goals={[]} isLoading />
        ) : goals.length === 0 ? (
          <EmptyGoalsIllustration />
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Today's Goals</h2>
            {goals.slice(0, 3).map((g) => (
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
    </main>
  );
};

export default WellnessDashboardPage;
