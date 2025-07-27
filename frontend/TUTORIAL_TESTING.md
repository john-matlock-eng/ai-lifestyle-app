# Testing Tutorial System

## IMPORTANT FIX APPLIED

The issue was that the companion wasn't being rendered on the dashboard. I've now wrapped the dashboard with a `CompanionProvider` that renders the animated shih tzu companion. The tutorial system should now work properly.

I've added extensive debugging to help figure out why tutorials aren't showing. Here's how to test:

## 1. First, Clear Your Browser Data
```javascript
// In browser console (F12)
localStorage.removeItem('encryptionBannerDismissed')
```

## 2. Check the Dashboard
When you load the dashboard, you should see:
- The shih tzu companion on the page
- A debug panel in the bottom-left corner (in development mode)
- Console logs showing tutorial checks

## 3. Use the Debug Panel
I've added a debug panel on the dashboard (bottom-left corner) with buttons to manually trigger tutorials:
- "Start Encryption Tutorial"
- "Start Dashboard Intro"  
- "Start Habit Tutorial"

Click these to test if the tutorial system is working.

## 4. Check Console Logs
Open your browser console (F12) and look for:
- `[Dashboard] Companion initialized: true`
- `[CompanionTutorial] Page ID: dashboard`
- `[CompanionTutorial] Tutorial enabled: true`
- `[Tutorial] Checking tutorials for page: dashboard`
- `[Tutorial] Should show encryption_setup: true`

## 5. Manual Console Commands
You can also trigger tutorials from the console:
```javascript
window.startTutorial('encryption_setup')
window.startTutorial('dashboard_intro')
window.startTutorial('habit_creation')
```

## 6. Check User Profile
Your user profile should have tutorial preferences. Check if they exist:
```javascript
// In your React DevTools, look for the AuthContext provider
// Check if user.preferences.tutorials exists
```

## 7. Common Issues & Fixes

### Companion Not Showing
- The companion should appear on the right side of the screen
- If not visible, there might be a CSS issue or the hook isn't initializing

### No Tutorial UI
- Even if logs show tutorials starting, the UI might not render
- Check if `tutorialState.isActive` is becoming true
- Check if the companion is initialized before tutorials try to use it

### User Profile Missing Tutorial Prefs
- New users might not have tutorial preferences in their profile
- The system should default to enabled, but the backend might need to initialize this

## Next Steps
1. Try the debug panel buttons first
2. Check what console logs appear
3. Let me know which logs you see and which are missing
4. If tutorials work with manual triggers but not automatically, we'll focus on the auto-start logic
5. If nothing works, we'll add more specific debugging

The issue is likely one of:
- User profile not having tutorial preferences initialized
- Companion not being ready when tutorials try to start
- CSS selectors not matching (though I fixed the encryption banner selector)
- Tutorial state not updating properly

Let me know what you find!
