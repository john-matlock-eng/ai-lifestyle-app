import { setupWorker } from 'msw/browser';
import { authHandlers } from './authHandlers';

// This configures a Service Worker with the given request handlers
export const worker = setupWorker(...authHandlers);

// Start the worker
export async function startMockServiceWorker() {
  if (import.meta.env.MODE === 'development') {
    const result = await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    });
    
    // Log helpful info for debugging
    const stored = sessionStorage.getItem('msw-mock-users');
    if (stored) {
      const users = new Map(JSON.parse(stored));
      console.log('[MSW] Mock users in database:', Array.from(users.keys()));
    }
    console.log('[MSW] Test accounts:');
    console.log('  - user@example.com / ExistingP@ss123 (no MFA)');
    console.log('  - mfa@example.com / MfaUserP@ss123 (MFA enabled)');
    console.log('[MSW] Try registering with "user@example.com" to see duplicate email error');
    console.log('[MSW] Handlers registered for:', authHandlers.map(h => h.info?.path).filter(Boolean));
    
    return result;
  }
}
