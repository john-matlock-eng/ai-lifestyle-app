// Starter implementation for enhanced companion with backward compatibility
// src/hooks/useEnhancedCompanion.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { useShihTzuCompanion } from './useShihTzuCompanion';
import type { 
  CompanionMood, 
  CompanionPersonality, 
  ThoughtBubble, 
  ParticleEffect,
  CompanionFeatureFlags 
} from '../types/companion';

interface UseEnhancedCompanionOptions {
  // Feature flags for gradual rollout
  features?: Partial<CompanionFeatureFlags>;
  // Existing options from base hook
  initialMood?: CompanionMood;
  initialPosition?: { x: number; y: number };
}

export const useEnhancedCompanion = (options: UseEnhancedCompanionOptions = {}) => {
  // Default feature flags - start with most features disabled
  const features: CompanionFeatureFlags = {
    enablePersonality: false,
    enableParticles: false,
    enableThoughts: false,
    enableSound: false,
    enableAdvancedMoods: false,
    enableInteractions: false,
    ...options.features
  };

  // Use existing companion hook as foundation
  const baseCompanion = useShihTzuCompanion({
    initialMood: options.initialMood,
    initialPosition: options.initialPosition
  });

  // Enhanced state (only if features enabled)
  const [personality, setPersonality] = useState<CompanionPersonality | undefined>(
    features.enablePersonality ? {
      traits: { happiness: 75, energy: 60 },
      needs: { attention: 50, rest: 50 },
      bond: { level: 1, interactions: 0 }
    } : undefined
  );

  const [thoughtBubble, setThoughtBubble] = useState<ThoughtBubble>({
    show: false,
    text: ''
  });

  const [particleEffect, setParticleEffect] = useState<ParticleEffect | null>(null);
  const [accessories] = useState<string[]>([]);

  // Refs for managing timers
  const thoughtTimerRef = useRef<NodeJS.Timeout | null>(null);
  const particleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced celebrate that works with existing code
  const celebrate = useCallback(() => {
    // Call base celebrate
    baseCompanion.celebrate();
    
    // Add enhanced features if enabled
    if (features.enableParticles) {
      triggerParticleEffect('sparkles');
    }
    
    if (features.enableThoughts) {
      showThought('Yay! 🎉', 3000);
    }

    if (features.enableSound) {
      // Play sound (implement later)
      console.log('Playing celebration sound');
    }
  }, [baseCompanion, features]);

  // Show thought bubble
  const showThought = useCallback((text: string, duration = 3000) => {
    if (!features.enableThoughts) return;
    
    if (thoughtTimerRef.current) {
      clearTimeout(thoughtTimerRef.current);
    }
    
    setThoughtBubble({ show: true, text });
    
    thoughtTimerRef.current = setTimeout(() => {
      setThoughtBubble({ show: false, text: '' });
    }, duration);
  }, [features.enableThoughts]);

  // Trigger particle effect
  const triggerParticleEffect = useCallback((effect: ParticleEffect) => {
    if (!features.enableParticles) return;
    
    if (particleTimerRef.current) {
      clearTimeout(particleTimerRef.current);
    }
    
    setParticleEffect(effect);
    
    particleTimerRef.current = setTimeout(() => {
      setParticleEffect(null);
    }, 3000);
  }, [features.enableParticles]);

  // Enhanced greet user
  const greetUser = useCallback((userName?: string) => {
    const hour = new Date().getHours();
    let greeting = '';
    let mood: CompanionMood = 'happy';
    
    if (hour < 12) {
      greeting = `Good morning${userName ? `, ${userName}` : ''}! 🌅`;
      mood = features.enableAdvancedMoods ? 'excited' : 'happy';
    } else if (hour < 17) {
      greeting = `Good afternoon${userName ? `, ${userName}` : ''}! ☀️`;
      mood = 'happy';
    } else {
      greeting = `Good evening${userName ? `, ${userName}` : ''}! 🌙`;
      mood = features.enableAdvancedMoods ? 'zen' : 'idle';
    }
    
    baseCompanion.setMood(mood as Parameters<typeof baseCompanion.setMood>[0]);
    
    if (features.enableThoughts) {
      showThought(greeting, 3000);
    }
    
    if (features.enableParticles) {
      triggerParticleEffect('sparkles');
    }
  }, [baseCompanion, features, showThought, triggerParticleEffect]);

  // Pet interaction (new feature)
  const pet = useCallback(() => {
    if (!features.enableInteractions) {
      // Fallback to simple mood change
      baseCompanion.setMood('happy');
      return;
    }
    
    baseCompanion.setMood('happy');
    
    if (features.enableParticles) {
      triggerParticleEffect('hearts');
    }
    
    if (features.enableThoughts) {
      showThought('I love pets! 🥰', 2000);
    }
    
    if (features.enablePersonality && personality) {
      setPersonality(prev => prev ? {
        ...prev,
        needs: {
          ...prev.needs,
          attention: Math.min(100, prev.needs.attention + 20)
        },
        bond: {
          ...prev.bond,
          interactions: prev.bond.interactions + 1
        }
      } : prev);
    }
  }, [baseCompanion, features, personality, showThought, triggerParticleEffect]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (thoughtTimerRef.current) clearTimeout(thoughtTimerRef.current);
      if (particleTimerRef.current) clearTimeout(particleTimerRef.current);
    };
  }, []);

  // Return enhanced companion API that's backward compatible
  return {
    // All existing methods from base companion
    ...baseCompanion,
    
    // Override with enhanced versions
    celebrate,
    
    // New enhanced features
    greetUser,
    pet,
    showThought,
    triggerParticleEffect,
    
    // Enhanced state
    personality,
    thoughtBubble,
    particleEffect,
    accessories,
    
    // Feature flags for conditional rendering
    features
  };
};