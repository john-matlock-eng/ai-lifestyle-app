import apiClient from "../../../api/client";
import type {
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalListResponse,
  GoalActivity,
  LogActivityRequest,
  GoalActivityListResponse,
  GoalProgress,
} from "../types/api.types";

class GoalService {
  // Goal CRUD operations
  async listGoals(params?: {
    status?: string[];
    goalPattern?: string[];
    category?: string[];
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<GoalListResponse> {
    // Create URLSearchParams to handle array serialization properly
    const searchParams = new URLSearchParams();

    if (params?.status) {
      params.status.forEach((s) => searchParams.append("status", s));
    }
    if (params?.goalPattern) {
      params.goalPattern.forEach((p) => searchParams.append("goalPattern", p));
    }
    if (params?.category) {
      params.category.forEach((c) => searchParams.append("category", c));
    }
    if (params?.page !== undefined) {
      searchParams.append("page", params.page.toString());
    }
    if (params?.limit !== undefined) {
      searchParams.append("limit", params.limit.toString());
    }
    if (params?.sort) {
      searchParams.append("sort", params.sort);
    }

    const { data } = await apiClient.get<GoalListResponse>(
      `/goals?${searchParams.toString()}`,
    );
    return data;
  }

  async createGoal(goal: CreateGoalRequest): Promise<Goal> {
    const { data } = await apiClient.post<Goal>("/goals", goal);
    return data;
  }

  async getGoal(goalId: string): Promise<Goal> {
    const { data } = await apiClient.get<Goal>(`/goals/${goalId}`);
    return data;
  }

  async updateGoal(goalId: string, updates: UpdateGoalRequest): Promise<Goal> {
    const { data } = await apiClient.put<Goal>(`/goals/${goalId}`, updates);
    return data;
  }

  async archiveGoal(goalId: string): Promise<void> {
    await apiClient.delete(`/goals/${goalId}`);
  }

  // Activity operations
  async listActivities(
    goalId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      activityType?: string[];
      page?: number;
      limit?: number;
    },
  ): Promise<GoalActivityListResponse> {
    const { data } = await apiClient.get<GoalActivityListResponse>(
      `/goals/${goalId}/activities`,
      { params },
    );
    return data;
  }

  async logActivity(
    goalId: string,
    activity: LogActivityRequest,
  ): Promise<GoalActivity> {
    const { data } = await apiClient.post<GoalActivity>(
      `/goals/${goalId}/activities`,
      activity,
    );
    return data;
  }

  // Progress operations
  async getProgress(
    goalId: string,
    period:
      | "current"
      | "week"
      | "month"
      | "quarter"
      | "year"
      | "all" = "current",
  ): Promise<GoalProgress> {
    const { data } = await apiClient.get<GoalProgress>(
      `/goals/${goalId}/progress`,
      {
        params: { period },
      },
    );
    return data;
  }
}

export const goalService = new GoalService();

// Convenience exports for components
export const {
  listGoals,
  createGoal,
  getGoal,
  updateGoal,
  archiveGoal,
  listActivities,
  logActivity,
  getProgress,
} = goalService;
