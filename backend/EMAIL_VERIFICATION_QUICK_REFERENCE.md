# 📧 Email Verification - Quick Reference

## Current Status
- ✅ **Endpoint Ready**: POST `/auth/email/verify`
- ✅ **Code Complete**: All implementation done
- ⚠️ **Email Delivery**: Not working (AWS issue)
- ✅ **Workaround**: 7-day grace period active

## For Frontend Team

### Registration Flow
```javascript
// 1. User registers
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

// Response
{
  "userId": "uuid",
  "email": "user@example.com",
  "message": "Registration successful. Please check your email to verify your account."
}

// 2. User should receive email (currently not working)
// Subject: "Verify your email for AI Lifestyle App"
// Code: 6-digit number

// 3. User verifies (when emails work)
POST /auth/email/verify
{
  "token": "user@example.com:123456"
}
```

### Important Notes
- Users can login immediately (no verification required for 7 days)
- Show message about verification but don't block access
- Email verification is optional for MVP

## For Testing

### Manual Verification (While emails are broken)
```powershell
# Use this script to manually verify test users
.\scripts\manual-verify-email.ps1
```

### Check if emails are working
```powershell
# Test Cognito directly
.\scripts\test-cognito-direct.ps1
```

## For PM

### What's Working
- ✅ Users can register
- ✅ Users can login (even unverified)
- ✅ Verification endpoint ready
- ✅ 7-day grace period active

### What's Not Working
- ❌ Cognito not sending emails
- Likely AWS account/region issue
- Not a code problem

### Options
1. **Continue Development** - Use manual verification
2. **Contact AWS Support** - Resolve email issue
3. **Implement SES** - More reliable for production
4. **Use Lambda Trigger** - Custom email solution

### Time Impact
- No impact on development (grace period)
- Email issue isolated from other features
- Can be fixed independently later

## Quick Commands

### Deploy Latest Code
```bash
git push  # Triggers GitHub Actions
```

### Manual User Verification
```powershell
.\scripts\manual-verify-email.ps1 `
  -UserPoolId "your-pool-id" `
  -Email "user@example.com"
```

### Test Email Sending
```powershell
.\scripts\test-cognito-direct.ps1
```

## Summary

Email verification is fully implemented but AWS Cognito isn't sending emails. This doesn't block development due to the 7-day grace period. For production, we recommend setting up Amazon SES for reliable email delivery.
