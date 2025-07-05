import apiClient from '../../../api/client';
import {
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalListResponse,
  GoalActivity,
  LogActivityRequest,
  GoalActivityListResponse,
  GoalProgress,
  GoalFilters,
  GoalSortOption,
} from '../types/api.types';

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
    const { data } = await apiClient.get<GoalListResponse>('/goals', { params });
    return data;
  }

  async createGoal(goal: CreateGoalRequest): Promise<Goal> {
    const { data } = await apiClient.post<Goal>('/goals', goal);
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
    }
  ): Promise<GoalActivityListResponse> {
    const { data } = await apiClient.get<GoalActivityListResponse>(
      `/goals/${goalId}/activities`,
      { params }
    );
    return data;
  }

  async logActivity(goalId: string, activity: LogActivityRequest): Promise<GoalActivity> {
    const { data } = await apiClient.post<GoalActivity>(
      `/goals/${goalId}/activities`,
      activity
    );
    return data;
  }

  // Progress operations
  async getProgress(
    goalId: string,
    period: 'current' | 'week' | 'month' | 'quarter' | 'year' | 'all' = 'current'
  ): Promise<GoalProgress> {
    const { data } = await apiClient.get<GoalProgress>(`/goals/${goalId}/progress`, {
      params: { period },
    });
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