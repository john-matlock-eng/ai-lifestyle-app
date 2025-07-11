import { useState, useCallback, useRef, useEffect } from 'react';
import { AxiosError } from 'axios';

interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: AxiosError) => boolean;
}

interface UseNetworkErrorRecoveryResult<T> {
  execute: (fn: () => Promise<T>) => Promise<T>;
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  reset: () => void;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors and 5xx errors
    if (!error.response) return true; // Network error
    return error.response.status >= 500 && error.response.status < 600;
  },
};

export const useNetworkErrorRecovery = <T = unknown>(
  config: RetryConfig = {}
): UseNetworkErrorRecoveryResult<T> => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  const retryTimeoutRef = useRef<number | undefined>(undefined);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
    setLastError(null);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T> => {
      const mergedConfig = { ...DEFAULT_CONFIG, ...config };
      let currentRetry = 0;
      let lastError: Error | null = null;

      const attempt = async (): Promise<T> => {
        try {
          setIsRetrying(currentRetry > 0);
          const result = await fn();
          reset();
          return result;
        } catch (error) {
          lastError = error as Error;
          setLastError(lastError);
          setRetryCount(currentRetry + 1);

          // Check if we should retry
          const shouldRetry =
            currentRetry < mergedConfig.maxRetries &&
            (error instanceof AxiosError
              ? mergedConfig.retryCondition(error)
              : true);

          if (!shouldRetry) {
            reset();
            throw error;
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(
            mergedConfig.initialDelay * Math.pow(mergedConfig.backoffMultiplier, currentRetry),
            mergedConfig.maxDelay
          );

          currentRetry++;

          // Wait before retrying
          await new Promise((resolve) => {
            retryTimeoutRef.current = setTimeout(resolve, delay) as unknown as number;
          });

          return attempt();
        }
      };

      return attempt();
    },
    [config, reset]
  );

  return {
    execute,
    isRetrying,
    retryCount,
    lastError,
    reset,
  };
};

// Hook for handling offline/online state
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
};

// Hook for queuing failed requests
interface QueuedRequest<T = unknown> {
  id: string;
  request: () => Promise<T>;
  timestamp: number;
}

export const useRequestQueue = <T = unknown>() => {
  const queueRef = useRef<QueuedRequest<T>[]>([]);
  const { isOnline } = useNetworkStatus();

  const addToQueue = useCallback((request: () => Promise<T>) => {
    const id = Math.random().toString(36).substr(2, 9);
    queueRef.current.push({
      id,
      request,
      timestamp: Date.now(),
    });
    return id;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    queueRef.current = queueRef.current.filter((item) => item.id !== id);
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || queueRef.current.length === 0) return;

    const queue = [...queueRef.current];
    queueRef.current = [];

    const results = await Promise.allSettled(
      queue.map((item) => item.request())
    );

    // Re-queue failed requests
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        queueRef.current.push(queue[index]);
      }
    });
  }, [isOnline]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return {
    addToQueue,
    removeFromQueue,
    processQueue,
    queueLength: queueRef.current.length,
    isOnline,
  };
};
