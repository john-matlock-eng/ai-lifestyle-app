# Encrypted Journal Sharing Implementation

This document outlines the complete implementation of the encrypted sharing feature for the journal application.

## Overview

The encrypted sharing system allows users to securely share their journal entries with other users while maintaining end-to-end encryption. The implementation includes:

- User-to-user encrypted sharing with permission management
- AI analysis sharing with time-limited access
- Share management and revocation
- Visual indicators for shared journals
- Dedicated shared journals page

## Components

### 1. **ShareDialog** (`/components/encryption/ShareDialog.tsx`)

- Main dialog for sharing journals with other users
- Handles recipient email input and validation
- Manages permissions (read/write/share)
- Sets expiration times for shares
- Integrates with the encryption service to re-encrypt content keys

### 2. **AIShareDialog** (`/components/encryption/AIShareDialog.tsx`)

- Specialized dialog for sharing journals with AI for analysis
- Provides various analysis types (sentiment, themes, patterns, etc.)
- Implements time-limited access (30 minutes) for privacy
- Shows privacy-preserving guarantees to users

### 3. **ShareManagement** (`/components/encryption/ShareManagement.tsx`)

- Component for managing active shares
- Shows all shares with their status, permissions, and expiration
- Allows revoking shares
- Displays access statistics

### 4. **JournalActions** (`/features/journal/components/JournalActions.tsx`)

- Dropdown menu component for journal entry actions
- Provides quick access to sharing, AI analysis, and share management
- Shows encrypted status indicator

### 5. **SharedJournalsPage** (`/pages/journal/SharedJournalsPage.tsx`)

- Dedicated page for viewing all shared journals
- Filters for "shared by me" and "shared with me"
- Shows share status, permissions, and expiration information
- Links to share management

## Updated Components

### JournalViewPageEnhanced

- Integrated sharing dialogs (ShareDialog, AIShareDialog)
- Added share management modal
- Shows sharing indicators in the metadata
- Displays success messages for sharing operations
- Shows "Manage Shares" button when entries are shared

### JournalCard

- Added visual indicators for shared entries
- Shows number of people the entry is shared with
- Uses blue badge with Users icon for shared status

### JournalPageEnhanced

- Added "Shared" button in the header
- Links to the SharedJournalsPage

## API Integration

### Journal API (`/api/journal.ts`)

- Added `getSharedJournals()` - Fetches all shared journals with filters
- Added `shareJournal()` - Creates a new share
- Added `revokeShare()` - Revokes an existing share
- Updated `getEntry()` to use the correct endpoint path

### Users API (`/api/users.ts`)

- New API module for user-related operations
- `getUserByEmail()` - Fetches user details by email
- `checkUserExists()` - Checks if a user exists

### Encryption Service

The existing encryption service already includes:

- `shareWithUser()` - Re-encrypts content keys for recipients
- `shareWithAI()` - Creates time-limited AI shares
- `getShares()` - Retrieves active shares
- `revokeShare()` - Revokes a share

## Usage Flow

### Sharing a Journal Entry

1. User clicks the actions menu (three dots) on a journal entry
2. Selects "Share with User" from the dropdown
3. ShareDialog opens with the entry pre-selected
4. User enters recipient's email address
5. Sets permissions (read/write/share)
6. Chooses expiration time
7. System validates the recipient has an account and encryption set up
8. Content key is re-encrypted with recipient's public key
9. Share is created on the server
10. Success message is displayed

### AI Analysis

1. User selects "AI Analysis" from the actions menu
2. AIShareDialog opens
3. User selects analysis type (sentiment, themes, etc.)
4. Optionally adds context or specific questions
5. Time-limited share is created (30 minutes)
6. AI processes the encrypted content
7. Results are returned to the user

### Managing Shares

1. User can access share management via:
   - "Manage Shares" in the actions menu
   - "Manage All Shares" button on shared journals page
2. ShareManagement component shows all active shares
3. User can view details and revoke shares
4. Revoked shares immediately lose access

### Viewing Shared Journals

1. User navigates to `/journal/shared` or clicks "Shared" button
2. Can filter by:
   - All shares
   - Shared by me
   - Shared with me
3. Each entry shows:
   - Share status (active/expired)
   - Permissions
   - Share date and expiration
   - For incoming shares: who shared it

## Security Features

1. **End-to-End Encryption**: Content remains encrypted during sharing
2. **Permission Control**: Granular permissions (read/write/share)
3. **Time-Limited Access**: Shares can expire automatically
4. **Revocation**: Shares can be revoked at any time
5. **User Verification**: Only users with encryption set up can receive shares
6. **AI Privacy**: AI shares are time-limited and single-use

## Future Enhancements

1. **Share Analytics**: Track when shares are accessed
2. **Bulk Sharing**: Share multiple entries at once
3. **Share Templates**: Save common sharing configurations
4. **Share Notifications**: Notify users when content is shared with them
5. **Access Logs**: Detailed audit trail of share access
6. **Group Sharing**: Share with predefined groups of users

## Implementation Status

✅ Complete:

- All UI components implemented
- Share dialogs with full functionality
- Share management interface
- Visual indicators on journal cards
- Dedicated shared journals page
- API integration structure
- Actions menu for easy access

⚠️ Requires Backend:

- Actual share creation endpoints
- User lookup by email
- Share revocation endpoints
- Shared journals listing endpoint

The frontend implementation is complete and ready to integrate with the backend API endpoints. The encryption service already has the necessary methods for handling the cryptographic operations.
