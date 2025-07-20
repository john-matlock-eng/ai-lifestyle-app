// src/hooks/useAuthShihTzu.ts
import { useEffect, useCallback, useRef, useState } from 'react';
import { useShihTzuCompanion } from './useShihTzuCompanion';

type CompanionState = 'idle' | 'focused' | 'typing' | 'validating' | 'error' | 'success';

export const useAuthShihTzu = () => {
  // Position the companion near the form (assuming form is centered and ~400px wide)
  const formWidth = 400;
  const formCenterX = window.innerWidth / 2;
  const initialX = Math.min(formCenterX + formWidth / 2 + 100, window.innerWidth - 150);
  
  const companion = useShihTzuCompanion({
    initialPosition: { x: initialX, y: 200 },
    idleTimeout: 10000, // Shorter timeout for auth pages
  });

  // State management for companion behavior
  const [companionState, setCompanionState] = useState<CompanionState>('idle');
  const [currentField, setCurrentField] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const moodTimeoutRef = useRef<NodeJS.Timeout>();
  const lastPasswordStrength = useRef<'weak' | 'medium' | 'strong' | null>(null);
  const hasGreeted = useRef(false);

  // Greet user on mount - but only once
  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      // Use a timeout to avoid state updates during render
      const greetTimeout = setTimeout(() => {
        companion.showCuriosity();
        setTimeout(() => {
          companion.setMood('idle');
        }, 3000);
      }, 100);
      
      return () => clearTimeout(greetTimeout);
    }
  }, []); // Empty dependency array - only run once

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current);
    };
  }, []);

  // React to form input focus - position companion above the field
  const handleInputFocus = useCallback((inputElement: HTMLInputElement | HTMLElement) => {
    const fieldName = inputElement.getAttribute('name') || inputElement.getAttribute('id') || 'field';
    setCurrentField(fieldName);
    setCompanionState('focused');
    
    // Move to the focused element - positioned above it
    companion.moveToElement(inputElement, 'above');
    
    // Only change mood if not already in a special state
    if (companionState !== 'error' && companionState !== 'success') {
      companion.setMood('curious');
    }
  }, [companion, companionState]);

  // React to typing with debouncing
  const handleTyping = useCallback(() => {
    // Clear existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only change state if not in error or success
    if (companionState !== 'error' && companionState !== 'success') {
      setCompanionState('typing');
      
      // Keep curious mood while typing
      if (companion.mood !== 'curious') {
        companion.setMood('curious');
      }
    }

    // Set timeout to return to idle after typing stops
    typingTimeoutRef.current = setTimeout(() => {
      if (companionState === 'typing') {
        setCompanionState('idle');
        companion.setMood('idle');
      }
    }, 1500); // Wait 1.5 seconds after typing stops
  }, [companion, companionState]);

  // React to validation errors
  const handleError = useCallback(() => {
    setCompanionState('error');
    companion.setMood('idle');
    
    // Clear any pending timeouts
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current);
    
    // Shake animation
    const currentPos = companion.position;
    const shakePositions = [
      { x: currentPos.x - 10, y: currentPos.y },
      { x: currentPos.x + 10, y: currentPos.y },
      { x: currentPos.x - 10, y: currentPos.y },
      { x: currentPos.x, y: currentPos.y },
    ];
    companion.followPath(shakePositions);
    
    // Return to idle after error animation
    moodTimeoutRef.current = setTimeout(() => {
      setCompanionState('idle');
    }, 3000);
  }, [companion]);

  // React to successful submission
  const handleSuccess = useCallback(() => {
    setCompanionState('success');
    companion.celebrate();
    
    // Clear any pending timeouts
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current);
    
    // Move to center for celebration
    companion.setPosition({
      x: window.innerWidth / 2 - 50,
      y: window.innerHeight / 2 - 50,
    });
  }, [companion]);

  // React to loading states
  const handleLoading = useCallback(() => {
    setCompanionState('validating');
    companion.setMood('walking');
  }, [companion]);

  // React to password strength - only if strength actually changed
  const handlePasswordStrength = useCallback((strength: 'weak' | 'medium' | 'strong') => {
    // Only react if strength changed and not in error/success state
    if (lastPasswordStrength.current !== strength && 
        companionState !== 'error' && 
        companionState !== 'success') {
      lastPasswordStrength.current = strength;
      
      switch (strength) {
        case 'weak':
          companion.setMood('idle');
          break;
        case 'medium':
          companion.setMood('curious');
          break;
        case 'strong':
          companion.setMood('happy');
          // Return to typing state after showing happiness
          moodTimeoutRef.current = setTimeout(() => {
            if (companionState === 'typing') {
              companion.setMood('curious');
            } else {
              companion.setMood('idle');
            }
          }, 2000);
          break;
      }
    }
  }, [companion, companionState]);

  // React to field completion
  const handleFieldComplete = useCallback(() => {
    // Only react if not in error or success state
    if (companionState !== 'error' && companionState !== 'success') {
      // Quick happy animation
      const previousMood = companion.mood;
      companion.setMood('happy');
      
      moodTimeoutRef.current = setTimeout(() => {
        if (companionState !== 'error' && companionState !== 'success') {
          companion.setMood(previousMood === 'happy' ? 'idle' : previousMood);
        }
      }, 1000);
    }
  }, [companion, companionState]);

  // React to different error types
  const handleSpecificError = useCallback((errorType: 'network' | 'unauthorized' | 'rate-limit' | 'server') => {
    setCompanionState('error');
    
    switch (errorType) {
      case 'network':
        companion.setMood('sleeping');
        break;
      case 'unauthorized':
        handleError();
        break;
      case 'rate-limit': {
        // Dizzy animation - walking in circles
        companion.setMood('walking');
        const center = companion.position;
        const radius = 30;
        const circlePositions = Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * 2 * Math.PI;
          return {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
          };
        });
        companion.followPath(circlePositions);
        break;
      }
      case 'server':
        companion.showCuriosity();
        break;
    }
    
    // Return to idle after error display
    moodTimeoutRef.current = setTimeout(() => {
      setCompanionState('idle');
      companion.setMood('idle');
    }, 5000);
  }, [companion, handleError]);

  // Add blur handler to detect when user leaves a field
  const handleInputBlur = useCallback(() => {
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Return to idle if not in special state
    if (companionState === 'typing' || companionState === 'focused') {
      setCompanionState('idle');
      companion.setMood('idle');
    }
    
    setCurrentField(null);
  }, [companion, companionState]);

  return {
    ...companion,
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
  };
};