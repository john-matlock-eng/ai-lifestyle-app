import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGoal } from '../../features/goals/services/goalService';
import Button from '../../components/common/Button';

const GoalDetailPage: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  
  const { data: goal, isLoading, error } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => getGoal(goalId!),
    enabled: !!goalId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading goal. Please try again.</p>
          <Link to="/goals" className="text-red-600 hover:text-red-700 underline text-sm">
            Back to goals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/goals"
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
        >
          ← Back to goals
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{goal.title}</h1>
            {goal.description && (
              <p className="mt-2 text-gray-600">{goal.description}</p>
            )}
          </div>
          <Button variant="outline" size="sm">
            Edit Goal
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Progress</h2>
            <div className="text-center py-8 text-gray-500">
              Detailed progress visualization coming soon...
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-center py-8 text-gray-500">
              Activity feed coming soon...
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button fullWidth>Log Activity</Button>
              <Button fullWidth variant="outline">View Statistics</Button>
            </div>
          </div>

          {/* Goal Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium text-gray-900 capitalize">{goal.status}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-900 capitalize">{goal.category}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(goal.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalDetailPage;
