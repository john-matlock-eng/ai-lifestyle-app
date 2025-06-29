// Shared types between frontend and backend

export interface User {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  metadata?: {
    timestamp: string;
    version: string;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  environment: string;
  timestamp: string;
  checks: {
    dynamodb: {
      status: string;
      [key: string]: any;
    };
  };
}
