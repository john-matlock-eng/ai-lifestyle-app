import type { FeatureFlags } from "../api/config";

export type { FeatureFlags };

export interface FeatureFlagsContextType {
  flags: FeatureFlags | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
