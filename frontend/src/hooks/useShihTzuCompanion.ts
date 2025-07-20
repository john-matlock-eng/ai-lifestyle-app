import { useState, useCallback, useEffect, useRef } from 'react';
import type { AnimatedShihTzuProps } from '../components/common/AnimatedShihTzu';

interface UseShihTzuCompanionOptions {
  initialMood?: AnimatedShihTzuProps['mood'];
  initialPosition?: { x: number; y: number };
  idleTimeout?: number; // Time in ms before dog goes to idle/sleeping
  enableAutoIdle?: boolean; // Whether to enable auto-idle behavior
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
  moveToElement: (element: HTMLElement, placement?: 'above' | 'below' | 'left' | 'right') => void;
  followPath: (path: { x: number; y: number }[]) => void;
}

export const useShihTzuCompanion = ({
  initialMood = 'idle',
  initialPosition = { x: 100, y: 100 },
  idleTimeout = 30000, // 30 seconds default
  enableAutoIdle = true,
}: UseShihTzuCompanionOptions = {}): UseShihTzuCompanionReturn => {
  const [mood, setMoodState] = useState<AnimatedShihTzuProps['mood']>(initialMood);
  const [position, setPositionState] = useState(initialPosition);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const idleCheckIntervalRef = useRef<NodeJS.Timeout>();
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-idle functionality
  useEffect(() => {
    if (!enableAutoIdle) return;

    const checkIdle = () => {
      const timeSinceInteraction = Date.now() - lastInteraction;
      
      // Only change to idle/sleeping if not in a special animation state
      if (mood === 'happy' || mood === 'walking') {
        return; // Don't interrupt these animations
      }
      
      if (timeSinceInteraction > idleTimeout && mood !== 'sleeping' && mood !== 'idle') {
        setMoodState('idle');
      }
      if (timeSinceInteraction > idleTimeout * 2 && mood === 'idle') {
        setMoodState('sleeping');
      }
    };

    idleCheckIntervalRef.current = setInterval(checkIdle, 5000); // Check every 5 seconds
    
    return () => {
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current);
      }
    };
  }, [mood, lastInteraction, idleTimeout, enableAutoIdle]);

  // Cleanup animation timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current);
      }
    };
  }, []);

  const setMood = useCallback((newMood: AnimatedShihTzuProps['mood']) => {
    setMoodState(newMood);
    setLastInteraction(Date.now());
  }, []);

  const setPosition = useCallback((newPosition: { x: number; y: number }) => {
    setPositionState(newPosition);
    setLastInteraction(Date.now());
  }, []);

  // Preset animations
  const celebrate = useCallback(() => {
    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    setMood('happy');
    // Don't auto-reset from celebration - let the calling code decide when to stop
  }, [setMood]);

  const showCuriosity = useCallback(() => {
    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    setMood('curious');
    // Reset to idle after being curious
    animationTimeoutRef.current = setTimeout(() => {
      setMood('idle');
    }, 4000);
  }, [setMood]);

  const startJournaling = useCallback(() => {
    setMood('sleeping');
    // Move to bottom right corner
    const x = window.innerWidth - 150;
    const y = window.innerHeight - 150;
    setPosition({ x, y });
  }, [setMood, setPosition]);

  const walk = useCallback(() => {
    setMood('walking');
    // Reset to idle after walking
    animationTimeoutRef.current = setTimeout(() => {
      setMood('idle');
    }, 3000);
  }, [setMood]);

  // Move to a specific element with placement options
  const moveToElement = useCallback((element: HTMLElement, placement: 'above' | 'below' | 'left' | 'right' = 'above') => {
    const rect = element.getBoundingClientRect();
    const companionSize = 80; // Size of the companion (md size)
    const offset = 20; // Space between companion and element
    
    let x: number;
    let y: number;
    
    switch (placement) {
      case 'above':
        x = rect.left + rect.width / 2 - companionSize / 2;
        y = rect.top - companionSize - offset;
        // Make sure it doesn't go off the top of the screen
        if (y < 10) {
          y = rect.bottom + offset; // Switch to below if no room above
        }
        break;
      case 'below':
        x = rect.left + rect.width / 2 - companionSize / 2;
        y = rect.bottom + offset;
        break;
      case 'left':
        x = rect.left - companionSize - offset;
        y = rect.top + rect.height / 2 - companionSize / 2;
        break;
      case 'right':
        x = rect.right + offset;
        y = rect.top + rect.height / 2 - companionSize / 2;
        break;
    }
    
    // Ensure the companion stays within viewport bounds
    x = Math.max(10, Math.min(x, window.innerWidth - companionSize - 10));
    y = Math.max(10, Math.min(y, window.innerHeight - companionSize - 10));
    
    // Don't change mood if already in a special state
    if (mood !== 'happy' && mood !== 'curious') {
      setMood('walking');
    }
    
    setPosition({ x, y });
    
    // Stop walking when arrived
    if (mood === 'walking') {
      animationTimeoutRef.current = setTimeout(() => {
        setMood('idle');
      }, 1000);
    }
  }, [setMood, setPosition, mood]);

  // Follow a path of positions
  const followPath = useCallback((path: { x: number; y: number }[]) => {
    // Don't change mood if in a special state
    if (mood !== 'happy' && mood !== 'curious') {
      setMood('walking');
    }
    
    let pathTimeouts: NodeJS.Timeout[] = [];
    
    path.forEach((point, index) => {
      const timeout = setTimeout(() => {
        setPosition(point);
        
        // Stop walking at the end
        if (index === path.length - 1 && mood === 'walking') {
          animationTimeoutRef.current = setTimeout(() => {
            setMood('idle');
          }, 500);
        }
      }, index * 800); // Move every 800ms
      
      pathTimeouts.push(timeout);
    });
    
    // Store timeouts for cleanup if needed
    return () => {
      pathTimeouts.forEach(clearTimeout);
    };
  }, [setMood, setPosition, mood]);

  return {
    mood,
    position,
    setMood,
    setPosition,
    celebrate,
    showCuriosity,
    startJournaling,
    walk,
    moveToElement,
    followPath,
  };
};