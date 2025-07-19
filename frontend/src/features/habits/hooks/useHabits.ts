import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Habit, UserStats, CreateHabitRequest, UpdateHabitRequest } from '@/types/habits';
import { habitService } from '../services/habitService';


export const useHabits = () => {
  const queryClient = useQueryClient();
  // const [error, setError] = useState<string | null>(null); // TODO: Implement error handling
  
  // Query for today's habits
  const { 
    data: todayData, 
    isLoading: isLoadingHabits 
  } = useQuery({
    queryKey: ['habits', 'today'],
    queryFn: () => habitService.getTodayHabits(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const habits = todayData?.habits || [];
  const serverStats = todayData?.stats;
  
  // Use stats from today's habits response or fallback to separate query
  const stats = {
    totalPoints: serverStats?.totalPoints ?? 0,
    currentLevel: serverStats?.currentLevel ?? 1,
    nextLevelProgress: serverStats?.nextLevelProgress ?? 0,
    weeklyStreak: serverStats?.weeklyStreak ?? 0,
    perfectDays: serverStats?.perfectDays ?? 0,
    totalCheckIns: serverStats?.totalCheckIns ?? 0,
    habitsCompletedToday: serverStats?.habitsCompletedToday ?? 0,
    totalHabits: serverStats?.totalHabits ?? 0
  };
  
  // Check in mutation
  const checkInMutation = useMutation<
    { success: boolean; points: number; milestone: boolean },
    Error,
    { habitId: string; completed: boolean; note?: string }
  >({
    mutationFn: async ({ habitId, completed, note }) => {
      const data = await habitService.checkIn(habitId, { completed, note });
      
      // Update the habit in cache
      const todayData = queryClient.getQueryData<{ habits: Habit[]; stats: UserStats }>(['habits', 'today']);
      if (todayData) {
        queryClient.setQueryData(['habits', 'today'], {
          ...todayData,
          habits: todayData.habits.map(habit => 
            habit.id === habitId 
              ? { 
                  ...habit, 
                  completedToday: completed,
                  currentStreak: data.currentStreak,
                  weekProgress: habit.weekProgress.map((completed, index) => 
                    index === new Date().getDay() ? completed : completed
                  )
                }
              : habit
          )
        });
        
        // Update stats if points were earned
        if (data.points > 0) {
          queryClient.setQueryData(['habits', 'today'], {
            ...todayData,
            stats: {
              ...todayData.stats,
              totalPoints: (todayData.stats?.totalPoints ?? 0) + data.points,
              totalCheckIns: (todayData.stats?.totalCheckIns ?? 0) + 1,
              // Recalculate level progress
              nextLevelProgress: (((todayData.stats?.totalPoints ?? 0) + data.points) % ((todayData.stats?.currentLevel ?? 1) * 100)) / ((todayData.stats?.currentLevel ?? 1) * 100) * 100,
              currentLevel: Math.floor(((todayData.stats?.totalPoints ?? 0) + data.points) / 100) + 1
            }
          });
        }
      }
      
      // Return success data
      return {
        success: true,
        points: data.points,
        milestone: data.streakContinued && data.currentStreak % 7 === 0
      };
    },
    onError: (error) => {
      console.error('Check-in failed:', error);
      throw error;
    }
  });
  
  // Skip habit mutation
  const skipMutation = useMutation({
    mutationFn: (habitId: string) => habitService.skipHabit(habitId),
    onSuccess: (_, habitId) => {
      queryClient.setQueryData(['habits', 'today'], (oldHabits: Habit[] = []) => 
        oldHabits.map(habit => 
          habit.id === habitId 
            ? { ...habit, skippedToday: true }
            : habit
        )
      );
      console.log('Habit skipped for today');
    },
    onError: () => {
      console.error('Failed to skip habit');
    }
  });
  
  // Create habit mutation
  const createMutation = useMutation({
    mutationFn: (habitData: CreateHabitRequest) => habitService.createHabit(habitData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      console.log('Habit created successfully!');
    },
    onError: () => {
      console.error('Failed to create habit');
    }
  });
  
  // Update habit mutation
  const updateMutation = useMutation({
    mutationFn: ({ habitId, updates }: { habitId: string; updates: UpdateHabitRequest }) => 
      habitService.updateHabit(habitId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      console.log('Habit updated successfully!');
    },
    onError: () => {
      console.error('Failed to update habit');
    }
  });
  
  // Delete habit mutation
  const deleteMutation = useMutation({
    mutationFn: (habitId: string) => habitService.deleteHabit(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      console.log('Habit deleted successfully');
    },
    onError: () => {
      console.error('Failed to delete habit');
    }
  });
  
  const checkInHabit = useCallback(async (habitId: string, completed: boolean, note?: string) => {
    try {
      const result = await checkInMutation.mutateAsync({ habitId, completed, note });
      return result;
    } catch {
      // Return the error result from onError
      return { success: false, points: 0, milestone: false };
    }
  }, [checkInMutation]);
  
  const skipHabit = useCallback(async (habitId: string) => {
    await skipMutation.mutateAsync(habitId);
  }, [skipMutation]);
  
  const createHabit = useCallback(async (habitData: CreateHabitRequest) => {
    return await createMutation.mutateAsync(habitData);
  }, [createMutation]);
  
  const updateHabit = useCallback(async (habitId: string, updates: UpdateHabitRequest) => {
    return await updateMutation.mutateAsync({ habitId, updates });
  }, [updateMutation]);
  
  const deleteHabit = useCallback(async (habitId: string) => {
    await deleteMutation.mutateAsync(habitId);
  }, [deleteMutation]);
  
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['habits'] });
  }, [queryClient]);
  
  return {
    habits,
    stats,
    isLoading: isLoadingHabits,
    error: null,
    checkInHabit,
    skipHabit,
    createHabit,
    updateHabit,
    deleteHabit,
    refresh,
    isCheckingIn: checkInMutation.isPending,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
