// src/hooks/useAuthShihTzu.ts
import { useEffect, useCallback } from 'react';
import { useShihTzuCompanion } from './useShihTzuCompanion';

export const useAuthShihTzu = () => {
  // Position the companion near the form (assuming form is centered and ~400px wide)
  const formWidth = 400;
  const formCenterX = window.innerWidth / 2;
  const initialX = Math.min(formCenterX + formWidth / 2 + 100, window.innerWidth - 150);
  
  const companion = useShihTzuCompanion({
    initialPosition: { x: initialX, y: 200 },
    idleTimeout: 10000, // Shorter timeout for auth pages
  });

  // Greet user on mount
  useEffect(() => {
    companion.showCuriosity();
    setTimeout(() => {
      companion.setMood('idle');
    }, 3000);
  }, []);

  // React to form input focus
  const handleInputFocus = useCallback((inputElement: HTMLInputElement | HTMLElement) => {
    companion.moveToElement(inputElement);
    companion.setMood('curious');
  }, [companion]);

  // React to typing
  const handleTyping = useCallback(() => {
    if (companion.mood !== 'curious') {
      companion.setMood('curious');
    }
  }, [companion.mood, companion]);

  // React to validation errors
  const handleError = useCallback(() => {
    companion.setMood('idle');
    // Shake animation by moving side to side
    const currentPos = companion.position;
    const shakePositions = [
      { x: currentPos.x - 10, y: currentPos.y },
      { x: currentPos.x + 10, y: currentPos.y },
      { x: currentPos.x - 10, y: currentPos.y },
      { x: currentPos.x, y: currentPos.y },
    ];
    companion.followPath(shakePositions);
  }, [companion]);

  // React to successful submission
  const handleSuccess = useCallback(() => {
    companion.celebrate();
    // Move to center for celebration
    companion.setPosition({
      x: window.innerWidth / 2 - 50,
      y: window.innerHeight / 2 - 50,
    });
  }, [companion]);

  // React to loading states
  const handleLoading = useCallback(() => {
    companion.setMood('walking');
  }, [companion]);

  // React to password strength
  const handlePasswordStrength = useCallback((strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak':
        companion.setMood('idle');
        break;
      case 'medium':
        companion.setMood('curious');
        break;
      case 'strong':
        companion.setMood('happy');
        setTimeout(() => companion.setMood('idle'), 2000);
        break;
    }
  }, [companion]);

  // React to field completion
  const handleFieldComplete = useCallback(() => {
    // Quick happy animation
    const currentMood = companion.mood;
    companion.setMood('happy');
    setTimeout(() => companion.setMood(currentMood), 1000);
  }, [companion]);

  // React to different error types
  const handleSpecificError = useCallback((errorType: 'network' | 'unauthorized' | 'rate-limit' | 'server') => {
    switch (errorType) {
      case 'network':
        companion.setMood('sleeping');
        break;
      case 'unauthorized':
        handleError();
        break;
      case 'rate-limit':
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
      case 'server':
        companion.showCuriosity();
        break;
    }
  }, [companion, handleError]);

  return {
    ...companion,
    handleInputFocus,
    handleTyping,
    handleError,
    handleSuccess,
    handleLoading,
    handlePasswordStrength,
    handleFieldComplete,
    handleSpecificError,
  };
};
