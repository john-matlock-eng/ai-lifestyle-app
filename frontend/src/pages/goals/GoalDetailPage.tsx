import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGoalProgress } from "../../features/goals/hooks/useGoals";
import {
  getGoal,
  listActivities,
  updateGoal,
  archiveGoal,
  logActivity,
} from "../../features/goals/services/goalService";
import type {
  Goal,
  GoalActivity,
  LogActivityRequest,
} from "../../features/goals/types/api.types";
import { GoalDetail } from "../../features/goals/components/GoalDetail";
import Button from "../../components/common/Button";

const GoalDetailPage: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: goal,
    isLoading: goalLoading,
    error,
  } = useQuery({
    queryKey: ["goal", goalId],
    queryFn: () => getGoal(goalId!),
    enabled: !!goalId,
  });

  const { data: activitiesData, isLoading: actLoading } = useQuery({
    queryKey: ["goal-activities", goalId],
    queryFn: () => listActivities(goalId!),
    enabled: !!goalId,
  });

  const { data: progressData, isLoading: progLoading } = useGoalProgress(
    goalId!,
    "current",
  );

  const updateStatus = useMutation<
    void,
    Error,
    "active" | "paused" | "completed" | "archived"
  >({
    mutationFn: async (status) => {
      if (status === "archived") {
        await archiveGoal(goalId!);
        return;
      }
      await updateGoal(goalId!, { status: status as "active" | "paused" });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["goal", goalId] }),
  });

  const deleteGoal = useMutation({
    mutationFn: () => archiveGoal(goalId!),
    onSuccess: () => navigate("/goals"),
  });

  const logMutation = useMutation({
    mutationFn: (activity: LogActivityRequest) =>
      logActivity(goalId!, activity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-activities", goalId] });
      queryClient.invalidateQueries({ queryKey: ["goal", goalId] });
    },
  });

  if (goalLoading || actLoading || progLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">Loading...</div>
    );
  }

  if (error || !goal) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-red-600">
        Failed to load goal.
        <div className="mt-4">
          <Button onClick={() => navigate("/goals")}>Back to Goals</Button>
        </div>
      </div>
    );
  }

  return (
    <GoalDetail
      goal={goal as Goal}
      activities={(activitiesData?.activities as GoalActivity[]) || []}
      onBack={() => navigate("/goals")}
      onEdit={() => navigate(`/goals/${goal.goalId}/edit`)}
      onUpdateStatus={(
        status: "active" | "paused" | "completed" | "archived",
      ) => updateStatus.mutate(status)}
      onDelete={() => deleteGoal.mutate()}
      onLogActivity={(activity: Partial<GoalActivity>) =>
        logMutation.mutate(activity as LogActivityRequest)
      }
      progressData={progressData}
    />
  );
};

export default GoalDetailPage;
