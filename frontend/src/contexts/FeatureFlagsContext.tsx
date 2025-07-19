import React, { useEffect, useState } from "react";
import { getFeatureFlags, type FeatureFlags } from "../api/config";
import type { FeatureFlagsContextType } from "./FeatureFlagsContext.types";
import { FeatureFlagsContext } from "./FeatureFlagsContext.context";

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFlags = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching feature flags...");
      const featureFlags = await getFeatureFlags();
      console.log("Feature flags received:", featureFlags);
      setFlags(featureFlags);
    } catch (err) {
      console.error("Failed to fetch feature flags:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch feature flags"),
      );
      // Default to true for dev environments when endpoint fails
      const isDev =
        window.location.hostname === "localhost" ||
        window.location.hostname.includes("cloudfront.net") ||
        window.location.hostname.includes("dev");
      setFlags({
        debugPanels: isDev, // Default to true in dev environments
      });
      console.log("Using default feature flags, debugPanels:", isDev);
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
