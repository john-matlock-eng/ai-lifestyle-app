import { useContext } from "react";
import { FeatureFlagsContext } from "../contexts/FeatureFlagsContext.context";
import type { FeatureFlags } from "../contexts/FeatureFlagsContext.types";

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagsProvider",
    );
  }
  return context;
};

// Helper hook to check a specific feature flag
export const useFeatureFlag = (flagName: keyof FeatureFlags): boolean => {
  const { flags } = useFeatureFlags();
  return flags?.[flagName] ?? false;
};
