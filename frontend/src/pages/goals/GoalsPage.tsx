import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GoalStatus, GoalPattern } from '../../features/goals/types/api.types';
import { GOAL_PATTERNS, GOAL_CATEGORIES } from '../../features/goals/types/ui.types';
import { listGoals } from '../../features/goals/services/goalService';
import GoalList from '../../features/goals/components/display/GoalList';
import Button from '../../components/common/Button';
import QuickLogModal from '../../features/goals/components/logging/QuickLogModal';

const GoalsPage: React.FC = () => {
  const [selectedStatuses, setSelectedStatuses] = useState<GoalStatus[]>(['active']);
  const [selectedPatterns, setSelectedPatterns] = useState<GoalPattern[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [quickLogGoalId, setQuickLogGoalId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['goals', { selectedStatuses, selectedPatterns, selectedCategories }],
    queryFn: () =>
      listGoals({
        status: selectedStatuses,
        goalPattern: selectedPatterns,
        category: selectedCategories,
      }),
  });

  const handleStatusToggle = (status: GoalStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handlePatternToggle = (pattern: GoalPattern) => {
    setSelectedPatterns((prev) =>
      prev.includes(pattern) ? prev.filter((p) => p !== pattern) : [...prev, pattern]
    );
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleQuickLog = (goalId: string) => {
    setQuickLogGoalId(goalId);
  };

  const statusOptions: { value: GoalStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'paused', label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
    { value: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-800' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Goals</h1>
          <p className="mt-1 text-gray-600">Track your progress and stay motivated</p>
        </div>
        <Link to="/goals/new">
          <Button size="lg" className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Goal
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusToggle(status.value)}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-all
                    ${
                      selectedStatuses.includes(status.value)
                        ? status.color
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Goal Type</h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(GOAL_PATTERNS).map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => handlePatternToggle(pattern.id)}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1
                    ${
                      selectedPatterns.includes(pattern.id)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                  style={{
                    backgroundColor: selectedPatterns.includes(pattern.id) ? pattern.color : undefined,
                  }}
                >
                  <span>{pattern.icon}</span>
                  <span>{pattern.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Category</h3>
            <div className="flex flex-wrap gap-2">
              {GOAL_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryToggle(category.value)}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1
                    ${
                      selectedCategories.includes(category.value)
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedPatterns.length > 0 || selectedCategories.length > 0 || selectedStatuses.length !== 1) && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => {
                setSelectedStatuses(['active']);
                setSelectedPatterns([]);
                setSelectedCategories([]);
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Goals List */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading goals. Please try again.</p>
        </div>
      ) : (
        <GoalList
          goals={data?.goals || []}
          isLoading={isLoading}
          onQuickLog={handleQuickLog}
        />
      )}

      {/* Stats Summary */}
      {data && data.goals.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data.goals.filter((g) => g.status === 'active').length}
            </div>
            <p className="text-sm text-gray-600">Active Goals</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.goals.filter((g) => g.progress.percentComplete >= 100).length}
            </div>
            <p className="text-sm text-gray-600">Achieved</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.max(...data.goals.map((g) => g.progress.currentStreak || 0))}
            </div>
            <p className="text-sm text-gray-600">Best Streak</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">
              {Math.round(
                data.goals.reduce((sum, g) => sum + g.progress.successRate, 0) / data.goals.length
              )}%
            </div>
            <p className="text-sm text-gray-600">Avg Success Rate</p>
          </div>
        </div>
      )}

      {/* Quick Log Modal */}
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

export default GoalsPage;
