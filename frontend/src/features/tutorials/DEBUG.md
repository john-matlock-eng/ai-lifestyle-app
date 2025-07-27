## Debugging Tutorial System

When you load the dashboard, open your browser console (F12) and look for the following logs:

### 1. Check if tutorials are being checked:
Look for logs starting with `[CompanionTutorial]` and `[Tutorial]`:
- `[CompanionTutorial] Page ID: dashboard`
- `[CompanionTutorial] Tutorial enabled: true`
- `[CompanionTutorial] Checking page tutorials after delay`
- `[Tutorial] Checking tutorials for page: dashboard`

### 2. Check tutorial preferences:
Look for: `[Tutorial] User preferences:` - this should show your tutorial state

### 3. Manual testing:
In the browser console, you can manually trigger tutorials:

```javascript
// Test encryption tutorial
window.startTutorial('encryption_setup')

// Test dashboard intro
window.startTutorial('dashboard_intro')

// Test habit creation
window.startTutorial('habit_creation')
```

### 4. Check if companion is loaded:
The companion should be visible on the page. If not, there might be an issue with the companion initialization.

### 5. Common issues:
- **No logs appearing**: The component might not be rendering. Check if the dashboard is loading properly.
- **Tutorial preferences undefined**: New users might not have preferences initialized. The system should default to enabled.
- **Companion not showing**: The companion might not be initializing properly.

### 6. Reset tutorial state:
If you need to reset your tutorial progress, you can do this from the Settings page (once we add the TutorialSettings component there).

### 7. Browser storage:
Check if `encryptionBannerDismissed` is set in localStorage:
```javascript
localStorage.getItem('encryptionBannerDismissed')
// If this returns "true", clear it:
localStorage.removeItem('encryptionBannerDismissed')
```

Please run through these debug steps and let me know what you see in the console.
