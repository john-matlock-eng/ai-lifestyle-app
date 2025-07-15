import React, { useEffect, useState } from 'react';
import { getFeatureFlags, type FeatureFlags } from '../api/config';
import type { FeatureFlagsContextType } from './FeatureFlagsContext.types';
import { FeatureFlagsContext } from './FeatureFlagsContext.context';

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFlags = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const featureFlags = await getFeatureFlags();
      setFlags(featureFlags);
    } catch (err) {
      console.error('Failed to fetch feature flags:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch feature flags'));
      // Set default values on error
      setFlags({
        debugPanels: false, // Default to false in case of error
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const contextValue: FeatureFlagsContextType = {
    flags,
    isLoading,
    error,
    refetch: fetchFlags,
  };

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};