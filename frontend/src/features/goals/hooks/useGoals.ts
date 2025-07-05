import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listGoals, 
  createGoal, 
  updateGoal, 
  archiveGoal, 
  logActivity,
  getGoal,
  getProgress
} from '../services/goalService';
import { 
  Goal, 
  CreateGoalRequest, 
  UpdateGoalRequest, 
  LogActivityRequest,
  GoalFilters,
  GoalSortOption 
} from '../types/api.types';

// Hook for listing goals with filters
export function useGoals(filters?: {
  status?: string[];
  goalPattern?: string[];
  category?: string[];
  page?: number;
  limit?: number;
  sort?: string;
}) {
  return useQuery({
    queryKey: ['goals', filters],
    queryFn: () => listGoals(filters),
  });
}

// Hook for getting a single goal
export function useGoal(goalId: string | undefined) {
  return useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => getGoal(goalId!),
    enabled: !!goalId,
  });
}

// Hook for creating a goal
export function useCreateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createGoal,
    onSuccess: (newGoal) => {
      // Invalidate and refetch goals list
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      // Add the new goal to cache
      queryClient.setQueryData(['goal', newGoal.goalId], newGoal);
    },
  });
}

// Hook for updating a goal
export function useUpdateGoal(goalId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updates: UpdateGoalRequest) => updateGoal(goalId, updates),
    onSuccess: (updatedGoal) => {
      // Update the goal in cache
      queryClient.setQueryData(['goal', goalId], updatedGoal);
      // Invalidate goals list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// Hook for archiving a goal
export function useArchiveGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: archiveGoal,
    onSuccess: (_, goalId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['goal', goalId] });
      // Invalidate goals list
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// Hook for logging activity
export function useLogActivity(goalId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (activity: LogActivityRequest) => logActivity(goalId, activity),
    onSuccess: () => {
      // Invalidate related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal-activities', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal-progress', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] }); // Update list progress
    },
    // Optimistic update example (optional)
    onMutate: async (activity) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goal', goalId] });
      
      // Snapshot previous value
      const previousGoal = queryClient.getQueryData<Goal>(['goal', goalId]);
      
      // Optimistically update the goal
      if (previousGoal) {
        queryClient.setQueryData(['goal', goalId], {
          ...previousGoal,
          progress: {
            ...previousGoal.progress,
            lastActivityDate: new Date().toISOString(),
            // You could calculate optimistic progress here
          },
        });
      }
      
      return { previousGoal };
    },
    // Rollback on error
    onError: (_, __, context) => {
      if (context?.previousGoal) {
        queryClient.setQueryData(['goal', goalId], context.previousGoal);
      }
    },
  });
}

// Hook for getting goal progress
export function useGoalProgress(goalId: string, period?: 'current' | 'week' | 'month' | 'quarter' | 'year' | 'all') {
  return useQuery({
    queryKey: ['goal-progress', goalId, period],
    queryFn: () => getProgress(goalId, period),
    enabled: !!goalId,
  });
}

// Composite hook for goal management
export default function useGoalManagement() {
  const queryClient = useQueryClient();
  
  return {
    // Query hooks
    useGoals,
    useGoal,
    useGoalProgress,
    
    // Mutation hooks
    useCreateGoal,
    useUpdateGoal,
    useArchiveGoal,
    useLogActivity,
    
    // Utility functions
    invalidateGoals: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
    prefetchGoal: (goalId: string) => 
      queryClient.prefetchQuery({
        queryKey: ['goal', goalId],
        queryFn: () => getGoal(goalId),
      }),
  };
}
