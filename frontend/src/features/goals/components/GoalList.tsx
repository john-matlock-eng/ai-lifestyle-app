import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Edit2, Pause, Play, Archive, Trash2, Target } from 'lucide-react';
import type { Goal, GoalStatus } from '../types/goal.types';
import { GOAL_PATTERN_COLORS, GOAL_CATEGORIES } from '../types/goal.types';
import { MiniProgressRing } from './GoalProgress/ProgressRing';
import { StreakBadge } from './GoalProgress/StreakCalendar';

interface GoalListProps {
  goals: Goal[];
  onSelectGoal: (goal: Goal) => void;
  onCreateGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onUpdateStatus: (goalId: string, status: GoalStatus) => void;
  onDeleteGoal: (goalId: string) => void;
  className?: string;
}

export const GoalList: React.FC<GoalListProps> = ({
  goals,
  onSelectGoal,
  onCreateGoal,
  onEditGoal,
  onUpdateStatus,
  onDeleteGoal,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPattern, setSelectedPattern] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filter goals
  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    const matchesPattern = selectedPattern === 'all' || goal.goalPattern === selectedPattern;
    const matchesStatus = !showActiveOnly || goal.status === 'active';
    
    return matchesSearch && matchesCategory && matchesPattern && matchesStatus;
  });

  // Group goals by category
  const groupedGoals = filteredGoals.reduce((acc, goal) => {
    const category = GOAL_CATEGORIES.find(cat => cat.id === goal.category)?.name || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(goal);
    return acc;
  }, {} as Record<string, Goal[]>);

  const getGoalIcon = (pattern: string) => {
    const icons = {
      recurring: '🔄',
      milestone: '🏆',
      target: '🎯',
      streak: '🔥',
      limit: '🛡️',
    };
    return icons[pattern as keyof typeof icons] || '📌';
  };

  const renderGoalActions = (goal: Goal) => (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(openMenuId === goal.goalId ? null : goal.goalId);
        }}
        className="p-1 hover:bg-[color:var(--surface-muted)] rounded-lg transition-colors"
        aria-label="Goal actions"
      >
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>
      
      {openMenuId === goal.goalId && (
        <div className="absolute right-0 top-8 z-10 w-48 bg-[var(--surface)] rounded-lg shadow-lg border border-[color:var(--surface-muted)] py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditGoal(goal);
              setOpenMenuId(null);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-[color:var(--surface-muted)] flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit Goal
          </button>
          
          {goal.status === 'active' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(goal.goalId, 'paused');
                setOpenMenuId(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-[color:var(--surface-muted)] flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause Goal
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(goal.goalId, 'active');
                setOpenMenuId(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-[color:var(--surface-muted)] flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Resume Goal
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(goal.goalId, 'archived');
              setOpenMenuId(null);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-[color:var(--surface-muted)] flex items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            Archive Goal
          </button>
          
          <hr className="my-1" />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this goal?')) {
                onDeleteGoal(goal.goalId);
                setOpenMenuId(null);
              }
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Goal
          </button>
        </div>
      )}
    </div>
  );

  const renderGoalCard = (goal: Goal) => {
    const color = GOAL_PATTERN_COLORS[goal.goalPattern];
    const isOverdue = goal.target.targetDate && new Date(goal.target.targetDate) < new Date();
    
    return (
      <div
        key={goal.goalId}
        onClick={() => onSelectGoal(goal)}
        className={`
          bg-[var(--surface)] rounded-lg border-2 p-4 cursor-pointer transition-all duration-200
          hover:shadow-lg hover:border-[color:var(--surface-muted)]
          ${goal.status === 'paused' ? 'opacity-60' : ''}
          ${goal.status === 'completed' ? 'border-green-300 bg-green-50' : 'border-[color:var(--surface-muted)]'}
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl">{getGoalIcon(goal.goalPattern)}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text)] mb-1">{goal.title}</h3>
              {goal.description && (
                <p className="text-sm text-muted line-clamp-1">{goal.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                >
                  {goal.goalPattern}
                </span>
                {isOverdue && goal.status === 'active' && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-600">
                    Overdue
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MiniProgressRing
              progress={goal.progress.percentComplete}
              color={color}
              size={40}
            />
            {renderGoalActions(goal)}
          </div>
        </div>

        {/* Pattern-specific display */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {goal.goalPattern === 'recurring' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {goal.progress.currentPeriodValue || 0} / {goal.target.value} {goal.target.unit} this {goal.target.period}
              </span>
              <span className="font-medium" style={{ color }}>
                {goal.progress.successRate}% success rate
              </span>
            </div>
          )}
          
          {goal.goalPattern === 'milestone' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {goal.progress.totalAccumulated || 0} / {goal.target.value} {goal.target.unit}
              </span>
              <span className="font-medium" style={{ color }}>
                {goal.progress.remainingToGoal} to go
              </span>
            </div>
          )}
          
          {goal.goalPattern === 'target' && goal.target.targetDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                Target: {new Date(goal.target.targetDate).toLocaleDateString()}
              </span>
              <span className="font-medium" style={{ color }}>
                {goal.progress.trend} trend
              </span>
            </div>
          )}
          
          {goal.goalPattern === 'streak' && (
            <div className="flex items-center justify-between">
              <StreakBadge
                currentStreak={goal.progress.currentStreak || 0}
                size="sm"
                color={color}
              />
              <span className="text-sm text-muted">
                Best: {goal.progress.longestStreak || 0} days
              </span>
            </div>
          )}
          
          {goal.goalPattern === 'limit' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                Avg: {goal.progress.averageValue?.toFixed(1)} {goal.target.unit}/{goal.target.period}
              </span>
              <span 
                className="font-medium"
                style={{ 
                  color: (goal.progress.averageValue || 0) <= goal.target.value ? '#10B981' : '#EF4444' 
                }}
              >
                {goal.progress.daysOverLimit || 0} days over limit
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--text)]">Your Goals</h2>
        <button
          onClick={onCreateGoal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]"
        >
          <Plus className="h-5 w-5" />
          New Goal
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[var(--surface-muted)] rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="h-4 w-4 text-purple-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Active only</span>
          </label>
        </div>

        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 border border-[color:var(--surface-muted)] rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Categories</option>
            {GOAL_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
            className="px-3 py-1.5 border border-[color:var(--surface-muted)] rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Patterns</option>
            <option value="recurring">🔄 Recurring</option>
            <option value="milestone">🏆 Milestone</option>
            <option value="target">🎯 Target</option>
            <option value="streak">🔥 Streak</option>
            <option value="limit">🛡️ Limit</option>
          </select>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Target className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-[var(--text)] mb-2">No goals found</h3>
          <p className="text-muted mb-4">
            {searchTerm || selectedCategory !== 'all' || selectedPattern !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first goal to get started'}
          </p>
          {!searchTerm && selectedCategory === 'all' && selectedPattern === 'all' && (
            <button
              onClick={onCreateGoal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-5 w-5" />
              Create Goal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedGoals).map(([category, categoryGoals]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{category}</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryGoals.map(renderGoalCard)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
