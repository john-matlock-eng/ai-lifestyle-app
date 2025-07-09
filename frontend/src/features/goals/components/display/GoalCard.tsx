import React from 'react';
import { Link } from 'react-router-dom';
import type { Goal } from '../../types/api.types';
import { GOAL_PATTERNS, GOAL_CATEGORIES, formatGoalValue, getProgressColor, getTrendIcon } from '../../types/ui.types';
import Button from '../../../../components/common/Button';

interface GoalCardProps {
  goal: Goal;
  onQuickLog?: (goalId: string) => void;
  onEdit?: (goal: Goal) => void;
  onArchive?: (goalId: string) => void;
  onStatusChange?: (goalId: string, status: 'active' | 'paused') => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onQuickLog, onEdit, onArchive, onStatusChange }) => {
  const pattern = GOAL_PATTERNS[goal.goalPattern];
  const category = GOAL_CATEGORIES.find(c => c.value === goal.category);
  const progressColor = getProgressColor(goal.progress.percentComplete);

  const renderProgressByPattern = () => {
    switch (goal.goalPattern) {
      case 'recurring':
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Today's Progress</span>
              <span className="font-medium">
                {goal.progress.currentPeriodValue || 0} / {formatGoalValue(goal.target.value, goal.target.unit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    ((goal.progress.currentPeriodValue || 0) / goal.target.value) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        );

      case 'streak':
        return (
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <span className="text-3xl">🔥</span>
                <span className="text-2xl font-bold text-orange-600">
                  {goal.progress.currentStreak || 0}
                </span>
              </div>
              <p className="text-xs text-gray-600">Current Streak</p>
            </div>
            {goal.progress.longestStreak && goal.progress.longestStreak > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700">
                  {goal.progress.longestStreak}
                </div>
                <p className="text-xs text-gray-600">Best Streak</p>
              </div>
            )}
          </div>
        );

      case 'milestone':
      case 'target':
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className={`font-medium ${progressColor}`}>
                {goal.progress.percentComplete.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(goal.progress.percentComplete, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {goal.progress.totalAccumulated || 0} / {formatGoalValue(goal.target.value, goal.target.unit)}
              </span>
              {goal.progress.projectedCompletion && (
                <span>Est. {new Date(goal.progress.projectedCompletion).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        );

      case 'limit': {
        const isOverLimit = (goal.progress.currentPeriodValue || 0) > goal.target.value;
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current {goal.target.period}</span>
              <span className={`font-medium ${isOverLimit ? 'text-red-600' : 'text-green-600'}`}>
                {goal.progress.currentPeriodValue || 0} / {formatGoalValue(goal.target.value, goal.target.unit)}
              </span>
            </div>
            {goal.progress.daysOverLimit && goal.progress.daysOverLimit > 0 && (
              <p className="text-xs text-red-600">
                Over limit for {goal.progress.daysOverLimit} days
              </p>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border-2 border-l-4 p-4 hover:shadow-md transition-shadow
        ${goal.status === 'paused' ? 'opacity-75' : ''}
      `}
      style={{ borderLeftColor: goal.color || pattern.color }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {goal.icon || category?.icon || pattern.icon}
            </span>
            <Link
              to={`/goals/${goal.goalId}`}
              className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
            >
              {goal.title}
            </Link>
            {category && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                {category.label}
              </span>
            )}
          </div>

          {/* Description */}
          {goal.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{goal.description}</p>
          )}

          {/* Progress Display */}
          {renderProgressByPattern()}

          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="font-medium">{goal.progress.successRate}%</span>
              <span>success</span>
            </span>
            <span className="flex items-center gap-1">
              <span>{getTrendIcon(goal.progress.trend)}</span>
              <span>{goal.progress.trend}</span>
            </span>
            {goal.progress.lastActivityDate && (
              <span>
                Last: {new Date(goal.progress.lastActivityDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-start gap-1 ml-4">
          {goal.status === 'active' && onQuickLog && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onQuickLog(goal.goalId)}
              className="flex items-center gap-1 hover:bg-primary-50"
              title="Log progress (currently blocked by backend)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Log</span>
            </Button>
          )}
          {onEdit && goal.status !== 'archived' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(goal)}
              className="flex items-center gap-1 hover:bg-blue-50"
              title="Edit goal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          {goal.status === 'active' && onStatusChange && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusChange(goal.goalId, 'paused')}
              className="flex items-center gap-1 hover:bg-yellow-50"
              title="Pause goal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Pause</span>
            </Button>
          )}
          {goal.status === 'paused' && onStatusChange && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusChange(goal.goalId, 'active')}
              className="flex items-center gap-1 hover:bg-green-50"
              title="Resume goal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Resume</span>
            </Button>
          )}
          {onArchive && goal.status !== 'archived' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onArchive(goal.goalId)}
              className="flex items-center gap-1 hover:bg-red-50"
              title="Archive goal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span className="hidden sm:inline">Archive</span>
            </Button>
          )}
          <Link to={`/goals/${goal.goalId}`}>
            <Button size="sm" variant="ghost" title="View details">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2 mt-2">
        {goal.status !== 'active' && (
          <span
            className={`
              text-xs px-2 py-1 rounded-full font-medium
              ${goal.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
              ${goal.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${goal.status === 'archived' ? 'bg-gray-100 text-gray-800' : ''}
            `}
          >
            {goal.status}
          </span>
        )}
        {goal.progress.percentComplete >= 100 && goal.status === 'active' && (
          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
            🎉 Goal Achieved!
          </span>
        )}
      </div>
    </div>
  );
};

export default GoalCard;
