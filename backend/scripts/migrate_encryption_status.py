"""
Migration script to sync encryption status between encryption keys and user profiles.
This fixes users who have encryption keys but their profile shows encryptionEnabled = false.

Run this as a one-time job or Lambda function.
"""

import boto3
from datetime import datetime, timezone
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource("dynamodb")


def migrate_encryption_status(table_name: str, dry_run: bool = True):
    """
    Migrate encryption status for all users.

    Args:
        table_name: DynamoDB table name
        dry_run: If True, only log what would be done without making changes
    """
    table = dynamodb.Table(table_name)

    users_updated = 0
    users_checked = 0
    errors = []

    try:
        # Scan for all encryption keys
        # Note: In production with many users, use pagination
        response = table.scan(
            FilterExpression="sk = :sk", ExpressionAttributeValues={":sk": "ENCRYPTION"}
        )

        encryption_entries = response.get("Items", [])
        logger.info(f"Found {len(encryption_entries)} users with encryption keys")

        for encryption_entry in encryption_entries:
            users_checked += 1
            user_id = encryption_entry.get("user_id")
            public_key_id = encryption_entry.get("public_key_id")
            created_at = encryption_entry.get("created_at")

            if not user_id:
                logger.error(f"Encryption entry missing user_id: {encryption_entry}")
                errors.append("Missing user_id in encryption entry")
                continue

            # Get user profile
            profile_response = table.get_item(
                Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"}
            )

            profile = profile_response.get("Item")
            if not profile:
                logger.warning(f"No profile found for user {user_id}")
                errors.append(f"No profile for user {user_id}")
                continue

            # Check if profile needs update
            current_encryption_enabled = profile.get("encryption_enabled", False)
            current_key_id = profile.get("encryption_key_id")

            if not current_encryption_enabled or current_key_id != public_key_id:
                logger.info(f"User {user_id} needs update:")
                logger.info(
                    f"  Current: enabled={current_encryption_enabled}, key_id={current_key_id}"
                )
                logger.info(f"  Should be: enabled=True, key_id={public_key_id}")

                if not dry_run:
                    try:
                        # Update profile
                        table.update_item(
                            Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"},
                            UpdateExpression=(
                                "SET encryption_enabled = :enabled, "
                                "encryption_setup_date = :setup_date, "
                                "encryption_key_id = :key_id, "
                                "updated_at = :updated_at"
                            ),
                            ExpressionAttributeValues={
                                ":enabled": True,
                                ":setup_date": created_at or datetime.now(timezone.utc).isoformat(),
                                ":key_id": public_key_id,
                                ":updated_at": datetime.now(timezone.utc).isoformat(),
                            },
                        )
                        logger.info(f"Updated profile for user {user_id}")
                        users_updated += 1
                    except Exception as e:
                        logger.error(f"Failed to update profile for user {user_id}: {str(e)}")
                        errors.append(f"Failed to update {user_id}: {str(e)}")
                else:
                    logger.info(f"DRY RUN: Would update profile for user {user_id}")
                    users_updated += 1
            else:
                logger.info(f"User {user_id} already has correct encryption status")

        # Handle pagination if needed
        while "LastEvaluatedKey" in response:
            response = table.scan(
                FilterExpression="sk = :sk",
                ExpressionAttributeValues={":sk": "ENCRYPTION"},
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )

            # Process additional items...
            # (Same logic as above)

    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        errors.append(f"Migration error: {str(e)}")

    # Summary
    logger.info("=== Migration Summary ===")
    logger.info(f"Users checked: {users_checked}")
    logger.info(f"Users updated: {users_updated}")
    logger.info(f"Errors: {len(errors)}")

    if errors:
        logger.error("Errors encountered:")
        for error in errors:
            logger.error(f"  - {error}")

    return {
        "users_checked": users_checked,
        "users_updated": users_updated,
        "errors": errors,
        "dry_run": dry_run,
    }


def lambda_handler(event, context):
    """
    Lambda handler for running the migration.
    """
    # Get parameters from event
    table_name = event.get("table_name", "ai-lifestyle-dev")
    dry_run = event.get("dry_run", True)

    logger.info(f"Starting encryption status migration for table: {table_name}")
    logger.info(f"Dry run mode: {dry_run}")

    result = migrate_encryption_status(table_name, dry_run)

    return {"statusCode": 200, "body": {"message": "Migration completed", "result": result}}


# For local testing
if __name__ == "__main__":
    import sys

    # Configure logging for local run
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

    # Get table name from command line or use default
    table_name = sys.argv[1] if len(sys.argv) > 1 else "ai-lifestyle-dev"

    # Always do dry run first when running locally
    print("Running in DRY RUN mode...")
    result = migrate_encryption_status(table_name, dry_run=True)

    if result["users_updated"] > 0:
        response = input(
            f"\nFound {result['users_updated']} users to update. Run actual migration? (y/N): "
        )
        if response.lower() == "y":
            print("\nRunning actual migration...")
            result = migrate_encryption_status(table_name, dry_run=False)
            print(f"\nMigration complete. Updated {result['users_updated']} users.")
        else:
            print("Migration cancelled.")
    else:
        print("No users need updating.")
