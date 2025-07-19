import { useState, useCallback, useEffect } from 'react';
import type { AnimatedShihTzuProps } from '../components/common/AnimatedShihTzu';

interface UseShihTzuCompanionOptions {
  initialMood?: AnimatedShihTzuProps['mood'];
  initialPosition?: { x: number; y: number };
  idleTimeout?: number; // Time in ms before dog goes to idle/sleeping
}

interface UseShihTzuCompanionReturn {
  mood: AnimatedShihTzuProps['mood'];
  position: { x: number; y: number };
  setMood: (mood: AnimatedShihTzuProps['mood']) => void;
  setPosition: (position: { x: number; y: number }) => void;
  celebrate: () => void;
  showCuriosity: () => void;
  startJournaling: () => void;
  walk: () => void;
  moveToElement: (element: HTMLElement) => void;
  followPath: (path: { x: number; y: number }[]) => void;
}

export const useShihTzuCompanion = ({
  initialMood = 'idle',
  initialPosition = { x: 100, y: 100 },
  idleTimeout = 30000, // 30 seconds default
}: UseShihTzuCompanionOptions = {}): UseShihTzuCompanionReturn => {
  const [mood, setMood] = useState<AnimatedShihTzuProps['mood']>(initialMood);
  const [position, setPosition] = useState(initialPosition);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Auto-idle functionality
  useEffect(() => {
    const checkIdle = () => {
      const timeSinceInteraction = Date.now() - lastInteraction;
      if (timeSinceInteraction > idleTimeout && mood !== 'sleeping' && mood !== 'idle') {
        setMood('idle');
      }
      if (timeSinceInteraction > idleTimeout * 2 && mood === 'idle') {
        setMood('sleeping');
      }
    };

    const interval = setInterval(checkIdle, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [mood, lastInteraction, idleTimeout]);

  const updateMood = useCallback((newMood: AnimatedShihTzuProps['mood']) => {
    setMood(newMood);
    setLastInteraction(Date.now());
  }, []);

  const updatePosition = useCallback((newPosition: { x: number; y: number }) => {
    setPosition(newPosition);
    setLastInteraction(Date.now());
  }, []);

  // Preset animations
  const celebrate = useCallback(() => {
    updateMood('happy');
    // Reset to idle after celebration
    setTimeout(() => updateMood('idle'), 5000);
  }, [updateMood]);

  const showCuriosity = useCallback(() => {
    updateMood('curious');
    // Reset to idle after being curious
    setTimeout(() => updateMood('idle'), 4000);
  }, [updateMood]);

  const startJournaling = useCallback(() => {
    updateMood('sleeping');
    // Move to bottom right corner
    const x = window.innerWidth - 150;
    const y = window.innerHeight - 150;
    updatePosition({ x, y });
  }, [updateMood, updatePosition]);

  const walk = useCallback(() => {
    updateMood('walking');
    // Reset to idle after walking
    setTimeout(() => updateMood('idle'), 3000);
  }, [updateMood]);

  // Move to a specific element
  const moveToElement = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - 40; // Center the dog
    const y = rect.top + rect.height / 2 - 40;
    
    updateMood('walking');
    updatePosition({ x, y });
    
    // Stop walking when arrived
    setTimeout(() => updateMood('idle'), 1000);
  }, [updateMood, updatePosition]);

  // Follow a path of positions
  const followPath = useCallback((path: { x: number; y: number }[]) => {
    updateMood('walking');
    
    path.forEach((point, index) => {
      setTimeout(() => {
        updatePosition(point);
        
        // Stop walking at the end
        if (index === path.length - 1) {
          setTimeout(() => updateMood('idle'), 500);
        }
      }, index * 800); // Move every 800ms
    });
  }, [updateMood, updatePosition]);

  return {
    mood,
    position,
    setMood: updateMood,
    setPosition: updatePosition,
    celebrate,
    showCuriosity,
    startJournaling,
    walk,
    moveToElement,
    followPath,
  };
};
