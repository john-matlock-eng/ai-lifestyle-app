import React from 'react';
import type { Goal } from '../../goals/types/api.types';
import { MiniProgressRing } from '../../goals/components/GoalProgress/ProgressRing';
import Button from '../../../components/common/Button';

interface GoalCardMiniProps {
  goal: Goal;
  onQuickLog?: (goalId: string) => void;
}

const GoalCardMini: React.FC<GoalCardMiniProps> = ({ goal, onQuickLog }) => {
  const streak = goal.progress.currentStreak || 0;
  const progress = goal.progress.percentComplete;

  return (
    <div className="flex items-center bg-[var(--color-surface)] rounded-lg p-3 shadow">
      <div className="text-2xl mr-3">{goal.icon}</div>
      <div className="flex-1">
        <h3 className="font-semibold text-[var(--color-text)]">{goal.title}</h3>
          {goal.goalPattern === 'streak' ? (
            <div className="flex items-center gap-1 text-sm text-[color:var(--color-text-muted,theme(colors.gray.600))]">
              <span>{streak} day{streak !== 1 && 's'}</span>
              {streak > 1 && (
                <span aria-label="streak" className="bg-orange-500 text-white rounded-full px-2 text-xs">🔥 {streak}</span>
              )}
            </div>
          ) : (
            <MiniProgressRing progress={progress} size={32} />
          )}
      </div>
      {onQuickLog && (
        <Button
          size="sm"
          aria-label={`Log ${goal.title}`}
          className="ml-3 bg-gradient-to-r from-primary-500 to-primary-400 rounded-xl hover:-translate-y-0.5 transition-transform text-white"
          onClick={() => onQuickLog(goal.goalId)}
        >
          Log
        </Button>
      )}
    </div>
  );
};

export default GoalCardMini;
