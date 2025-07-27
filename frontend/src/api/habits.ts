/**
 * API client functions for habit tracking
 */
import apiClient from "./client";
import type {
  Habit,
  HabitCheckIn,
  UserStats,
  CreateHabitRequest,
  UpdateHabitRequest,
  HabitCheckInRequest,
  HabitListResponse,
  HabitAnalytics,
} from "@/types/habits";

/**
 * Get today's habits for dashboard display
 */
export async function getTodayHabits(): Promise<HabitListResponse> {
  const response = await apiClient.get<HabitListResponse>("/habits/today");
  return response.data;
}

/**
 * List all habits with optional filtering
 */
export async function listHabits(
  dashboardOnly: boolean = false,
): Promise<HabitListResponse> {
  const params = dashboardOnly ? { dashboard: "true" } : {};
  const response = await apiClient.get<HabitListResponse>("/habits", {
    params,
  });
  return response.data;
}

/**
 * Get all habits without stats
 */
export async function getAllHabits(): Promise<Habit[]> {
  const response = await apiClient.get<Habit[]>("/habits/all");
  return response.data;
}

/**
 * Get a single habit by ID
 */
export async function getHabit(habitId: string): Promise<Habit> {
  const response = await apiClient.get<Habit>(`/habits/${habitId}`);
  return response.data;
}

/**
 * Create a new habit
 */
export async function createHabit(data: CreateHabitRequest): Promise<Habit> {
  const response = await apiClient.post<Habit>("/habits", data);
  return response.data;
}

/**
 * Update an existing habit
 */
export async function updateHabit(
  habitId: string,
  data: UpdateHabitRequest,
): Promise<Habit> {
  const response = await apiClient.patch<Habit>(`/habits/${habitId}`, data);
  return response.data;
}

/**
 * Delete a habit (soft delete)
 */
export async function deleteHabit(habitId: string): Promise<void> {
  await apiClient.delete(`/habits/${habitId}`);
}

/**
 * Check in a habit for today
 */
export async function checkInHabit(
  habitId: string,
  data: HabitCheckInRequest,
): Promise<HabitCheckIn> {
  const response = await apiClient.post<HabitCheckIn>(
    `/habits/${habitId}/check-in`,
    data,
  );
  return response.data;
}

/**
 * Skip a habit for today
 */
export async function skipHabit(
  habitId: string,
): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ success: boolean }>(
    `/habits/${habitId}/skip`,
  );
  return response.data;
}

/**
 * Get user's gamification stats
 */
export async function getUserStats(): Promise<UserStats> {
  const response = await apiClient.get<UserStats>("/users/stats");
  return response.data;
}

/**
 * Get analytics for a specific habit
 */
export async function getHabitAnalytics(
  habitId: string,
  period: "week" | "month" | "year" = "month",
): Promise<HabitAnalytics> {
  const response = await apiClient.get<HabitAnalytics>(
    `/habits/${habitId}/analytics`,
    { params: { period } },
  );
  return response.data;
}

/**
 * Get habit check-in history
 */
export async function getHabitHistory(
  habitId: string,
  startDate?: string,
  endDate?: string,
): Promise<HabitCheckIn[]> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await apiClient.get<HabitCheckIn[]>(
    `/habits/${habitId}/history`,
    { params },
  );
  return response.data;
}

/**
 * Reorder habits for display
 */
export async function reorderHabits(habitIds: string[]): Promise<void> {
  await apiClient.put("/habits/reorder", { habitIds });
}
