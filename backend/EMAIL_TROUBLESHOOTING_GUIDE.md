# 🔍 Cognito Email Not Sending - Comprehensive Troubleshooting

## Current Status
- ✅ Code updated to use `sign_up` API
- ✅ Removed `auto_verified_attributes = ["email"]` from Terraform
- ✅ Email templates configured in Terraform
- ❌ Still no emails being received

## Diagnostic Scripts Created

1. **`test-cognito-direct.ps1`** - Test Cognito directly via AWS CLI
2. **`test-cognito-methods.ps1`** - Test different registration methods
3. **`debug-cognito-deep.ps1`** - Deep dive into Cognito configuration
4. **`debug-cognito-email.ps1`** - Check email configuration
5. **`test-registration-email.ps1`** - End-to-end registration test

## Common Issues & Solutions

### 1. **AWS Region Limitations**
Some AWS regions don't support Cognito email sending.
- **Check**: Ensure you're in a supported region (us-east-1 should work)
- **Fix**: Move Cognito to a supported region

### 2. **Email Sending Limits**
Cognito default email has limits:
- **Limit**: 50 emails per day
- **Check**: Count how many test registrations you've done
- **Fix**: Wait 24 hours or set up SES

### 3. **Cognito User Pool State**
The User Pool might be in a state that prevents emails.
- **Check**: Run `.\debug-cognito-deep.ps1`
- **Look for**: 
  - Email configuration = COGNITO_DEFAULT
  - No auto-verified attributes
  - User Pool status = Active

### 4. **AWS Account Restrictions**
New AWS accounts might have restrictions.
- **Check**: Try creating a user via AWS Console
- **Fix**: Contact AWS support to lift restrictions

### 5. **Message Template Issues**
Missing or incorrect message templates.
- **Check**: Verification message template exists in Terraform
- **Fix**: Ensure templates are properly configured

## Testing Approach

### Step 1: Test Direct AWS CLI
```powershell
.\scripts\test-cognito-direct.ps1
```
This bypasses all Lambda code and tests Cognito directly.

### Step 2: Check Configuration
```powershell
.\scripts\debug-cognito-deep.ps1
```
This shows all Cognito settings that might affect email.

### Step 3: Test Different Methods
```powershell
.\scripts\test-cognito-methods.ps1
```
This tries multiple registration approaches.

## Alternative Solutions

### Option 1: Use AWS Console
1. Go to Cognito in AWS Console
2. Select your User Pool
3. Click "Create user"
4. Check "Send an invitation to this new user?"
5. If this works, it's a code issue. If not, it's AWS config.

### Option 2: Implement Custom Email
Use Lambda triggers to send emails via SES:
```hcl
# In Terraform
lambda_config {
  custom_message = aws_lambda_function.custom_email.arn
}
```

### Option 3: Use SES Instead
1. Verify domain in SES
2. Update Cognito to use SES
3. Higher sending limits and better deliverability

## Current Code Flow

1. User registers → `sign_up` API call
2. Cognito should:
   - Create user in UNCONFIRMED state
   - Generate 6-digit code
   - Send email automatically
   - Return CodeDeliveryDetails
3. Our code logs the delivery details
4. User receives email → verifies with our endpoint

## What's Been Tried

1. ✅ Changed from `admin_create_user` to `sign_up`
2. ✅ Removed `MessageAction='SUPPRESS'`
3. ✅ Removed `auto_verified_attributes`
4. ✅ Added proper email templates
5. ✅ Added extensive logging
6. ✅ Created multiple test scripts

## Next Steps

1. **Run Direct Test**:
   ```powershell
   .\scripts\test-cognito-direct.ps1
   ```
   If this doesn't send email, it's an AWS issue, not code.

2. **Check AWS Console**:
   - Manually create a user with invitation
   - If this works, compare settings

3. **Contact AWS Support**:
   - If no emails work, might need AWS to enable something
   - Check if account has restrictions

4. **Consider Alternatives**:
   - Implement custom Lambda for email
   - Use SES for better control
   - Temporarily disable email verification for development

## Emergency Workaround

If emails absolutely won't work:
1. Manually confirm users in Cognito Console
2. Use the admin API to set email_verified = true
3. Continue development while investigating

## Summary

The code is correctly configured to send emails via Cognito's default email service. If emails aren't being received after all these changes, the issue is likely:

1. AWS account/region restrictions
2. Email sending limits exceeded
3. Cognito service issue in your region

Run the diagnostic scripts to identify which one applies to your situation.
