import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, UserProfile } from '../features/auth/services/authService';
import { 
  getAccessToken, 
  getRefreshToken, 
  clearTokens, 
  refreshAccessToken,
  getTokenExpiry,
  setRememberMe,
  getRememberMe 
} from '../features/auth/utils/tokenManager';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiry: Date | null;
  isSessionWarningActive: boolean;
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: (reason?: 'manual' | 'timeout' | 'security') => void;
  refreshToken: () => Promise<void>;
  refreshSession: () => Promise<void>;
  dismissSessionWarning: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Session timeout settings
const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
const SESSION_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSessionWarningActive, setIsSessionWarningActive] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  
  // Refs for timeout management
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout>();
  const idleTimeoutRef = useRef<NodeJS.Timeout>();
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Check if user has a valid token on mount
  const { data: user, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: !!getAccessToken() && isInitialized,
    retry: (failureCount, error: any) => {
      // Only retry on network errors, not auth errors
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        // Token is invalid, try to refresh
        handleTokenRefresh();
      }
    },
  });

  // Initialize auth state and restore session
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      
      if (accessToken && refreshToken) {
        // Check token validity
        const expiry = getTokenExpiry();
        if (expiry && new Date(expiry) > new Date()) {
          setSessionExpiry(new Date(expiry));
          setIsInitialized(true);
          startSessionManagement();
        } else {
          // Token expired, try to refresh
          try {
            const newToken = await refreshAccessToken();
            if (newToken) {
              const newExpiry = getTokenExpiry();
              if (newExpiry) {
                setSessionExpiry(new Date(newExpiry));
              }
              setIsInitialized(true);
              startSessionManagement();
            } else {
              clearTokens();
              setIsInitialized(true);
            }
          } catch {
            clearTokens();
            setIsInitialized(true);
          }
        }
      } else {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Activity tracking for idle timeout
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, []);

  // Start session management (token refresh, idle detection, expiry warnings)
  const startSessionManagement = useCallback(() => {
    // Clear any existing intervals
    stopSessionManagement();

    // Set up session check interval
    sessionCheckIntervalRef.current = setInterval(() => {
      checkSessionStatus();
    }, SESSION_CHECK_INTERVAL);

    // Set up idle timeout check
    idleTimeoutRef.current = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      
      if (idleTime > IDLE_TIMEOUT) {
        logout('timeout');
      }
    }, 60000); // Check every minute

    // Schedule token refresh
    scheduleTokenRefresh();
  }, []);

  const stopSessionManagement = useCallback(() => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }
    if (idleTimeoutRef.current) {
      clearInterval(idleTimeoutRef.current);
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    setIsSessionWarningActive(false);
  }, []);

  const checkSessionStatus = useCallback(() => {
    const expiry = getTokenExpiry();
    if (!expiry) return;

    const now = new Date();
    const expiryDate = new Date(expiry);
    const timeUntilExpiry = expiryDate.getTime() - now.getTime();

    setSessionExpiry(expiryDate);

    // Show warning if less than 5 minutes remaining
    if (timeUntilExpiry > 0 && timeUntilExpiry < SESSION_WARNING_TIME) {
      setIsSessionWarningActive(true);
    } else if (timeUntilExpiry <= 0) {
      // Session expired
      handleTokenRefresh();
    }
  }, []);

  const scheduleTokenRefresh = useCallback(() => {
    const expiry = getTokenExpiry();
    if (!expiry) return;

    const now = new Date();
    const expiryDate = new Date(expiry);
    const timeUntilExpiry = expiryDate.getTime() - now.getTime();
    
    // Refresh token 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - SESSION_WARNING_TIME, 0);
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      handleTokenRefresh();
    }, refreshTime);
  }, []);

  const handleTokenRefresh = useCallback(async () => {
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Update session expiry
        const newExpiry = getTokenExpiry();
        if (newExpiry) {
          setSessionExpiry(new Date(newExpiry));
        }
        // Refetch user data
        await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        // Schedule next refresh
        scheduleTokenRefresh();
        setIsSessionWarningActive(false);
      } else {
        logout('timeout');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout('timeout');
    }
  }, [queryClient]);

  // Monitor for authentication changes
  useEffect(() => {
    const token = getAccessToken();
    if (token && !sessionExpiry) {
      // Token exists but session management not started
      const expiry = getTokenExpiry();
      if (expiry) {
        setSessionExpiry(new Date(expiry));
        startSessionManagement();
      }
    }
  }, [user, sessionExpiry, startSessionManagement]);

  const login = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    // LoginForm component handles the actual login
    // This is kept for interface compatibility
    return Promise.resolve();
  };

  const logout = useCallback((reason: 'manual' | 'timeout' | 'security' = 'manual') => {
    // Stop all session management
    stopSessionManagement();
    
    // Clear auth data
    authService.logout();
    clearTokens();
    queryClient.clear();
    setSessionExpiry(null);
    
    // Navigate based on logout reason
    if (reason === 'timeout') {
      navigate('/login?message=session_expired');
    } else if (reason === 'security') {
      navigate('/login?message=security_logout');
    } else {
      navigate('/login');
    }
  }, [navigate, queryClient, stopSessionManagement]);

  const refreshToken = async () => {
    await handleTokenRefresh();
  };

  const refreshSession = async () => {
    // Extend session by refreshing token
    await handleTokenRefresh();
    setIsSessionWarningActive(false);
  };

  const dismissSessionWarning = () => {
    setIsSessionWarningActive(false);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    queryClient.setQueryData(['currentUser'], (oldData: UserProfile | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updates };
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSessionManagement();
    };
  }, [stopSessionManagement]);

  const isAuthenticated = !!user && !!getAccessToken();
  const isLoading = !isInitialized || isLoadingUser;

  const value: AuthContextValue = {
    user: user || null,
    isAuthenticated,
    isLoading,
    sessionExpiry,
    isSessionWarningActive,
    login,
    logout,
    refreshToken,
    refreshSession,
    dismissSessionWarning,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
