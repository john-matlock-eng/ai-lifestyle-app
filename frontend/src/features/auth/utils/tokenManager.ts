import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const REMEMBER_ME_KEY = 'remember_me';

export const getAccessToken = (): string | undefined => {
  return Cookies.get(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | undefined => {
  return Cookies.get(REFRESH_TOKEN_KEY);
};

export const getTokenExpiry = (): string | undefined => {
  return Cookies.get(TOKEN_EXPIRY_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string, expiresIn: number) => {
  const rememberMe = getRememberMe();
  
  // Calculate expiry times
  const accessTokenExpiry = new Date();
  accessTokenExpiry.setSeconds(accessTokenExpiry.getSeconds() + expiresIn);
  
  // Store token expiry for session management
  Cookies.set(TOKEN_EXPIRY_KEY, accessTokenExpiry.toISOString(), {
    expires: accessTokenExpiry,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
  });
  
  // Set access token with expiration
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    expires: accessTokenExpiry,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
  });

  // Set refresh token with extended expiration if remember me is enabled
  const refreshTokenExpiry = rememberMe ? 30 : 7; // 30 days if remember me, 7 days otherwise
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    expires: refreshTokenExpiry,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
  });
};

export const clearTokens = () => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  Cookies.remove(TOKEN_EXPIRY_KEY);
  // Don't clear remember me preference
};

export const setRememberMe = (remember: boolean) => {
  if (remember) {
    Cookies.set(REMEMBER_ME_KEY, 'true', {
      expires: 365, // 1 year
      secure: import.meta.env.PROD,
      sameSite: 'lax',
    });
  } else {
    Cookies.remove(REMEMBER_ME_KEY);
  }
};

export const getRememberMe = (): boolean => {
  return Cookies.get(REMEMBER_ME_KEY) === 'true';
};

export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    // We'll use a direct fetch call here to avoid circular dependency with apiClient
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Update the access token and expiry
    const accessTokenExpiry = new Date();
    accessTokenExpiry.setSeconds(accessTokenExpiry.getSeconds() + data.expiresIn);
    
    Cookies.set(TOKEN_EXPIRY_KEY, accessTokenExpiry.toISOString(), {
      expires: accessTokenExpiry,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
    });
    
    Cookies.set(ACCESS_TOKEN_KEY, data.accessToken, {
      expires: accessTokenExpiry,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
    });

    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
};

// Utility function to check if tokens exist and are valid
export const hasValidSession = (): boolean => {
  const accessToken = getAccessToken();
  const expiry = getTokenExpiry();
  
  if (!accessToken || !expiry) {
    return false;
  }
  
  return new Date(expiry) > new Date();
};

// Utility function to get time until token expiry in milliseconds
export const getTimeUntilExpiry = (): number | null => {
  const expiry = getTokenExpiry();
  if (!expiry) {
    return null;
  }
  
  const expiryDate = new Date(expiry);
  const now = new Date();
  return expiryDate.getTime() - now.getTime();
};
