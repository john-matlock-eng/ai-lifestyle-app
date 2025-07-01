import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_URL;

// Mock data store with persistence
const STORAGE_KEY = 'msw-mock-users';

// Initialize users from sessionStorage or with default data
const initializeUsers = () => {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    return new Map(JSON.parse(stored));
  }
  
  // Default users for testing
  const defaultUsers = new Map();
  
  // User without MFA (for testing regular login)
  defaultUsers.set('user@example.com', {
    userId: 'existing-user-123',
    email: 'user@example.com',
    firstName: 'Existing',
    lastName: 'User',
    password: 'ExistingP@ss123',
    emailVerified: true,
    mfaEnabled: false,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  });
  
  // User with MFA enabled (for testing MFA flow)
  defaultUsers.set('mfa@example.com', {
    userId: 'mfa-user-456',
    email: 'mfa@example.com',
    firstName: 'MFA',
    lastName: 'User',
    password: 'MfaUserP@ss123',
    emailVerified: true,
    mfaEnabled: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  });
  
  return defaultUsers;
};

const users = initializeUsers();
const sessions = new Map();

// Save users to sessionStorage whenever it changes
const saveUsers = () => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(users.entries())));
};

export const authHandlers = [
  // Health check endpoint
  http.get(`${API_URL}/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
        cache: 'connected'
      }
    });
  }),

  // Utility endpoint to clear mock data (for testing)
  http.delete(`${API_URL}/test/clear-users`, () => {
    users.clear();
    
    // Re-add default users
    users.set('user@example.com', {
      userId: 'existing-user-123',
      email: 'user@example.com',
      firstName: 'Existing',
      lastName: 'User',
      password: 'ExistingP@ss123',
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    });
    
    users.set('mfa@example.com', {
      userId: 'mfa-user-456',
      email: 'mfa@example.com',
      firstName: 'MFA',
      lastName: 'User',
      password: 'MfaUserP@ss123',
      emailVerified: true,
      mfaEnabled: true,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    });
    
    saveUsers();
    return HttpResponse.json({ message: 'Mock data reset' });
  }),

  // Register endpoint
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    console.log('[MSW] Intercepting registration request');
    const body = await request.json() as any;

    // Simulate validation
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return HttpResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          validation_errors: [
            { field: 'email', message: 'Email is required' },
          ],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (users.has(body.email)) {
      return HttpResponse.json(
        {
          error: 'EMAIL_EXISTS',
          message: 'An account with this email already exists',
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    // Create user
    const userId = crypto.randomUUID();
    const user = {
      userId,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      emailVerified: false,
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.set(body.email, { ...user, password: body.password });
    saveUsers(); // Persist to sessionStorage

    return HttpResponse.json(
      {
        userId,
        email: body.email,
        message: 'Registration successful. Please check your email to verify your account.',
      },
      { status: 201 }
    );
  }),

  // Login endpoint
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    console.log('[MSW] Intercepting login request');
    const body = await request.json() as any;

    const user = users.get(body.email);
    if (!user || user.password !== body.password) {
      return HttpResponse.json(
        {
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Simulate MFA check
    if (user.mfaEnabled) {
      const sessionToken = crypto.randomUUID();
      sessions.set(sessionToken, { userId: user.userId, email: user.email });
      
      return HttpResponse.json({
        sessionToken,
        mfaRequired: true,
        tokenType: 'Bearer',
      });
    }

    // Generate tokens
    const accessToken = `mock-access-token-${crypto.randomUUID()}`;
    const refreshToken = `mock-refresh-token-${crypto.randomUUID()}`;

    const { password, ...userProfile } = user;

    return HttpResponse.json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: userProfile,
    });
  }),

  // MFA verification endpoint
  http.post(`${API_URL}/auth/mfa/verify`, async ({ request }) => {
    console.log('[MSW] Intercepting MFA verification');
    const body = await request.json() as any;

    const session = sessions.get(body.sessionToken);
    if (!session) {
      return HttpResponse.json(
        {
          error: 'INVALID_SESSION',
          message: 'Invalid or expired session',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Simulate MFA code validation (accept any 6-digit code for demo)
    if (!body.code || body.code.length !== 6 || !/^\d+$/.test(body.code)) {
      return HttpResponse.json(
        {
          error: 'INVALID_CODE',
          message: 'Invalid verification code',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Special codes for testing
    if (body.code === '000000') {
      return HttpResponse.json(
        {
          error: 'INVALID_CODE',
          message: 'Invalid verification code',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Get user from session
    const user = Array.from(users.values()).find(u => u.userId === session.userId);
    if (!user) {
      return HttpResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Generate tokens
    const accessToken = `mock-access-token-${crypto.randomUUID()}`;
    const refreshToken = `mock-refresh-token-${crypto.randomUUID()}`;

    const { password, ...userProfile } = user;

    // Clear session
    sessions.delete(body.sessionToken);

    return HttpResponse.json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: userProfile,
    });
  }),

  // Get user profile
  http.get(`${API_URL}/users/profile`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization token',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Mock user profile
    return HttpResponse.json({
      userId: 'mock-user-id',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  // Refresh token endpoint
  http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
    const body = await request.json() as any;

    if (!body.refreshToken || !body.refreshToken.startsWith('mock-refresh-token-')) {
      return HttpResponse.json(
        {
          error: 'INVALID_TOKEN',
          message: 'Invalid refresh token',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Generate new access token
    const accessToken = `mock-access-token-${crypto.randomUUID()}`;

    return HttpResponse.json({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
  }),
];
