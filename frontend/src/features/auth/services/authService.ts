import apiClient from '../../../api/client';
import { setTokens, clearTokens } from '../utils/tokenManager';
import type { 
  RegisterFormData, 
  LoginFormData, 
  PasswordResetRequestFormData, 
  PasswordResetConfirmFormData 
} from '../utils/validation';

// API Response Types (matching OpenAPI contract)
export interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  mfaEnabled?: boolean;
  phoneNumber?: string;
  dateOfBirth?: string;
  timezone?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  units?: 'metric' | 'imperial';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  dietaryRestrictions?: string[];
  fitnessGoals?: string[];
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserProfile;
}

export interface MfaRequiredResponse {
  sessionToken: string;
  mfaRequired: true;
  tokenType: 'Bearer';
}

export interface MessageResponse {
  message: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string; // Note: QR code display will be implemented with React 19 compatible library
  backupCodes: string[];
}

export interface MfaStatusResponse {
  mfaEnabled: boolean;
  message: string;
}

// Auth Service
class AuthService {
  async register(data: Omit<RegisterFormData, 'confirmPassword'>): Promise<RegisterResponse> {
    const { data: response } = await apiClient.post<RegisterResponse>('/auth/register', {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    return response;
  }

  async login(data: LoginFormData & { rememberMe?: boolean }): Promise<LoginResponse | MfaRequiredResponse> {
    const { data: response } = await apiClient.post<LoginResponse | MfaRequiredResponse>('/auth/login', {
      email: data.email,
      password: data.password,
    });

    // Check if MFA is required
    if ('mfaRequired' in response) {
      return response;
    }

    // Store tokens if login successful
    setTokens(response.accessToken, response.refreshToken, response.expiresIn);
    return response;
  }

  async verifyMfa(sessionToken: string, code: string): Promise<LoginResponse> {
    const { data: response } = await apiClient.post<LoginResponse>('/auth/mfa/verify', {
      sessionToken,
      code,
    });

    // Store tokens after successful MFA verification
    setTokens(response.accessToken, response.refreshToken, response.expiresIn);
    return response;
  }

  async logout(): Promise<void> {
    clearTokens();
    // Note: You might want to call a logout endpoint if the backend implements one
  }

  async getCurrentUser(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>('/users/profile');
    return data;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data } = await apiClient.put<UserProfile>('/users/profile', updates);
    return data;
  }

  async requestPasswordReset(data: PasswordResetRequestFormData): Promise<MessageResponse> {
    const { data: response } = await apiClient.post<MessageResponse>('/auth/password/reset-request', data);
    return response;
  }

  async confirmPasswordReset(data: PasswordResetConfirmFormData): Promise<MessageResponse> {
    const { data: response } = await apiClient.post<MessageResponse>('/auth/password/reset-confirm', {
      token: data.token,
      password: data.password,
    });
    return response;
  }

  async verifyEmail(token: string): Promise<MessageResponse> {
    const { data: response } = await apiClient.post<MessageResponse>('/auth/email/verify', { token });
    return response;
  }

  async setupMfa(): Promise<MfaSetupResponse> {
    const { data } = await apiClient.post<MfaSetupResponse>('/auth/mfa/setup');
    return data;
  }

  async verifyMfaSetup(code: string): Promise<MfaStatusResponse> {
    const { data } = await apiClient.post<MfaStatusResponse>('/auth/mfa/verify-setup', { code });
    return data;
  }

  async disableMfa(password: string): Promise<MfaStatusResponse> {
    const { data } = await apiClient.post<MfaStatusResponse>('/auth/mfa/disable', { password });
    return data;
  }
}

export const authService = new AuthService();
