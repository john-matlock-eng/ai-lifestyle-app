import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DevTools: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (import.meta.env.PROD) return null;

  const clearMockData = () => {
    sessionStorage.removeItem('msw-mock-users');
    window.location.reload();
  };

  const showMockUsers = () => {
    const stored = sessionStorage.getItem('msw-mock-users');
    if (stored) {
      const users = new Map(JSON.parse(stored));
      console.table(Array.from(users.values()).map(u => ({
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        verified: u.emailVerified,
        mfaEnabled: u.mfaEnabled
      })));
    } else {
      console.log('No mock users found');
    }
  };

  const testMSW = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);
      console.log('MSW Test Response:', response.status);
      if (response.ok) {
        console.log('✅ MSW is working!');
      } else {
        console.log('❌ MSW might not be intercepting requests');
      }
    } catch (error) {
      console.log('❌ MSW is not intercepting - restart dev server');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-sm">
      <div className="font-semibold mb-2">🛠️ Dev Tools</div>
      
      {/* Auth Status */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-xs text-gray-400 mb-1">Auth Status:</div>
        <div className="text-xs">
          {isAuthenticated ? (
            <>
              <span className="text-green-400">✓ Logged in as:</span>
              <div className="text-gray-300">{user?.email}</div>
            </>
          ) : (
            <span className="text-red-400">✗ Not logged in</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={testMSW}
          className="block w-full text-left px-2 py-1 rounded hover:bg-gray-800 text-yellow-400"
        >
          🧪 Test MSW Status
        </button>
        <button
          onClick={showMockUsers}
          className="block w-full text-left px-2 py-1 rounded hover:bg-gray-800"
        >
          📋 Show Mock Users
        </button>
        <button
          onClick={clearMockData}
          className="block w-full text-left px-2 py-1 rounded hover:bg-gray-800"
        >
          🗑️ Reset Mock Data
        </button>
        <div className="text-xs text-gray-400 mt-2">
          Pre-populated: user@example.com
        </div>
        {window.navigator.serviceWorker && (
          <div className="text-xs text-green-400 mt-1">
            ✓ Service Worker API available
          </div>
        )}
      </div>
    </div>
  );
};

export default DevTools;
