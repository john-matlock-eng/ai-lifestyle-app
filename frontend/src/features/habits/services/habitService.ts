import * as habitApi from '@/api/habits';
import type { Habit, HabitCheckIn, UserStats, CreateHabitRequest, UpdateHabitRequest, HabitCheckInRequest, HabitAnalytics, HabitListResponse } from '@/types/habits';

class HabitService {
  async getTodayHabits(): Promise<HabitListResponse> {
    return habitApi.getTodayHabits();
  }
  
  async getAllHabits(): Promise<Habit[]> {
    return habitApi.getAllHabits();
  }
  
  async getHabit(habitId: string): Promise<Habit> {
    return habitApi.getHabit(habitId);
  }
  
  async checkIn(habitId: string, data: HabitCheckInRequest): Promise<HabitCheckIn> {
    return habitApi.checkInHabit(habitId, data);
  }
  
  async skipHabit(habitId: string): Promise<{ success: boolean }> {
    return habitApi.skipHabit(habitId);
  }
  
  async getUserStats(): Promise<UserStats> {
    return habitApi.getUserStats();
  }
  
  async getHabitAnalytics(habitId: string, period: 'week' | 'month' | 'year' = 'week'): Promise<HabitAnalytics> {
    return habitApi.getHabitAnalytics(habitId, period);
  }
  
  async createHabit(habitData: CreateHabitRequest): Promise<Habit> {
    return habitApi.createHabit(habitData);
  }
  
  async updateHabit(habitId: string, updates: UpdateHabitRequest): Promise<Habit> {
    return habitApi.updateHabit(habitId, updates);
  }
  
  async deleteHabit(habitId: string): Promise<void> {
    return habitApi.deleteHabit(habitId);
  }
  
  async reorderHabits(habitIds: string[]): Promise<void> {
    return habitApi.reorderHabits(habitIds);
  }
}

export const habitService = new HabitService();
