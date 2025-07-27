// Enhanced type definitions for the companion system

import type { AnimatedShihTzuProps } from "../components/common/AnimatedShihTzu";

// Extended mood types that include all animated moods
export type ExtendedMood =
  | AnimatedShihTzuProps["mood"]
  | "excited"
  | "playful"
  | "zen"
  | "proud"
  | "concerned"
  | "celebrating"
  | "encouraging"
  | "protective"
  | "mischievous";

// Particle effect types
export type ParticleEffect = "hearts" | "sparkles" | "treats" | "zzz";

// Companion variants
export type CompanionVariant =
  | "default"
  | "winter"
  | "party"
  | "workout"
  | "balloon";

// Enhanced companion props that extend the base animated props
export interface EnhancedShihTzuProps
  extends Omit<AnimatedShihTzuProps, "mood"> {
  mood?: ExtendedMood;
  onPet?: () => void;
  accessories?: string[];
  showThoughtBubble?: boolean;
  thoughtText?: string;
  particleEffect?: ParticleEffect | null;
  variant?: CompanionVariant;
  style?: React.CSSProperties;
}

// Thought bubble configuration
export interface ThoughtBubbleConfig {
  show: boolean;
  text: string;
  duration?: number;
  position?: "above" | "below" | "auto";
}

// Companion position with bounds checking
export interface CompanionPosition {
  x: number;
  y: number;
}

// Companion bounds for positioning constraints
export interface CompanionBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Enhanced companion state used by hooks
export interface EnhancedCompanionState {
  mood: ExtendedMood;
  position: CompanionPosition;
  thoughtBubble: ThoughtBubbleConfig;
  particleEffect: ParticleEffect | null;
  accessories: string[];
  isMoving: boolean;
  isPetting: boolean;
}

// Companion personality traits
export interface CompanionPersonalityTraits {
  happiness: number; // 0-100
  energy: number; // 0-100
  curiosity: number; // 0-100
}

// Companion needs
export interface CompanionNeeds {
  attention: number; // 0-100
  rest: number; // 0-100
  exercise: number; // 0-100
}

// Companion bond information
export interface CompanionBond {
  level: number; // 1-10
  interactions: number;
  lastInteraction: Date;
}

// Full personality system
export interface CompanionPersonality {
  traits: CompanionPersonalityTraits;
  needs: CompanionNeeds;
  bond: CompanionBond;
}

// Hook configuration options
export interface UseCompanionOptions {
  initialMood?: ExtendedMood;
  initialPosition?: CompanionPosition;
  idleTimeout?: number;
  enableAutoIdle?: boolean;
  enablePersonality?: boolean;
  enableParticles?: boolean;
  enableThoughts?: boolean;
}

// Companion interaction types
export type CompanionInteraction = "pet" | "feed" | "play" | "talk" | "train";

// Companion response to interactions
export interface CompanionResponse {
  mood: ExtendedMood;
  thought?: string;
  particleEffect?: ParticleEffect;
  duration?: number;
}

// Animation timing configuration
export interface AnimationTimings {
  moodTransition: number;
  thoughtDuration: number;
  particleDuration: number;
  movementSpeed: number;
}

// Companion achievement for gamification
export interface CompanionAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number; // 0-100 for progressive achievements
}

// Companion stats for debugging/display
export interface CompanionStats {
  totalInteractions: number;
  favoriteActivity: CompanionInteraction | null;
  moodHistory: ExtendedMood[];
  achievementsUnlocked: string[];
}

// Event handlers for companion interactions
export interface CompanionEventHandlers {
  onMoodChange?: (mood: ExtendedMood) => void;
  onPositionChange?: (position: CompanionPosition) => void;
  onInteraction?: (interaction: CompanionInteraction) => void;
  onAchievementUnlocked?: (achievement: CompanionAchievement) => void;
  onThoughtShown?: (thought: string) => void;
}

// Companion context for global state management
export interface CompanionContextValue {
  companion: EnhancedCompanionState;
  personality: CompanionPersonality;
  stats: CompanionStats;
  handlers: CompanionEventHandlers;
  interact: (interaction: CompanionInteraction) => void;
  showThought: (text: string, duration?: number) => void;
  triggerParticleEffect: (effect: ParticleEffect) => void;
  moveToElement: (
    element: HTMLElement,
    placement?: "above" | "below" | "left" | "right",
  ) => void;
}

// Feature flags for gradual feature rollout
export interface CompanionFeatureFlags {
  enablePersonality: boolean;
  enableParticles: boolean;
  enableThoughts: boolean;
  enableSound: boolean;
  enableAdvancedMoods: boolean;
  enableInteractions: boolean;
  enableAchievements: boolean;
  enableMultipleCompanions: boolean;
}

// Companion theme configuration
export interface CompanionTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  thoughtBubbleStyle: "rounded" | "speech" | "cloud";
  particleStyle: "emoji" | "svg" | "canvas";
}

// Export helper type guards
export const isExtendedMood = (
  mood: string | undefined,
): mood is ExtendedMood => {
  if (!mood) return false;
  const validMoods: ExtendedMood[] = [
    "idle",
    "happy",
    "sleeping",
    "curious",
    "walking",
    "excited",
    "playful",
    "zen",
    "proud",
    "concerned",
    "celebrating",
    "encouraging",
    "protective",
    "mischievous",
  ];
  return validMoods.includes(mood as ExtendedMood);
};

export const isParticleEffect = (effect: string): effect is ParticleEffect => {
  const validEffects: ParticleEffect[] = [
    "hearts",
    "sparkles",
    "treats",
    "zzz",
  ];
  return validEffects.includes(effect as ParticleEffect);
};

export const isCompanionVariant = (
  variant: string,
): variant is CompanionVariant => {
  const validVariants: CompanionVariant[] = [
    "default",
    "winter",
    "party",
    "workout",
    "balloon",
  ];
  return validVariants.includes(variant as CompanionVariant);
};
