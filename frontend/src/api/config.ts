import apiClient from './client';

export interface FeatureFlags {
  debugPanels: boolean;
  // Add more feature flags here as they're added to the backend
}

/**
 * Fetch feature flags from the backend
 */
export const getFeatureFlags = async (): Promise<FeatureFlags> => {
  const response = await apiClient.get<FeatureFlags>('/config/features');
  return response.data;
};