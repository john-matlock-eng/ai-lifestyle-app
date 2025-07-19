import { createContext } from "react";
import type { UserProfile } from "../features/auth/services/authService";

export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiry: Date | null;
  isSessionWarningActive: boolean;
  login: (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  logout: (reason?: "manual" | "timeout" | "security") => void;
  refreshToken: () => Promise<void>;
  refreshSession: () => Promise<void>;
  dismissSessionWarning: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
