# Backend Scripts

This directory contains utility scripts for backend operations.

## migrate_encryption_status.py

This script fixes the encryption status sync issue where users have encryption keys in the database but their profile shows `encryptionEnabled = false`.

### Usage

#### Local Testing
```bash
# Dry run (default) - shows what would be changed
python migrate_encryption_status.py [table-name]

# Example for dev environment
python migrate_encryption_status.py ai-lifestyle-dev
```

#### As Lambda Function
Deploy this script as a Lambda function and invoke it with:
```json
{
  "table_name": "ai-lifestyle-dev",
  "dry_run": true
}
```

Set `dry_run: false` to actually perform the migration.

### What it does

1. Scans the DynamoDB table for all encryption keys (SK='ENCRYPTION')
2. For each user with encryption keys:
   - Checks their profile (SK='PROFILE')
   - If `encryption_enabled` is false or `encryption_key_id` doesn't match
   - Updates the profile to set correct encryption status

### Safety Features

- Always runs in dry-run mode first
- Logs all changes
- Tracks errors for manual review
- Interactive confirmation when run locally
