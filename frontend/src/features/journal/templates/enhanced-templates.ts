// enhanced-templates.ts
import { JournalTemplate } from "@/types/journal";
import type { EnhancedTemplate } from "../types/enhanced-template.types";

export const enhancedTemplates: Record<JournalTemplate, EnhancedTemplate> = {
  [JournalTemplate.DAILY_REFLECTION]: {
    id: JournalTemplate.DAILY_REFLECTION,
    name: "Daily Reflection",
    description: "Reflect on your day with gratitude and insights",
    icon: "✨",
    color: "#6366f1",
    sections: [
      {
        id: "emotions",
        title: "Today's Emotions",
        prompt: "How are you feeling?",
        type: "emotions",
        required: true,
        options: {
          maxSelections: 5,
          mode: "both",
        },
      },
      {
        id: "gratitude",
        title: "Three Things I'm Grateful For",
        prompt: "What brought joy to your day?",
        type: "text",
        required: true,
      },
      {
        id: "highlights",
        title: "Today's Highlights",
        prompt: "What went well today?",
        type: "text",
      },
      {
        id: "challenges",
        title: "Challenges & Lessons",
        prompt: "What obstacles did you face and what did you learn?",
        type: "text",
      },
      {
        id: "tomorrow",
        title: "Tomorrow's Focus",
        prompt: "What's your main priority for tomorrow?",
        type: "text",
      },
    ],
    extractors: {
      mood: (responses) => {
        const emotionsResponse = responses.emotions;
        if (
          emotionsResponse &&
          Array.isArray(emotionsResponse.value) &&
          emotionsResponse.value.length > 0
        ) {
          // Return the primary emotion (first selected)
          return emotionsResponse.value[0] as string;
        }
        return undefined;
      },
      tags: (responses) => {
        const tags = ["daily-reflection"];
        const emotionsResponse = responses.emotions;
        if (emotionsResponse && Array.isArray(emotionsResponse.value)) {
          (emotionsResponse.value as string[]).forEach((emotion) => {
            tags.push(`emotion-${emotion}`);
          });
        }
        return tags;
      },
    },
  },

  [JournalTemplate.GRATITUDE]: {
    id: JournalTemplate.GRATITUDE,
    name: "Gratitude Journal",
    description: "Focus on appreciation and positivity",
    icon: "🙏",
    color: "#10b981",
    sections: [
      {
        id: "gratitude-list",
        title: "Things I'm Grateful For",
        prompt: "List at least 5 things you appreciate today",
        type: "text",
        required: true,
      },
      {
        id: "gratitude-person",
        title: "Person I'm Grateful For",
        prompt: "Who made a positive impact on your life recently?",
        type: "text",
      },
      {
        id: "gratitude-moment",
        title: "Moment of Joy",
        prompt: "Describe a moment that brought you happiness",
        type: "text",
      },
      {
        id: "gratitude-scale",
        title: "Gratitude Level",
        prompt: "Rate your overall sense of gratitude today",
        type: "scale",
        options: {
          min: 1,
          max: 10,
        },
      },
    ],
    extractors: {
      tags: () => ["gratitude", "mindfulness"],
    },
  },

  [JournalTemplate.GOAL_PROGRESS]: {
    id: JournalTemplate.GOAL_PROGRESS,
    name: "Goal Progress Review",
    description: "Track and reflect on your goal progress",
    icon: "🎯",
    color: "#f59e0b",
    sections: [
      {
        id: "goals-worked",
        title: "Goals I Worked On",
        prompt: "Which goals did you make progress on?",
        type: "goals",
        required: true,
      },
      {
        id: "progress-description",
        title: "Progress Details",
        prompt: "Describe what you accomplished",
        type: "text",
        required: true,
      },
      {
        id: "obstacles",
        title: "Obstacles Encountered",
        prompt: "What challenges did you face?",
        type: "text",
      },
      {
        id: "next-steps",
        title: "Next Steps",
        prompt: "What will you do tomorrow to move forward?",
        type: "text",
      },
      {
        id: "progress-rating",
        title: "Progress Satisfaction",
        prompt: "How satisfied are you with today's progress?",
        type: "scale",
        options: {
          min: 1,
          max: 10,
        },
      },
    ],
    extractors: {
      tags: () => ["goals", "progress", "productivity"],
      goalProgress: (responses) => {
        const goalsWorked = responses["goals-worked"];
        if (!goalsWorked || !Array.isArray(goalsWorked.value)) return [];
        const progressRating = responses["progress-rating"];
        const progressDescription = responses["progress-description"];
        return (goalsWorked.value as string[]).map((goalId: string) => ({
          goalId,
          completed: false,
          progressValue:
            typeof progressRating?.value === "number"
              ? progressRating.value
              : 5,
          notes:
            typeof progressDescription?.value === "string"
              ? progressDescription.value
              : "",
        }));
      },
    },
  },

  [JournalTemplate.MOOD_TRACKER]: {
    id: JournalTemplate.MOOD_TRACKER,
    name: "Mood Tracker",
    description: "Track and understand your emotional patterns",
    icon: "🌈",
    color: "#8b5cf6",
    sections: [
      {
        id: "current-emotions",
        title: "Current Emotions",
        prompt: "How are you feeling right now?",
        type: "emotions",
        required: true,
        options: {
          maxSelections: 10,
          mode: "both",
        },
      },
      {
        id: "emotion-intensity",
        title: "Overall Intensity",
        prompt: "How intense are these feelings?",
        type: "scale",
        required: true,
        options: {
          min: 1,
          max: 10,
        },
      },
      {
        id: "emotion-triggers",
        title: "What Triggered These Emotions?",
        prompt: "Describe what led to this emotional state",
        type: "text",
      },
      {
        id: "emotion-physical",
        title: "Physical Sensations",
        prompt: "How do these emotions feel in your body?",
        type: "text",
      },
      {
        id: "emotion-tags",
        title: "Contributing Factors",
        prompt: "Tag related factors",
        type: "tags",
      },
    ],
    extractors: {
      mood: (responses) => {
        const emotionsResponse = responses["current-emotions"];
        if (
          emotionsResponse &&
          Array.isArray(emotionsResponse.value) &&
          emotionsResponse.value.length > 0
        ) {
          // Return the primary emotion (first selected)
          return emotionsResponse.value[0] as string;
        }
        return undefined;
      },
      tags: (responses) => {
        const tags = ["mood-tracker"];
        const emotionsResponse = responses["current-emotions"];
        if (emotionsResponse && Array.isArray(emotionsResponse.value)) {
          (emotionsResponse.value as string[]).forEach((emotion) => {
            tags.push(`emotion-${emotion}`);
          });
        }
        const emotionTags = responses["emotion-tags"];
        if (emotionTags && Array.isArray(emotionTags.value)) {
          tags.push(...(emotionTags.value as string[]));
        }
        return tags;
      },
    },
  },

  [JournalTemplate.HABIT_TRACKER]: {
    id: JournalTemplate.HABIT_TRACKER,
    name: "Habit Tracker",
    description: "Track your daily habits and routines",
    icon: "✅",
    color: "#06b6d4",
    sections: [
      {
        id: "morning-habits",
        title: "Morning Habits",
        prompt: "Check off completed morning habits",
        type: "checklist",
        options: {
          items: [
            { id: "wake-early", label: "Woke up early" },
            { id: "exercise", label: "Morning exercise" },
            { id: "meditation", label: "Meditation/mindfulness" },
            { id: "breakfast", label: "Healthy breakfast" },
            { id: "journal", label: "Morning pages" },
          ],
        },
      },
      {
        id: "daily-habits",
        title: "Daily Habits",
        prompt: "Track your main habits",
        type: "checklist",
        options: {
          items: [
            { id: "water", label: "Drank 8 glasses of water" },
            { id: "steps", label: "Hit step goal" },
            { id: "reading", label: "Read for 30 minutes" },
            { id: "no-social", label: "Limited social media" },
            { id: "gratitude", label: "Practiced gratitude" },
          ],
        },
      },
      {
        id: "habit-reflection",
        title: "Habit Reflection",
        prompt: "How did your habits impact your day?",
        type: "text",
      },
      {
        id: "tomorrow-focus",
        title: "Tomorrow's Habit Focus",
        prompt: "Which habit will you prioritize tomorrow?",
        type: "text",
      },
    ],
    extractors: {
      tags: () => ["habits", "routine", "productivity"],
    },
  },

  [JournalTemplate.CREATIVE_WRITING]: {
    id: JournalTemplate.CREATIVE_WRITING,
    name: "Creative Writing",
    description: "Express yourself through creative writing",
    icon: "✍️",
    color: "#ec4899",
    sections: [
      {
        id: "writing-prompt",
        title: "Today's Prompt",
        prompt: "Choose a prompt or create your own",
        type: "choice",
        options: {
          choices: [
            { value: "memory", label: "A childhood memory that shaped you" },
            { value: "letter", label: "A letter to your future self" },
            { value: "story", label: "A short fictional story" },
            { value: "poem", label: "A poem about today" },
            { value: "custom", label: "Free writing" },
          ],
        },
      },
      {
        id: "creative-content",
        title: "Your Creative Writing",
        prompt: "Let your creativity flow...",
        type: "text",
        required: true,
      },
      {
        id: "writing-emotions",
        title: "Writing Emotions",
        prompt: "How did writing make you feel?",
        type: "emotions",
        options: {
          maxSelections: 3,
          mode: "list",
        },
      },
      {
        id: "writing-tags",
        title: "Themes",
        prompt: "Tag the themes in your writing",
        type: "tags",
      },
    ],
    extractors: {
      mood: (responses) => {
        const emotionsResponse = responses["writing-emotions"];
        if (
          emotionsResponse &&
          Array.isArray(emotionsResponse.value) &&
          emotionsResponse.value.length > 0
        ) {
          // Return the primary emotion (first selected)
          return emotionsResponse.value[0] as string;
        }
        return undefined;
      },
      tags: (responses) => {
        const tags = ["creative-writing"];
        const writingTags = responses["writing-tags"];
        if (writingTags && Array.isArray(writingTags.value)) {
          tags.push(...(writingTags.value as string[]));
        }
        return tags;
      },
    },
  },

  [JournalTemplate.BLANK]: {
    id: JournalTemplate.BLANK,
    name: "Blank Journal",
    description: "Free-form journaling with no structure",
    icon: "📝",
    color: "#6b7280",
    sections: [
      {
        id: "content",
        title: "Your Thoughts",
        prompt: "Write whatever is on your mind...",
        type: "text",
        required: true,
      },
      {
        id: "emotions",
        title: "Current Emotions (Optional)",
        prompt: "How are you feeling?",
        type: "emotions",
        options: {
          mode: "list",
        },
      },
      {
        id: "tags",
        title: "Tags",
        prompt: "Add tags to organize this entry",
        type: "tags",
      },
    ],
    extractors: {
      mood: (responses) => {
        const emotionsResponse = responses.emotions;
        if (
          emotionsResponse &&
          Array.isArray(emotionsResponse.value) &&
          emotionsResponse.value.length > 0
        ) {
          // Return the primary emotion (first selected)
          return emotionsResponse.value[0] as string;
        }
        return undefined;
      },
      tags: (responses) => {
        const tags = ["free-writing"];
        const tagsResponse = responses.tags;
        if (tagsResponse && Array.isArray(tagsResponse.value)) {
          tags.push(...(tagsResponse.value as string[]));
        }
        const emotionsResponse = responses.emotions;
        if (emotionsResponse && Array.isArray(emotionsResponse.value)) {
          (emotionsResponse.value as string[]).forEach((emotion) => {
            tags.push(`emotion-${emotion}`);
          });
        }
        return tags;
      },
    },
  },
};
