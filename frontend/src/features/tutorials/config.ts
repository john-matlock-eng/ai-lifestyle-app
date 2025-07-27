/**
 * Tutorial Configuration
 * Defines all tutorial steps and their properties
 */

export interface TutorialStepConfig {
  id: string;
  name: string;
  description: string;
  companionThoughts: {
    intro: string;
    success?: string;
    skip?: string;
  };
  duration?: number; // Duration to show in milliseconds
  autoProgressAfter?: number; // Auto-progress after this many milliseconds
  requiresAction?: boolean; // Whether user must complete an action
  targetElement?: string; // CSS selector for element to highlight
  placement?: "above" | "below" | "left" | "right";
}

export const TUTORIAL_STEPS: Record<string, TutorialStepConfig> = {
  dashboard_intro: {
    id: "dashboard_intro",
    name: "Dashboard Introduction",
    description: "Learn about your personalized dashboard",
    companionThoughts: {
      intro: "Welcome to your dashboard! Let me show you around 🏠",
      success: "Great! You're getting the hang of it! 🎉",
      skip: "No problem! You can always find help in settings 👍",
    },
    duration: 5000,
  },
  
  encryption_setup: {
    id: "encryption_setup",
    name: "Encryption Setup",
    description: "Secure your data with encryption",
    companionThoughts: {
      intro: "Let's keep your data safe! Click to set up encryption 🔐",
      success: "Excellent! Your data is now secure 🛡️",
      skip: "You can set this up later in settings 🔒",
    },
    autoProgressAfter: 30000, // 30 seconds
    requiresAction: true,
    targetElement: ".encryption-setup-banner",
    placement: "below",
  },
  
  habit_creation: {
    id: "habit_creation",
    name: "Create Your First Habit",
    description: "Start building healthy habits",
    companionThoughts: {
      intro: "Ready to build some great habits? Click the 'New Habit' button! 💪",
      success: "Awesome! You're on your way to better habits! 🌟",
      skip: "That's okay! Come back when you're ready 😊",
    },
    requiresAction: true,
    targetElement: ".new-habit-button",
    placement: "left",
  },
  
  journal_intro: {
    id: "journal_intro",
    name: "Journal Introduction",
    description: "Learn about journaling features",
    companionThoughts: {
      intro: "The journal is a great place to track your thoughts and progress 📝",
      success: "Writing helps clarify thoughts! Keep it up! ✍️",
      skip: "No worries! Journaling is always here when you need it 📔",
    },
    duration: 4000,
  },
  
  goals_intro: {
    id: "goals_intro",
    name: "Goals Overview",
    description: "Set and track your goals",
    companionThoughts: {
      intro: "Goals help you stay focused! Let's explore this section 🎯",
      success: "Goal-setting is powerful! You're doing great! 🚀",
      skip: "Goals can wait - move at your own pace 🌱",
    },
    duration: 4000,
  },
  
  meals_intro: {
    id: "meals_intro",
    name: "Meal Tracking",
    description: "Track your nutrition",
    companionThoughts: {
      intro: "Tracking meals helps you understand your nutrition better 🍽️",
      success: "Nutrition awareness is key to health! Well done! 🥗",
      skip: "You can always start tracking meals later 🍎",
    },
    duration: 4000,
  },
  
  workouts_intro: {
    id: "workouts_intro",
    name: "Workout Tracking",
    description: "Log your exercise",
    companionThoughts: {
      intro: "Ready to track your fitness journey? Let's check out workouts! 🏃‍♀️",
      success: "Movement is medicine! Keep it up! 💪",
      skip: "No rush - exercise when you're ready 🧘",
    },
    duration: 4000,
  },
  
  profile_completion: {
    id: "profile_completion",
    name: "Complete Your Profile",
    description: "Add more details to personalize your experience",
    companionThoughts: {
      intro: "Let's personalize your experience! Update your profile 👤",
      success: "Perfect! Your app is now tailored just for you! ✨",
      skip: "You can update your profile anytime in settings ⚙️",
    },
    requiresAction: true,
    targetElement: ".profile-link",
    placement: "below",
  },
  
  settings_overview: {
    id: "settings_overview",
    name: "Settings & Preferences",
    description: "Customize your app experience",
    companionThoughts: {
      intro: "Want to customize things? Check out the settings! ⚙️",
      success: "You're all set! Enjoy your personalized experience! 🎨",
      skip: "Settings are always here when you need them 🔧",
    },
    duration: 3000,
  },
};

// Tutorial flow order - defines the sequence of tutorials
export const TUTORIAL_FLOW = [
  "encryption_setup",
  "dashboard_intro",
  "habit_creation",
  "journal_intro",
  "goals_intro",
  "meals_intro",
  "workouts_intro",
  "profile_completion",
  "settings_overview",
];

// Get next tutorial step based on completed/skipped steps
export function getNextTutorialStep(
  completedSteps: string[],
  skippedSteps: string[],
): string | null {
  const allDoneSteps = [...completedSteps, ...skippedSteps];
  
  for (const stepId of TUTORIAL_FLOW) {
    if (!allDoneSteps.includes(stepId)) {
      return stepId;
    }
  }
  
  return null;
}

// Check if a specific tutorial should be shown
export function shouldShowTutorial(
  stepId: string,
  tutorialPrefs?: {
    enabled: boolean;
    completedSteps: string[];
    skippedSteps: string[];
  },
): boolean {
  // Default to enabled if not specified
  if (tutorialPrefs?.enabled === false) return false;
  
  // If no preferences at all, show tutorial (new user)
  if (!tutorialPrefs) return true;
  
  const completedSteps = tutorialPrefs.completedSteps || [];
  const skippedSteps = tutorialPrefs.skippedSteps || [];
  
  const isDone = 
    completedSteps.includes(stepId) || 
    skippedSteps.includes(stepId);
    
  return !isDone;
}
