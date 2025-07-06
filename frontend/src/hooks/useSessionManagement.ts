import { useEffect } from 'react';
import { useAuth } from '../contexts';

interface UseSessionManagementOptions {
  warnBeforeExpiry?: number; // milliseconds before expiry to show warning
  onSessionExpired?: () => void;
  onSessionWarning?: () => void;
}

export const useSessionManagement = (options: UseSessionManagementOptions = {}) => {
  const {
    isAuthenticated,
    sessionExpiry,
    isSessionWarningActive,
    refreshSession,
    logout,
  } = useAuth();

  const {
    warnBeforeExpiry = 5 * 60 * 1000, // 5 minutes default
    onSessionExpired,
    onSessionWarning,
  } = options;

  useEffect(() => {
    if (!isAuthenticated || !sessionExpiry) return;

    const checkSession = () => {
      const now = new Date();
      const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();

      if (timeUntilExpiry <= 0) {
        // Session expired
        if (onSessionExpired) {
          onSessionExpired();
        }
      } else if (timeUntilExpiry <= warnBeforeExpiry && !isSessionWarningActive) {
        // Warning threshold reached
        if (onSessionWarning) {
          onSessionWarning();
        }
      }
    };

    const interval = setInterval(checkSession, 10000); // Check every 10 seconds
    checkSession(); // Check immediately

    return () => clearInterval(interval);
  }, [
    isAuthenticated,
    sessionExpiry,
    isSessionWarningActive,
    warnBeforeExpiry,
    onSessionExpired,
    onSessionWarning,
  ]);

  return {
    sessionExpiry,
    isSessionWarningActive,
    refreshSession,
    logout,
  };
};

// Hook for detecting idle timeout
export const useIdleTimeout = (
  timeoutMs: number = 30 * 60 * 1000, // 30 minutes default
  onTimeout: () => void
) => {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    };

    const handleActivity = () => {
      resetTimeout();
    };

    // Events that reset the idle timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Start the timer
    resetTimeout();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [timeoutMs, onTimeout]);
};

// Hook to format session time remaining
export const useSessionTimeRemaining = () => {
  const { sessionExpiry } = useAuth();

  if (!sessionExpiry) {
    return null;
  }

  const now = new Date();
  const remaining = sessionExpiry.getTime() - now.getTime();

  if (remaining <= 0) {
    return {
      expired: true,
      formatted: 'Session expired',
      minutes: 0,
      seconds: 0,
    };
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return {
    expired: false,
    formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    minutes,
    seconds,
  };
};
