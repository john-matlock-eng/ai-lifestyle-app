# Frontend Sharing Features - Deployment Guide

## Issue
The sharing features are implemented in the frontend code but you're not seeing them because:

1. **The frontend hasn't been built/deployed with the new changes**
2. **The sharing UI only shows for encrypted entries** 
3. **Backend endpoints for sharing aren't implemented yet**

## Quick Deploy Frontend

### Step 1: Build the Frontend
```bash
cd frontend
npm install
npm run build
```

### Step 2: Deploy to S3/CloudFront
```bash
# Sync to S3 (replace with your bucket name)
aws s3 sync dist/ s3://your-frontend-bucket --delete

# Invalidate CloudFront cache (replace with your distribution ID)
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Where to Find Sharing Features

### 1. **Actions Menu (Three Dots)**
- Go to any **encrypted** journal entry
- Look for the three-dot menu next to Edit/Delete buttons
- Contains: Share with User, AI Analysis, Manage Shares

### 2. **Share Encrypted Button**
- At the bottom of any **encrypted** journal entry
- Next to "Edit Entry" button

### 3. **Shared Journals Page**
- Navigate to `/journal/shared`
- Or click "Shared" button on main journal page

### 4. **Journal Cards**
- Shared entries show a blue badge with user count

## Testing Without Backend

To see the UI even without backend endpoints:

1. **Create an encrypted journal entry:**
   - Create new journal
   - Toggle encryption ON before saving
   
2. **View the encrypted entry:**
   - You should see the actions menu
   - Share buttons should appear

3. **Try sharing:**
   - Click actions menu → Share with User
   - The dialog will open (but API calls will fail)

## Backend Requirements

For full functionality, these endpoints need to be implemented:

```
GET    /users/by-email/:email
POST   /encryption/shares  
GET    /encryption/shares
DELETE /encryption/shares/:id
POST   /encryption/ai-shares
GET    /journal/shared
```

## Temporary UI Testing

To see sharing UI on ALL entries (not just encrypted):

```javascript
// In JournalViewPageEnhanced.tsx, change:
{isEncryptionSetup && entry.isEncrypted && (

// To:
{true && (
```

This will show the sharing UI for testing purposes.

## Full Deployment Script

```bash
#!/bin/bash
# Deploy frontend with sharing features

# Build frontend
cd frontend
npm install
npm run build

# Get S3 bucket from terraform (or set manually)
cd ../backend/terraform
BUCKET_NAME=$(terraform output -raw frontend_bucket_name)
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
cd ../../frontend

# Deploy to S3
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "Frontend deployed! Check https://d3qx4wyq22oaly.cloudfront.net"
```

## Summary

The sharing features ARE implemented but need to be:
1. Built and deployed to see them
2. Used with encrypted entries
3. Backed by API endpoints for full functionality

Deploy the frontend and create an encrypted entry to see the sharing UI!
