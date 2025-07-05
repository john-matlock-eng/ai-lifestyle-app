# 🧪 Testing Guide - Login Form with MFA

## Test Accounts

### 🔐 Regular Login (No MFA)
- **Email**: user@example.com
- **Password**: ExistingP@ss123
- **Result**: Direct login to dashboard

### 🔒 MFA-Enabled Login
- **Email**: mfa@example.com  
- **Password**: MfaUserP@ss123
- **Result**: Prompts for 6-digit code
- **Test Code**: Any 6 digits except 000000 (e.g., 123456)

## Test Scenarios

### ✅ Successful Login (No MFA)
1. Go to http://localhost:3000/login
2. Enter:
   - Email: `user@example.com`
   - Password: `ExistingP@ss123`
3. Click "Sign in"
4. **Expected**: Redirect to dashboard (currently goes to register since dashboard doesn't exist)

### ✅ Successful Login with MFA
1. Enter:
   - Email: `mfa@example.com`
   - Password: `MfaUserP@ss123`
2. Click "Sign in"
3. **Expected**: See MFA code input screen
4. Enter any 6-digit code (e.g., `123456`)
5. **Expected**: Login successful

### ❌ Invalid Credentials
1. Use wrong password or non-existent email
2. **Expected**: "Invalid email or password" error

### ❌ Invalid MFA Code
1. Login with MFA account
2. Enter `000000` as the code
3. **Expected**: "Invalid verification code" error

### 🔄 MFA Code Input Features
- **Auto-advance**: Typing moves to next digit automatically
- **Paste support**: Can paste full 6-digit code
- **Backspace**: Deletes and moves to previous digit
- **Arrow keys**: Navigate between digits

### 🎨 UI Features to Test

1. **Remember Me**:
   - Check the checkbox
   - Currently shows in console (future: extends session)

2. **Show/Hide Password**:
   - Click eye icon to toggle visibility

3. **Forgot Password Link**:
   - Currently navigates to /forgot-password (not implemented yet)

4. **Loading States**:
   - Button shows "Signing in..." during submission
   - Form fields are disabled

5. **Responsive Design**:
   - Test on mobile screen sizes
   - All elements should remain accessible

### 📊 Dev Tools Features

Use the Dev Tools panel (bottom-right):
- **Test MSW Status**: Verify MSW is working
- **Show Mock Users**: See all registered users including pre-populated ones
- **Reset Mock Data**: Clear and restore default users

### 🐛 Console Messages

Watch for these in browser console:
```
[MSW] Intercepting login request
[MSW] Intercepting MFA verification
```

### 💡 Tips

1. **Quick MFA Test**: Use `mfa@example.com` to test the two-step flow
2. **Test Navigation**: "Create a new account" link goes to registration
3. **Cancel MFA**: "Use a different account" returns to login form
4. **Session Expiry**: Not implemented in mocks (always succeeds)

### 🔄 Reset Test Data

To start fresh:
1. Click "Reset Mock Data" in Dev Tools
2. Or in console: `sessionStorage.clear()` and refresh

This restores the two default test accounts.
