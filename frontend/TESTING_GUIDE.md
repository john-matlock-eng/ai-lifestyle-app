# 🧪 Testing Guide - Complete Authentication System

## Quick Navigation
- 🔐 **Login**: http://localhost:3000/login
- 📝 **Register**: http://localhost:3000/register
- 🏠 **Dashboard**: http://localhost:3000/dashboard (requires login)

## Complete User Flow

### 1️⃣ Registration → Login → Dashboard
1. Start at `/register`
2. Create new account
3. Navigate to `/login`
4. Sign in with your credentials
5. Land on personalized dashboard

### 2️⃣ Navigation Testing
**After Login:**
- Click user avatar (top-right) for dropdown menu
- Navigate between Dashboard, Meals, Workouts, Wellness
- Test mobile menu (resize browser)
- Sign out and verify redirect to login

## Login Test Scenarios

### 🔐 Regular Login (No MFA)
- **Email**: user@example.com
- **Password**: ExistingP@ss123
- **Result**: Direct login (redirects to dashboard)

### 🔒 MFA-Enabled Login
- **Email**: mfa@example.com
- **Password**: MfaUserP@ss123
- **Result**: Shows 6-digit code input
- **Valid Code**: Any 6 digits except 000000

## Registration Test Scenarios

### ✅ Successful Registration
1. **First Name**: John
2. **Last Name**: Doe  
3. **Email**: john.doe@example.com
4. **Password**: SecureP@ss123
5. **Confirm Password**: SecureP@ss123
6. Check "I agree to the Terms and Conditions"
7. Click "Create account"

**Expected**: Redirect to success page with email confirmation message

### ❌ Email Already Exists (409 Error)
Use email: **user@example.com**

**Expected**: "An account with this email already exists" error under email field

**Note**: This email is pre-populated in the mock database. The mock data persists in sessionStorage, so registered users will remain until you clear browser data.

### ⚠️ Validation Tests

#### Weak Password
- Password: `weak`
- See password strength meter turn red
- Get validation errors

#### Password Mismatch  
- Password: `SecureP@ss123`
- Confirm: `DifferentP@ss123`
- Get "Passwords don't match" error

#### Invalid Email
- Email: `not-an-email`
- Get "Invalid email address" error

#### Empty Fields
- Leave any required field empty
- Get "This field is required" errors

### 🔍 What to Look For

1. **Password Strength Meter**:
   - Red = Very Weak
   - Orange = Weak  
   - Yellow = Fair
   - Blue = Good
   - Green = Strong

2. **Form States**:
   - Loading spinner in button during submission
   - Button text changes to "Creating account..."
   - Fields are disabled during submission

3. **Accessibility**:
   - Tab through all fields
   - Screen reader announcements for errors
   - Focus indicators on all interactive elements

4. **Responsive Design**:
   - Resize browser to mobile width
   - Form should stack nicely
   - All elements remain usable

### 🐛 Browser DevTools

Open DevTools (F12) and check:

**Console Tab**:
```
[MSW] Mocking enabled.
[MSW] 201 POST http://localhost:4000/v1/auth/register
```

**Network Tab**:
- See the intercepted API calls
- Check request/response payloads
- All requests handled by Service Worker

### 📝 Notes
- All data is mocked - nothing is saved to a real database
- Mock users persist in sessionStorage during your browser session
- The success page requires navigation from registration (direct access redirects back)
- `user@example.com` is always pre-populated as an existing user

### 🔄 Reset Mock Data
To clear all registered users and start fresh:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `sessionStorage.clear()`
4. Refresh the page

The mock database will reset with only `user@example.com` as an existing user.
