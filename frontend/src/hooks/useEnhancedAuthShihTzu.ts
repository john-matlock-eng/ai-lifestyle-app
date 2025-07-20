// Enhanced version of useAuthShihTzu with improved positioning
import { useEffect, useCallback, useRef, useState } from 'react';
import { useShihTzuCompanion } from './useShihTzuCompanion';

type CompanionState = 'idle' | 'focused' | 'typing' | 'validating' | 'error' | 'success';
type EnhancedMood = 'idle' | 'happy' | 'sleeping' | 'curious' | 'walking' | 'excited' | 'playful' | 'zen' | 'proud' | 'concerned' | 'celebrating' | 'encouraging' | 'protective';

interface CompanionPersonality {
  traits: {
    happiness: number;
    energy: number;
    curiosity: number;
  };
  needs: {
    attention: number;
    rest: number;
    exercise: number;
  };
  bond: {
    level: number;
    interactions: number;
  };
}

interface ThoughtBubble {
  show: boolean;
  text: string;
}

export const useEnhancedAuthShihTzu = () => {
  // Calculate initial position based on viewport
  const getInitialPosition = () => {
    const isMobile = window.innerWidth < 640; // sm breakpoint
    const isTablet = window.innerWidth < 1024; // lg breakpoint
    
    if (isMobile) {
      // On mobile, position at top right, visible but not intrusive
      return { 
        x: window.innerWidth - 100, 
        y: 60 
      };
    } else if (isTablet) {
      // On tablet, position to the right of form area
      const formWidth = 448; // max-w-md = 28rem = 448px
      const formCenterX = window.innerWidth / 2;
      return {
        x: formCenterX + formWidth / 2 + 40,
        y: 120
      };
    } else {
      // On desktop, position to the right of form
      const formWidth = 448;
      const formCenterX = window.innerWidth / 2;
      return {
        x: Math.min(formCenterX + formWidth / 2 + 60, window.innerWidth - 120),
        y: 150
      };
    }
  };
  
  const companion = useShihTzuCompanion({
    initialPosition: getInitialPosition(),
    idleTimeout: 10000,
  });

  // Enhanced state
  const [companionState, setCompanionState] = useState<CompanionState>('idle');
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [personality, setPersonality] = useState<CompanionPersonality>({
    traits: { happiness: 75, energy: 60, curiosity: 70 },
    needs: { attention: 50, rest: 50, exercise: 50 },
    bond: { level: 1, interactions: 0 }
  });
  const [thoughtBubble, setThoughtBubble] = useState<ThoughtBubble>({ show: false, text: '' });
  const [particleEffect, setParticleEffect] = useState<'hearts' | 'sparkles' | 'treats' | 'zzz' | null>(null);
  const [accessories, setAccessories] = useState<string[]>([]);
  
  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const moodTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const thoughtTimerRef = useRef<NodeJS.Timeout | null>(null);
  const particleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPasswordStrength = useRef<'weak' | 'medium' | 'strong' | null>(null);
  const hasGreeted = useRef(false);

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      // Only reposition if companion is in default/idle position
      if (companionState === 'idle' && !currentField) {
        const newPosition = getInitialPosition();
        companion.setPosition(newPosition);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [companionState, currentField, companion]);

  // Show thought bubble
  const showThought = useCallback((text: string, duration = 3000) => {
    if (thoughtTimerRef.current) {
      clearTimeout(thoughtTimerRef.current);
    }
    
    setThoughtBubble({ show: true, text });
    
    thoughtTimerRef.current = setTimeout(() => {
      setThoughtBubble({ show: false, text: '' });
    }, duration);
  }, []);

  // Trigger particle effect
  const triggerParticleEffect = useCallback((effect: 'hearts' | 'sparkles' | 'treats' | 'zzz') => {
    if (particleTimerRef.current) {
      clearTimeout(particleTimerRef.current);
    }
    
    setParticleEffect(effect);
    
    particleTimerRef.current = setTimeout(() => {
      setParticleEffect(null);
    }, 3000);
  }, []);

  // Enhanced greet with better positioning
  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      const greetTimeout = setTimeout(() => {
        // Move to a position near where the first field will be
        const isMobile = window.innerWidth < 640;
        if (!isMobile) {
          // Find the approximate position of the first input field
          const firstInput = document.querySelector('input[type="email"], input[type="text"]');
          if (firstInput) {
            companion.moveToElement(firstInput as HTMLElement, 'right');
          }
        }
        
        companion.setMood('excited' as any);
        showThought("Welcome! Let's get you signed in! 🎉", 4000);
        triggerParticleEffect('sparkles');
        
        setTimeout(() => {
          companion.setMood('idle');
        }, 3000);
      }, 800);
      
      return () => clearTimeout(greetTimeout);
    }
  }, [companion, showThought, triggerParticleEffect]);

  // Update personality needs over time
  useEffect(() => {
    const interval = setInterval(() => {
      setPersonality(prev => ({
        ...prev,
        needs: {
          attention: Math.max(0, prev.needs.attention - 2),
          rest: Math.min(100, prev.needs.rest + (companion.mood === 'sleeping' ? 5 : -1)),
          exercise: Math.max(0, prev.needs.exercise - 1)
        }
      }));
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [companion.mood]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current);
      if (thoughtTimerRef.current) clearTimeout(thoughtTimerRef.current);
      if (particleTimerRef.current) clearTimeout(particleTimerRef.current);
    };
  }, []);

  // Enhanced input focus with closer positioning
  const handleInputFocus = useCallback((inputElement: HTMLInputElement | HTMLElement) => {
    const fieldName = inputElement.getAttribute('name') || inputElement.getAttribute('id') || 'field';
    setCurrentField(fieldName);
    setCompanionState('focused');
    
    // Use closer positioning based on screen size
    const isMobile = window.innerWidth < 640;
    const placement = isMobile ? 'above' : 'right';
    
    companion.moveToElement(inputElement, placement);
    
    // Field-specific thoughts
    if (fieldName === 'email') {
      showThought("Let's start with your email! 📧", 2000);
      companion.setMood('curious');
    } else if (fieldName === 'password') {
      showThought("Keep it secure! 🔒", 2000);
      companion.setMood('protective' as any);
    }
    
    // Update personality
    setPersonality(prev => ({
      ...prev,
      bond: { ...prev.bond, interactions: prev.bond.interactions + 1 }
    }));
  }, [companion, showThought]);

  // Enhanced typing with encouragement
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (companionState !== 'error' && companionState !== 'success') {
      setCompanionState('typing');
      
      // Random typing encouragements
      if (Math.random() < 0.1) { // 10% chance
        const encouragements = [
          "You're doing great! 💪",
          "Almost there! ⭐",
          "Looking good! 👍"
        ];
        showThought(encouragements[Math.floor(Math.random() * encouragements.length)], 1500);
      }
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (companionState === 'typing') {
        setCompanionState('idle');
        companion.setMood('idle');
      }
    }, 1500);
  }, [companion, companionState, showThought]);

  // Enhanced error with personality
  const handleError = useCallback(() => {
    setCompanionState('error');
    companion.setMood('concerned' as any);
    showThought("Oops! Let's fix that together 🤝", 3000);
    
    // Shake animation
    const currentPos = companion.position;
    const shakePositions = [
      { x: currentPos.x - 10, y: currentPos.y },
      { x: currentPos.x + 10, y: currentPos.y },
      { x: currentPos.x - 10, y: currentPos.y },
      { x: currentPos.x, y: currentPos.y },
    ];
    companion.followPath(shakePositions);
    
    // Update personality
    setPersonality(prev => ({
      ...prev,
      traits: { ...prev.traits, happiness: Math.max(0, prev.traits.happiness - 5) }
    }));
    
    moodTimeoutRef.current = setTimeout(() => {
      setCompanionState('idle');
      companion.setMood('idle');
    }, 3000);
  }, [companion, showThought]);

  // Enhanced success celebration with centered position
  const handleSuccess = useCallback(() => {
    setCompanionState('success');
    companion.setMood('celebrating' as any);
    setAccessories(['party-hat']);
    
    showThought("Welcome aboard! 🎊", 4000);
    triggerParticleEffect('sparkles');
    
    // Victory dance - move to center but account for mobile
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      companion.setPosition({
        x: window.innerWidth / 2 - 40,
        y: 200,
      });
    } else {
      companion.setPosition({
        x: window.innerWidth / 2 - 50,
        y: window.innerHeight / 2 - 50,
      });
    }
    
    // Update personality
    setPersonality(prev => ({
      ...prev,
      traits: { ...prev.traits, happiness: 100 },
      bond: { 
        ...prev.bond, 
        level: Math.min(10, prev.bond.level + 0.1),
        interactions: prev.bond.interactions + 5
      }
    }));
    
    // Celebration sequence
    setTimeout(() => {
      triggerParticleEffect('hearts');
    }, 1000);
    
    setTimeout(() => {
      setAccessories([]);
    }, 5000);
  }, [companion, showThought, triggerParticleEffect]);

  // Enhanced loading with movement
  const handleLoading = useCallback(() => {
    setCompanionState('validating');
    companion.setMood('walking');
    showThought("Checking your info... 🔍", 2000);
    
    // Pacing animation - smaller movements on mobile
    const isMobile = window.innerWidth < 640;
    const paceDistance = isMobile ? 20 : 30;
    const pacePositions = [
      { x: companion.position.x - paceDistance, y: companion.position.y },
      { x: companion.position.x + paceDistance, y: companion.position.y },
      { x: companion.position.x, y: companion.position.y }
    ];
    companion.followPath(pacePositions);
  }, [companion, showThought]);

  // Enhanced password strength feedback
  const handlePasswordStrength = useCallback((strength: 'weak' | 'medium' | 'strong') => {
    if (lastPasswordStrength.current !== strength && 
        companionState !== 'error' && 
        companionState !== 'success') {
      lastPasswordStrength.current = strength;
      
      switch (strength) {
        case 'weak':
          companion.setMood('concerned' as any);
          showThought("Let's make it stronger! 💪", 2000);
          break;
        case 'medium':
          companion.setMood('curious');
          showThought("Getting better! 🔐", 2000);
          triggerParticleEffect('sparkles');
          break;
        case 'strong':
          companion.setMood('proud' as any);
          showThought("Perfect password! 🛡️", 2000);
          triggerParticleEffect('hearts');
          // Update personality for achievement
          setPersonality(prev => ({
            ...prev,
            bond: { ...prev.bond, interactions: prev.bond.interactions + 2 }
          }));
          break;
      }
    }
  }, [companion, companionState, showThought, triggerParticleEffect]);

  // Enhanced field completion
  const handleFieldComplete = useCallback(() => {
    if (companionState !== 'error' && companionState !== 'success') {
      companion.setMood('happy');
      triggerParticleEffect('sparkles');
      
      // Quick celebration
      const celebratePositions = [
        { x: companion.position.x, y: companion.position.y - 10 },
        { x: companion.position.x, y: companion.position.y }
      ];
      companion.followPath(celebratePositions);
      
      // Personality update
      setPersonality(prev => ({
        ...prev,
        needs: { ...prev.needs, attention: Math.min(100, prev.needs.attention + 10) }
      }));
      
      moodTimeoutRef.current = setTimeout(() => {
        companion.setMood('idle');
      }, 1000);
    }
  }, [companion, companionState, triggerParticleEffect]);

  // Enhanced specific error handling
  const handleSpecificError = useCallback((errorType: 'network' | 'unauthorized' | 'rate-limit' | 'server') => {
    setCompanionState('error');
    
    switch (errorType) {
      case 'network':
        companion.setMood('sleeping');
        showThought("Can't reach the server... 😴", 4000);
        triggerParticleEffect('zzz');
        break;
      case 'unauthorized':
        companion.setMood('concerned' as any);
        showThought("Hmm, that doesn't match... 🤔", 3000);
        handleError();
        break;
      case 'rate-limit':
        companion.setMood('protective' as any);
        showThought("Let's take a breather... ⏱️", 5000);
        // Dizzy animation with smaller radius on mobile
        const isMobile = window.innerWidth < 640;
        const radius = isMobile ? 20 : 30;
        const center = companion.position;
        const circlePositions = Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * 2 * Math.PI;
          return {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
          };
        });
        companion.followPath(circlePositions);
        break;
      case 'server':
        companion.setMood('curious');
        showThought("Something's wrong on our end... 🔧", 4000);
        break;
    }
    
    moodTimeoutRef.current = setTimeout(() => {
      setCompanionState('idle');
      companion.setMood('idle');
    }, 5000);
  }, [companion, handleError, showThought, triggerParticleEffect]);

  const handleInputBlur = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (companionState === 'typing' || companionState === 'focused') {
      setCompanionState('idle');
      companion.setMood('idle');
      
      // Return to default position after a delay
      setTimeout(() => {
        if (!currentField) {
          const defaultPosition = getInitialPosition();
          companion.setPosition(defaultPosition);
        }
      }, 2000);
    }
    
    setCurrentField(null);
  }, [companion, companionState, currentField]);

  // Interactive features
  const pet = useCallback(() => {
    companion.setMood('happy');
    triggerParticleEffect('hearts');
    showThought("Aww, thanks! 🥰", 2000);
    
    // Update personality
    setPersonality(prev => ({
      ...prev,
      traits: { ...prev.traits, happiness: Math.min(100, prev.traits.happiness + 10) },
      needs: { ...prev.needs, attention: Math.min(100, prev.needs.attention + 20) },
      bond: { ...prev.bond, interactions: prev.bond.interactions + 1 }
    }));
  }, [companion, showThought, triggerParticleEffect]);

  const celebrate = useCallback(() => {
    companion.setMood('celebrating' as any);
    triggerParticleEffect('sparkles');
    showThought("Woohoo! 🎉", 2000);
    
    // Jump animation
    const jumpPositions = [
      { x: companion.position.x, y: companion.position.y - 30 },
      { x: companion.position.x, y: companion.position.y }
    ];
    companion.followPath(jumpPositions);
  }, [companion, showThought, triggerParticleEffect]);

  const encourage = useCallback(() => {
    companion.setMood('encouraging' as any);
    showThought("You can do this! 💪", 3000);
    triggerParticleEffect('sparkles');
  }, [companion, showThought, triggerParticleEffect]);

  // Override moveToElement for better positioning
  const moveToElement = useCallback((element: HTMLElement, placement?: 'above' | 'below' | 'left' | 'right') => {
    const rect = element.getBoundingClientRect();
    const companionSize = 80; // Size of the companion (md size)
    const isMobile = window.innerWidth < 640;
    const offset = isMobile ? 10 : 20; // Closer on mobile
    
    let x: number;
    let y: number;
    
    // Default placement based on screen size
    const defaultPlacement = placement || (isMobile ? 'above' : 'right');
    
    switch (defaultPlacement) {
      case 'above':
        x = rect.left + rect.width / 2 - companionSize / 2;
        y = rect.top - companionSize - offset;
        // Make sure it doesn't go off the top of the screen
        if (y < 10) {
          // Try below instead
          y = rect.bottom + offset;
        }
        break;
      case 'below':
        x = rect.left + rect.width / 2 - companionSize / 2;
        y = rect.bottom + offset;
        break;
      case 'left':
        x = rect.left - companionSize - offset;
        y = rect.top + rect.height / 2 - companionSize / 2;
        // Make sure it doesn't go off the left
        if (x < 10) {
          // Try right instead
          x = rect.right + offset;
        }
        break;
      case 'right':
        x = rect.right + offset;
        y = rect.top + rect.height / 2 - companionSize / 2;
        // Make sure it doesn't go off the right
        if (x > window.innerWidth - companionSize - 10) {
          // Try left instead
          x = rect.left - companionSize - offset;
        }
        break;
    }
    
    // Ensure the companion stays within viewport bounds
    x = Math.max(10, Math.min(x, window.innerWidth - companionSize - 10));
    y = Math.max(10, Math.min(y, window.innerHeight - companionSize - 10));
    
    companion.setPosition({ x, y });
    
    // Don't change mood if already in a special state
    if (companion.mood !== 'happy' && companion.mood !== 'curious') {
      companion.setMood('walking');
      setTimeout(() => {
        companion.setMood('idle');
      }, 1000);
    }
  }, [companion]);

  return {
    ...companion,
    moveToElement, // Override with our custom implementation
    handleInputFocus,
    handleInputBlur,
    handleTyping,
    handleError,
    handleSuccess,
    handleLoading,
    handlePasswordStrength,
    handleFieldComplete,
    handleSpecificError,
    companionState,
    currentField,
    // Enhanced features
    personality,
    thoughtBubble,
    particleEffect,
    accessories,
    showThought,
    triggerParticleEffect,
    pet,
    celebrate,
    encourage,
    mood: companion.mood as EnhancedMood
  };
};
