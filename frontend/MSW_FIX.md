## ⚠️ MSW Connection Issue - Quick Fix

You're seeing "ERR_CONNECTION_REFUSED" because MSW isn't intercepting the API calls. Here's how to fix it:

### Option 1: Restart the Dev Server (Recommended)
MSW was installed after the dev server started. You need to restart it:

1. **Stop the current server** (Ctrl+C in terminal)
2. **Start it again**:
   ```bash
   npm run dev
   ```

### Option 2: Check Browser Console
After restarting, you should see in the console:
- `[MSW] Mocking enabled.`
- When you submit the form: `[MSW] Intercepting registration request`

### Option 3: Force Refresh
If restarting doesn't work:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### What's Happening:
- MSW uses a Service Worker to intercept HTTP requests
- The Service Worker needs to be registered when the app starts
- Installing MSW after the app is running requires a restart

### After Restarting:
1. The network error should disappear
2. `user@example.com` will show "email already exists"
3. Other emails will register successfully

### Still Having Issues?
Check if you see this file: http://localhost:3000/mockServiceWorker.js
If not, run:
```bash
npm run msw:init
```

Then restart the dev server again.
