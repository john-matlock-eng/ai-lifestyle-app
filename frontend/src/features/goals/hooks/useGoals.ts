import { useState, useCallback, useEffect } from 'react';
import { Goal, GoalActivity, GoalFormData, GoalStatus } from '../types/goal.types';
import { useEncryption } from '../../../hooks/useEncryption';

// Mock API functions - replace with actual API calls
const mockApi = {
  getGoals: async (): Promise<Goal[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock goals from localStorage or empty array
    const stored = localStorage.getItem('mockGoals');
    return stored ? JSON.parse(stored) : [];
  },
  
  createGoal: async (data: any): Promise<Goal> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newGoal: Goal = {
      goalId: `goal_${Date.now()}`,
      userId: 'user123',
      ...data,
      status: 'active',
      visibility: 'private',
      createdAt: new Date(),
      updatedAt: new Date(),
      context: {
        importanceLevel: 3,
        ...data.context,
      },
      rewards: {
        pointsPerActivity: 10,
        milestoneRewards: [],
        badges: [],
      },
      progress: {
        percentComplete: 0,
        trend: 'stable',
        successRate: 0,
      },
    };
    
    // Save to localStorage
    const goals = await mockApi.getGoals();
    goals.push(newGoal);
    localStorage.setItem('mockGoals', JSON.stringify(goals));
    
    return newGoal;
  },
  
  updateGoal: async (goalId: string, updates: Partial<Goal>): Promise<Goal> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const goals = await mockApi.getGoals();
    const index = goals.findIndex(g => g.goalId === goalId);
    
    if (index === -1) throw new Error('Goal not found');
    
    goals[index] = {
      ...goals[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    localStorage.setItem('mockGoals', JSON.stringify(goals));
    return goals[index];
  },
  
  deleteGoal: async (goalId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const goals = await mockApi.getGoals();
    const filtered = goals.filter(g => g.goalId !== goalId);
    localStorage.setItem('mockGoals', JSON.stringify(filtered));
  },
  
  logActivity: async (activity: Partial<GoalActivity>): Promise<GoalActivity> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newActivity: GoalActivity = {
      activityId: `activity_${Date.now()}`,
      userId: 'user123',
      activityDate: new Date(),
      loggedAt: new Date(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      activityType: 'progress',
      value: 1,
      unit: 'times',
      source: 'manual',
      context: {
        timeOfDay: 'morning',
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        isWeekend: [0, 6].includes(new Date().getDay()),
        isHoliday: false,
        withOthers: false,
      },
      ...activity,
    } as GoalActivity;
    
    // Update goal progress
    if (activity.goalId) {
      const goals = await mockApi.getGoals();
      const goal = goals.find(g => g.goalId === activity.goalId);
      
      if (goal) {
        // Simple progress update - in real app this would be more sophisticated
        const progress = { ...goal.progress };
        
        if (goal.goalPattern === 'recurring') {
          progress.currentPeriodValue = (progress.currentPeriodValue || 0) + newActivity.value;
          progress.percentComplete = (progress.currentPeriodValue / goal.target.value) * 100;
        } else if (goal.goalPattern === 'milestone') {
          progress.totalAccumulated = (progress.totalAccumulated || 0) + newActivity.value;
          progress.remainingToGoal = goal.target.value - progress.totalAccumulated;
          progress.percentComplete = (progress.totalAccumulated / goal.target.value) * 100;
        } else if (goal.goalPattern === 'streak') {
          progress.currentStreak = (progress.currentStreak || 0) + 1;
          progress.longestStreak = Math.max(progress.currentStreak, progress.longestStreak || 0);
          progress.percentComplete = (progress.currentStreak / (progress.targetStreak || 100)) * 100;
        }
        
        progress.lastActivityDate = new Date();
        await mockApi.updateGoal(goal.goalId, { progress });
      }
    }
    
    return newActivity;
  },
};

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { encrypt, decrypt } = useEncryption('goals');

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await mockApi.getGoals();
      
      // Decrypt any encrypted metadata
      const decryptedGoals = await Promise.all(
        data.map(async (goal) => {
          if (goal.metadata?.encryptedNotes) {
            try {
              const decrypted = await decrypt(goal.metadata.encryptedNotes);
              return {
                ...goal,
                metadata: {
                  ...goal.metadata,
                  privateNotes: decrypted.notes,
                },
              };
            } catch (err) {
              console.error('Failed to decrypt goal notes:', err);
              return goal;
            }
          }
          return goal;
        })
      );
      
      setGoals(decryptedGoals);
    } catch (err) {
      setError('Failed to fetch goals');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [decrypt]);

  // Create goal
  const createGoal = useCallback(async (goalData: GoalFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newGoal = await mockApi.createGoal(goalData);
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (err) {
      setError('Failed to create goal');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update goal
  const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updated = await mockApi.updateGoal(goalId, updates);
      setGoals(prev => prev.map(g => g.goalId === goalId ? updated : g));
      return updated;
    } catch (err) {
      setError('Failed to update goal');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update goal status
  const updateGoalStatus = useCallback(async (goalId: string, status: GoalStatus) => {
    return updateGoal(goalId, { status });
  }, [updateGoal]);

  // Delete goal
  const deleteGoal = useCallback(async (goalId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await mockApi.deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.goalId !== goalId));
    } catch (err) {
      setError('Failed to delete goal');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Log activity
  const logActivity = useCallback(async (activity: Partial<GoalActivity>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newActivity = await mockApi.logActivity(activity);
      
      // Refresh goals to get updated progress
      await fetchGoals();
      
      return newActivity;
    } catch (err) {
      setError('Failed to log activity');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchGoals]);

  // Get goals by pattern
  const getGoalsByPattern = useCallback((pattern: string) => {
    return goals.filter(g => g.goalPattern === pattern);
  }, [goals]);

  // Get active goals
  const getActiveGoals = useCallback(() => {
    return goals.filter(g => g.status === 'active');
  }, [goals]);

  // Get goals needing attention (overdue, at risk, etc.)
  const getGoalsNeedingAttention = useCallback(() => {
    return goals.filter(g => {
      if (g.status !== 'active') return false;
      
      // Check if overdue
      if (g.target.targetDate && new Date(g.target.targetDate) < new Date()) {
        return true;
      }
      
      // Check if streak at risk
      if (g.goalPattern === 'streak' && g.progress.lastActivityDate) {
        const daysSinceActivity = Math.floor(
          (new Date().getTime() - new Date(g.progress.lastActivityDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        if (daysSinceActivity > 0) return true;
      }
      
      // Check if falling behind on recurring goals
      if (g.goalPattern === 'recurring' && g.progress.successRate < 50) {
        return true;
      }
      
      return false;
    });
  }, [goals]);

  // Load goals on mount
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    // State
    goals,
    isLoading,
    error,
    
    // Actions
    createGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal,
    logActivity,
    fetchGoals,
    
    // Computed
    getGoalsByPattern,
    getActiveGoals,
    getGoalsNeedingAttention,
  };
};
