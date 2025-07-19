import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listActivities } from "../../services/goalService";
import type {
  GoalActivity,
  GoalActivityListResponse,
} from "../../types/api.types";
import { CheckCircle, TrendingUp, XCircle } from "lucide-react";

interface ActivityHistoryProps {
  goalId: string;
  className?: string;
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  goalId,
  className = "",
}) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery<GoalActivityListResponse, Error>({
    queryKey: ["goal-activity-history", goalId, page],
    queryFn: () => listActivities(goalId, { page, limit }),
    placeholderData: (prev) => prev,
  });

  const activities = data?.activities || [];
  const pages = data?.pagination.pages || 1;

  const renderIcon = (type: string) => {
    switch (type) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-[var(--success)]" />;
      case "skipped":
        return <XCircle className="h-5 w-5 text-[var(--warning)]" />;
      default:
        return <TrendingUp className="h-5 w-5 text-[var(--primary)]" />;
    }
  };

  return (
    <div
      className={`bg-[var(--surface)] rounded-lg shadow-sm border border-[color:var(--surface-muted)] p-6 space-y-4 ${className}`}
    >
      <h2 className="text-lg font-semibold text-[var(--text)]">
        Activity History
      </h2>
      {isLoading ? (
        <p className="text-center text-[var(--text-muted)]">Loading...</p>
      ) : error ? (
        <p className="text-center text-[var(--error)]">
          Failed to load activities.
        </p>
      ) : activities.length === 0 ? (
        <p className="text-center text-[var(--text-muted)]">
          No activities found.
        </p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity: GoalActivity) => (
            <div
              key={activity.activityId}
              className="flex items-center justify-between py-3 border-b border-[var(--surface-muted)] last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    activity.activityType === "completed"
                      ? "bg-[var(--success-bg)]"
                      : activity.activityType === "progress"
                        ? "bg-[var(--accent-bg)]"
                        : activity.activityType === "skipped"
                          ? "bg-[var(--warning-bg)]"
                          : "bg-[var(--surface-muted)]"
                  }`}
                >
                  {renderIcon(activity.activityType)}
                </div>
                <div>
                  <p className="font-medium text-[var(--text)]">
                    {activity.value} {activity.unit}
                  </p>
                  {activity.note && (
                    <p className="text-sm text-muted">{activity.note}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[var(--text)]">
                  {new Date(activity.activityDate).toLocaleDateString()}
                </p>
                {activity.context?.timeOfDay && (
                  <p className="text-xs text-[var(--text-muted)]">
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
        <span className="text-sm text-muted">
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
