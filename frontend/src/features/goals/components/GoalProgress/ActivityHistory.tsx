import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listActivities } from '../../services/goalService';
import type { GoalActivity } from '../../types/api.types';
import { CheckCircle, TrendingUp, XCircle } from 'lucide-react';

interface ActivityHistoryProps {
  goalId: string;
  className?: string;
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({ goalId, className = '' }) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['goal-activity-history', goalId, page],
    queryFn: () => listActivities(goalId, { page, limit }),
    keepPreviousData: true,
  });

  const activities = data?.activities || [];
  const pages = data?.pagination.pages || 1;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'skipped':
        return <XCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900">Activity History</h2>
      {isLoading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600">Failed to load activities.</p>
      ) : activities.length === 0 ? (
        <p className="text-center text-gray-500">No activities found.</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity: GoalActivity) => (
            <div
              key={activity.activityId}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    activity.activityType === 'completed'
                      ? 'bg-green-100'
                      : activity.activityType === 'progress'
                      ? 'bg-blue-100'
                      : activity.activityType === 'skipped'
                      ? 'bg-yellow-100'
                      : 'bg-gray-100'
                  }`}
                >
                  {renderIcon(activity.activityType)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {activity.value} {activity.unit}
                  </p>
                  {activity.note && (
                    <p className="text-sm text-gray-600">{activity.note}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Date(activity.activityDate).toLocaleDateString()}
                </p>
                {activity.context?.timeOfDay && (
                  <p className="text-xs text-gray-500">
                    {activity.context.timeOfDay}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ActivityHistory;
