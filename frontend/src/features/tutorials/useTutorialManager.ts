import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts";
import { authService } from "../auth/services/authService";
import type { TutorialPreferences } from "../auth/services/authService";
import { 
  TUTORIAL_STEPS, 
  getNextTutorialStep, 
  shouldShowTutorial,
  type TutorialStepConfig 
} from "./config";

interface TutorialState {
  currentStep: TutorialStepConfig | null;
  isActive: boolean;
  timeRemaining?: number;
}

export function useTutorialManager() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    currentStep: null,
    isActive: false,
  });
  const [autoProgressTimer, setAutoProgressTimer] = useState<NodeJS.Timeout | null>(null);

  // Get tutorial preferences from user profile
  const tutorialPrefs = user?.preferences?.tutorials || {
    enabled: true,
    completedSteps: [],
    skippedSteps: [],
  };

  // Mutation to update tutorial preferences
  const updateTutorialMutation = useMutation({
    mutationFn: async (updates: Partial<TutorialPreferences>) => {
      const newPrefs: TutorialPreferences = {
        ...tutorialPrefs,
        ...updates,
        lastShownAt: new Date().toISOString(),
      };

      const updatedProfile = await authService.updateProfile({
        preferences: {
          ...user?.preferences,
          tutorials: newPrefs,
        },
      });

      return updatedProfile;
    },
    onSuccess: (data) => {
      // Update local user state
      updateUser(data);
      // Invalidate user query
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  // Complete current tutorial step
  const completeTutorial = useCallback(
    async (stepId: string) => {
      if (autoProgressTimer) {
        clearTimeout(autoProgressTimer);
        setAutoProgressTimer(null);
      }

      await updateTutorialMutation.mutateAsync({
        completedSteps: [...tutorialPrefs.completedSteps, stepId],
        lastShownStep: stepId,
      });

      setTutorialState({ currentStep: null, isActive: false });
    },
    [tutorialPrefs.completedSteps, updateTutorialMutation, autoProgressTimer]
  );

  // Skip current tutorial step
  const skipTutorial = useCallback(
    async (stepId: string) => {
      if (autoProgressTimer) {
        clearTimeout(autoProgressTimer);
        setAutoProgressTimer(null);
      }

      await updateTutorialMutation.mutateAsync({
        skippedSteps: [...tutorialPrefs.skippedSteps, stepId],
        lastShownStep: stepId,
      });

      setTutorialState({ currentStep: null, isActive: false });
    },
    [tutorialPrefs.skippedSteps, updateTutorialMutation, autoProgressTimer]
  );

  // Disable tutorials completely
  const disableTutorials = useCallback(async () => {
    if (autoProgressTimer) {
      clearTimeout(autoProgressTimer);
      setAutoProgressTimer(null);
    }

    await updateTutorialMutation.mutateAsync({
      enabled: false,
    });

    setTutorialState({ currentStep: null, isActive: false });
  }, [updateTutorialMutation, autoProgressTimer]);

  // Enable tutorials
  const enableTutorials = useCallback(async () => {
    await updateTutorialMutation.mutateAsync({
      enabled: true,
    });
  }, [updateTutorialMutation]);

  // Start a specific tutorial step
  const startTutorial = useCallback(
    (stepId: string) => {
      const stepConfig = TUTORIAL_STEPS[stepId];
      if (!stepConfig || !shouldShowTutorial(stepId, tutorialPrefs)) {
        return;
      }

      setTutorialState({
        currentStep: stepConfig,
        isActive: true,
      });

      // Set up auto-progress timer if configured
      if (stepConfig.autoProgressAfter) {
        const timer = setTimeout(() => {
          skipTutorial(stepId);
        }, stepConfig.autoProgressAfter);
        setAutoProgressTimer(timer);
      }

      // Update last shown
      updateTutorialMutation.mutate({
        lastShownStep: stepId,
      });
    },
    [tutorialPrefs, skipTutorial, updateTutorialMutation]
  );

  // Start next tutorial in sequence
  const startNextTutorial = useCallback(() => {
    const nextStep = getNextTutorialStep(
      tutorialPrefs.completedSteps,
      tutorialPrefs.skippedSteps
    );

    if (nextStep) {
      startTutorial(nextStep);
    }
  }, [tutorialPrefs, startTutorial]);

  // Check for tutorials on specific pages
  const checkPageTutorials = useCallback(
    (pageId: string) => {
      // Map pages to tutorial steps
      const pageTutorialMap: Record<string, string[]> = {
        dashboard: ["encryption_setup", "dashboard_intro", "habit_creation"],
        journal: ["journal_intro"],
        goals: ["goals_intro"],
        meals: ["meals_intro"],
        workouts: ["workouts_intro"],
        profile: ["profile_completion"],
        settings: ["settings_overview"],
      };

      const tutorials = pageTutorialMap[pageId] || [];
      
      for (const tutorialId of tutorials) {
        if (shouldShowTutorial(tutorialId, tutorialPrefs)) {
          startTutorial(tutorialId);
          break;
        }
      }
    },
    [tutorialPrefs, startTutorial]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoProgressTimer) {
        clearTimeout(autoProgressTimer);
      }
    };
  }, [autoProgressTimer]);

  // Get progress statistics
  const getProgress = () => {
    const totalSteps = Object.keys(TUTORIAL_STEPS).length;
    const completedCount = tutorialPrefs.completedSteps.length;
    const skippedCount = tutorialPrefs.skippedSteps.length;
    const doneCount = completedCount + skippedCount;
    const progressPercentage = Math.round((doneCount / totalSteps) * 100);

    return {
      totalSteps,
      completedCount,
      skippedCount,
      doneCount,
      progressPercentage,
      isComplete: doneCount === totalSteps,
    };
  };

  // Reset all tutorial progress
  const resetTutorials = useCallback(async () => {
    await updateTutorialMutation.mutateAsync({
      completedSteps: [],
      skippedSteps: [],
      lastShownStep: undefined,
      enabled: true,
    });
  }, [updateTutorialMutation]);

  return {
    // State
    tutorialState,
    tutorialPrefs,
    isLoading: updateTutorialMutation.isPending,
    
    // Actions
    completeTutorial,
    skipTutorial,
    disableTutorials,
    enableTutorials,
    startTutorial,
    startNextTutorial,
    checkPageTutorials,
    resetTutorials,
    
    // Utils
    getProgress,
    shouldShowTutorial: (stepId: string) => shouldShowTutorial(stepId, tutorialPrefs),
  };
}
