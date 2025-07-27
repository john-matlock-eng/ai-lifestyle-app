// Initial companion types for migration
// This file provides the foundation for the enhanced companion system

// Keep existing type for backward compatibility
export type { AnimatedShihTzuProps } from "../components/common/AnimatedShihTzu";

// Enhanced mood system - start with existing moods and add new ones gradually
export type CompanionMood =
  // Existing moods (keep these working)
  | "idle"
  | "happy"
  | "sleeping"
  | "curious"
  | "walking"
  // New moods to implement
  | "excited" // Super happy state
  | "playful" // Wants to play
  | "zen" // Calm/meditative
  | "encouraging" // Cheering user on
  | "protective" // When user needs support
  | "proud" // After achievements
  | "mischievous"; // Playful trouble

// Simplified personality to start - expand as needed
export interface CompanionPersonality {
  // Start with basic traits
  traits: {
    happiness: number; // 0-100
    energy: number; // 0-100
  };

  // Simple needs system
  needs: {
    attention: number; // 0-100
    rest: number; // 0-100
  };

  // Basic bond tracking
  bond: {
    level: number; // 1-10
    interactions: number;
  };
}

// Particle effects for visual enhancement
export type ParticleEffect = "hearts" | "sparkles" | "treats" | "zzz";

// Thought bubble for communication
export interface ThoughtBubble {
  show: boolean;
  text: string;
}

// Integration points - add these gradually
export interface CompanionIntegration {
  dashboard?: {
    enableGreeting: boolean;
    enableWeatherReaction: boolean;
  };
  goals?: {
    enableCelebrations: boolean;
    celebrationLevel: "basic" | "enhanced";
  };
  journal?: {
    enableZenMode: boolean;
    enableSentimentReaction: boolean;
  };
}

// Feature flags for gradual rollout
export interface CompanionFeatureFlags {
  enablePersonality: boolean;
  enableParticles: boolean;
  enableThoughts: boolean;
  enableSound: boolean;
  enableAdvancedMoods: boolean;
  enableInteractions: boolean;
}

// Companion state for the enhanced hook
export interface CompanionState {
  mood: CompanionMood;
  position: { x: number; y: number };
  accessories: string[];
  thoughtBubble: ThoughtBubble;
  particleEffect: ParticleEffect | null;
  personality?: CompanionPersonality; // Optional during migration
}

// Interaction types for user engagement
export type CompanionInteraction = "pet" | "feed" | "play";

// Achievement system foundation
export interface CompanionAchievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: Date;
  icon: string;
}
