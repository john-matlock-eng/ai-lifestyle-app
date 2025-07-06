# Frontend Troubleshooting Guide

## Common Issues and Solutions

### 1. Rollup Platform Dependency Error

**Error Message:**
```
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

**Cause:**
This is a known npm issue with optional dependencies. Rollup uses platform-specific native binaries, and npm sometimes fails to install the correct ones.

**Solutions:**

#### Quick Fix (Recommended)
Run the fix-deps script:
```bash
# On Unix/Linux/Mac
npm run fix-deps

# Or use the shell script
./fix-deps.sh

# On Windows
fix-deps.bat
```

#### Manual Fix
```bash
# Remove existing dependencies
rm -rf node_modules package-lock.json

# Reinstall with legacy peer deps flag
npm install --legacy-peer-deps
```

#### CI/CD Fix
The GitHub Actions workflow has been updated to automatically handle this by removing lock files before installation.

### 2. React 19 Compatibility Issues

**Issue:**
Some packages haven't updated their peer dependencies for React 19 yet.

**Solution:**
Always use `--legacy-peer-deps` flag when installing:
```bash
npm install --legacy-peer-deps
```

### 3. Test Failures

**Common Issues:**

1. **Missing @testing-library/dom**
   - Solution: Already added to package.json dependencies

2. **Validation tests failing**
   - Ensure you check required checkboxes before form submission
   - React Hook Form won't validate until HTML5 validation passes

3. **Platform-specific test failures**
   - Ensure Node 20+ is installed
   - Use the same Node version locally as in CI (Node 20)

### 4. Build Issues

**Vite 7 Requirements:**
- Node.js >= 20.19.0
- Modern browser for development

**TypeScript Issues:**
- Run `npm run type-check` to identify type errors
- Ensure all imports use proper extensions

### 5. Development Environment Setup

**Recommended Setup:**
1. Node.js 20.x (LTS)
2. VS Code with extensions:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - TypeScript and JavaScript Language Features

**First Time Setup:**
```bash
# Clone the repository
git clone <repo-url>
cd ai-lifestyle-app/frontend

# Fix dependencies
npm run fix-deps

# Start development server
npm run dev
```

### 6. MSW (Mock Service Worker) Issues

**Service Worker Not Registering:**
```bash
# Initialize MSW
npm run msw:init

# This creates the service worker in public/
```

**Mocks Not Working:**
- Check browser console for MSW activation message
- Ensure you're running in development mode
- Clear browser cache and service workers

### 7. Environment Variables

**Missing API URL:**
Create `.env.development.local`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
```

### 8. Performance Issues

**Slow Hot Module Replacement (HMR):**
- Ensure you're not importing large libraries unnecessarily
- Check for circular dependencies
- Use React Developer Tools Profiler

**Large Bundle Size:**
```bash
# Analyze bundle
npm run build
# Check dist folder size
```

## Getting Help

1. **Check existing issues:** Look for similar problems in GitHub issues
2. **Provide details:** Include error messages, Node version, OS
3. **Minimal reproduction:** Create a minimal example that shows the issue
4. **Check logs:** Look at npm logs in `~/.npm/_logs/`

## Useful Commands

```bash
# Clean install
npm run fix-deps

# Run tests
npm test

# Run tests with UI
npm test:ui

# Type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```
