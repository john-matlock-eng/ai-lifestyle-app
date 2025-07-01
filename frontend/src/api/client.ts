import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { getAccessToken, refreshAccessToken, clearTokens } from '../features/auth/utils/tokenManager';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Type-safe API error handler
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
  request_id?: string;
  timestamp: string;
}

export interface ValidationError {
  error: 'VALIDATION_ERROR';
  message: string;
  validation_errors: Array<{
    field: string;
    message: string;
  }>;
  request_id?: string;
  timestamp: string;
}

export const isApiError = (error: unknown): error is AxiosError<ApiError> => {
  return axios.isAxiosError(error) && error.response?.data?.error !== undefined;
};

export const isValidationError = (error: unknown): error is AxiosError<ValidationError> => {
  return axios.isAxiosError(error) && error.response?.data?.error === 'VALIDATION_ERROR';
};
