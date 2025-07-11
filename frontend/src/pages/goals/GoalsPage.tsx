import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Goal, GoalStatus, GoalPattern, UpdateGoalRequest } from '../../features/goals/types/api.types';
import { GOAL_PATTERNS, GOAL_CATEGORIES } from '../../features/goals/types/ui.types';
import { listGoals, updateGoal, archiveGoal } from '../../features/goals/services/goalService';
import GoalList from '../../features/goals/components/display/GoalList';
import UpdateGoalForm from '../../features/goals/components/UpdateGoalForm';
import Button from '../../components/common/Button';
import QuickLogModal from '../../features/goals/components/logging/QuickLogModal';

const GoalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [selectedStatuses, setSelectedStatuses] = useState<GoalStatus[]>(['active', 'paused']);
  const [selectedPatterns, setSelectedPatterns] = useState<GoalPattern[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [quickLogGoalId, setQuickLogGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const queryClient = useQueryClient();

  // Update selected statuses based on tab
  React.useEffect(() => {
    if (activeTab === 'active') {
      setSelectedStatuses(['active', 'paused']);
    } else {
      setSelectedStatuses(['archived', 'completed']);
    }
  }, [activeTab]);

  // Get all goals once for counting
  const { data: allGoalsData } = useQuery({
    queryKey: ['all-goals'],
    queryFn: () => listGoals({}),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['goals', { selectedStatuses, selectedPatterns, selectedCategories }],
    queryFn: () =>
      listGoals({
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        goalPattern: selectedPatterns.length > 0 ? selectedPatterns : undefined,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
      }),
  });

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

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, updates }: { goalId: string; updates: UpdateGoalRequest }) => 
      updateGoal(goalId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setEditingGoal(null);
    },
  });

  // Archive goal mutation
  const archiveGoalMutation = useMutation({
    mutationFn: (goalId: string) => archiveGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
  };

  const handleArchive = async (goalId: string) => {
    if (confirm('Are you sure you want to archive this goal?')) {
      archiveGoalMutation.mutate(goalId);
    }
  };

  const handleStatusChange = async (goalId: string, status: 'active' | 'paused') => {
    updateGoalMutation.mutate({ goalId, updates: { status } });
  };

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

      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow-sm border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('active')}
            className={`
              px-6 py-3 font-medium text-sm border-b-2 transition-colors
              ${activeTab === 'active' 
                ? 'text-primary-600 border-primary-600' 
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Active Goals
            {allGoalsData && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                {allGoalsData.goals.filter(g => g.status === 'active' || g.status === 'paused').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`
              px-6 py-3 font-medium text-sm border-b-2 transition-colors
              ${activeTab === 'archived' 
                ? 'text-primary-600 border-primary-600' 
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Archived
            {allGoalsData && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                {allGoalsData.goals.filter(g => g.status === 'archived' || g.status === 'completed').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-b-lg shadow-sm p-4 mb-6">
        <div className="space-y-4">
          {activeTab === 'active' ? (
            /* Status Filter for Active Tab */
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (selectedStatuses.includes('active')) {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== 'active'));
                    } else {
                      setSelectedStatuses([...selectedStatuses, 'active']);
                    }
                  }}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-all
                    ${selectedStatuses.includes('active')
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  Active
                </button>
                <button
                  onClick={() => {
                    if (selectedStatuses.includes('paused')) {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== 'paused'));
                    } else {
                      setSelectedStatuses([...selectedStatuses, 'paused']);
                    }
                  }}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-all
                    ${selectedStatuses.includes('paused')
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  Paused
                </button>
              </div>
            </div>
          ) : (
            /* Status Filter for Archived Tab */
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (selectedStatuses.includes('completed')) {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== 'completed'));
                    } else {
                      setSelectedStatuses([...selectedStatuses, 'completed']);
                    }
                  }}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-all
                    ${selectedStatuses.includes('completed')
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  Completed
                </button>
                <button
                  onClick={() => {
                    if (selectedStatuses.includes('archived')) {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== 'archived'));
                    } else {
                      setSelectedStatuses([...selectedStatuses, 'archived']);
                    }
                  }}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-all
                    ${selectedStatuses.includes('archived')
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  Archived
                </button>
              </div>
            </div>
          )}

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
        {(selectedPatterns.length > 0 || selectedCategories.length > 0 || 
          (activeTab === 'active' && selectedStatuses.length > 0 && (!selectedStatuses.includes('active') && !selectedStatuses.includes('paused'))) ||
          (activeTab === 'archived' && selectedStatuses.length > 0 && (!selectedStatuses.includes('archived') && !selectedStatuses.includes('completed')))) && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => {
                if (activeTab === 'active') {
                  setSelectedStatuses(['active', 'paused']);
                } else {
                  setSelectedStatuses(['archived', 'completed']);
                }
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
          onEdit={handleEdit}
          onArchive={handleArchive}
          onStatusChange={handleStatusChange}
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

      {/* Edit Goal Modal */}
      {editingGoal && (
        <UpdateGoalForm
          goal={editingGoal}
          onUpdate={async (goalId, updates) => {
            await updateGoalMutation.mutateAsync({ goalId, updates });
          }}
          onCancel={() => setEditingGoal(null)}
          isLoading={updateGoalMutation.isPending}
        />
      )}
    </div>
  );
};

export default GoalsPage;
