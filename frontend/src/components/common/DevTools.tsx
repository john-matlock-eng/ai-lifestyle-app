import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAccessToken, getRefreshToken } from '../../features/auth/utils/tokenManager';

const DevTools: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showRefreshToken, setShowRefreshToken] = useState(false);
  const [isMSWActive, setIsMSWActive] = useState(false);

  useEffect(() => {
    // Only show in development
    if (import.meta.env.MODE !== 'development') {
      return;
    }

    // Load tokens
    const loadTokens = async () => {
      const access = await getAccessToken();
      const refresh = await getRefreshToken();
      setAccessToken(access);
      setRefreshToken(refresh);
    };
    loadTokens();

    // Check MSW status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          const mswRegistration = registrations.find((reg) =>
            reg.active?.scriptURL.includes('mockServiceWorker.js')
          );
          setIsMSWActive(!!mswRegistration);
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, [user]);

  // Don't render in production
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const truncateToken = (token: string | null) => {
    if (!token) return 'Not available';
    return `${token.substring(0, 20)}...${token.substring(token.length - 20)}`;
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Toggle Dev Tools"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Dev Tools Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl p-4 w-96 max-h-[600px] overflow-y-auto z-50 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Dev Tools</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* MSW Status */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">MSW Status:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isMSWActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {isMSWActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">User Info</h4>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <span
                  className={`font-medium ${
                    user ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {user ? 'Authenticated' : 'Not authenticated'}
                </span>
              </div>
              {user && (
                <>
                  <div>
                    <span className="text-gray-500">Email:</span>{' '}
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Name:</span>{' '}
                    <span className="font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">User ID:</span>{' '}
                    <span className="font-mono text-xs">{user.userId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email Verified:</span>{' '}
                    <span
                      className={`font-medium ${
                        user.emailVerified ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      {user.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">MFA Enabled:</span>{' '}
                    <span
                      className={`font-medium ${
                        user.mfaEnabled ? 'text-green-600' : 'text-gray-600'
                      }`}
                    >
                      {user.mfaEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tokens */}
          {user && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tokens</h4>
              <div className="space-y-2">
                {/* Access Token */}
                <div className="p-2 bg-gray-50 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      Access Token
                    </span>
                    <button
                      onClick={() => setShowAccessToken(!showAccessToken)}
                      className="text-xs text-purple-600 hover:text-purple-700"
                    >
                      {showAccessToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="text-xs font-mono break-all">
                    {showAccessToken
                      ? accessToken || 'Not available'
                      : truncateToken(accessToken)}
                  </div>
                </div>

                {/* Refresh Token */}
                <div className="p-2 bg-gray-50 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      Refresh Token
                    </span>
                    <button
                      onClick={() => setShowRefreshToken(!showRefreshToken)}
                      className="text-xs text-purple-600 hover:text-purple-700"
                    >
                      {showRefreshToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="text-xs font-mono break-all">
                    {showRefreshToken
                      ? refreshToken || 'Not available'
                      : truncateToken(refreshToken)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
              >
                🔄 Reload Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full text-left px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors"
              >
                🗑️ Clear Storage & Reload
              </button>
              <button
                onClick={() => {
                  console.log('Current State:', {
                    user,
                    accessToken,
                    refreshToken,
                    localStorage: { ...localStorage },
                    sessionStorage: { ...sessionStorage },
                  });
                }}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
              >
                📋 Log State to Console
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Development Tools - {import.meta.env.MODE} mode
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default DevTools;
