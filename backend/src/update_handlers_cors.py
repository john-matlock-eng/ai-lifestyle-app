#!/usr/bin/env python3
"""
Script to update all Lambda handlers to use common response utilities for CORS support.
Run this from the backend/src directory.
"""

import os
import re
from pathlib import Path


def update_handler_file(filepath):
    """Update a handler file to use common response utilities."""
    print(f"Processing {filepath}...")

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if already using response_utils
    if "from common.response_utils import" in content:
        print(f"  ✓ Already updated")
        return False

    # Skip files that don't have Lambda handlers
    if "def lambda_handler" not in content:
        print(f"  ⚠ No lambda_handler found, skipping")
        return False

    original_content = content

    # Add import after the last import from aws_lambda_powertools or after json import
    if "from aws_lambda_powertools" in content:
        # Find the last aws_lambda_powertools import
        import_pattern = (
            r"(from aws_lambda_powertools[^\n]+\n(?:from aws_lambda_powertools[^\n]+\n)*)"
        )
        content = re.sub(
            import_pattern,
            r"\1from common.response_utils import create_response, create_error_response\n",
            content,
            count=1,
        )
    else:
        # Add after json import
        content = re.sub(
            r"(import json\n)",
            r"\1from common.response_utils import create_response, create_error_response\n",
            content,
            count=1,
        )

    # Pattern to match return statements with statusCode
    # This handles multi-line return statements

    # Pattern 1: Error responses with error codes
    error_pattern = r"""return\s*{\s*
        ['"]statusCode['"]\s*:\s*(\d+)\s*,\s*
        ['"]headers['"]\s*:\s*{[^}]+}\s*,\s*
        ['"]body['"]\s*:\s*json\.dumps\s*\(\s*{\s*
        ['"]error['"]\s*:\s*['"]([^'"]+)['"]\s*,\s*
        ['"]message['"]\s*:\s*['"]([^'"]+)['"]\s*,\s*
        ['"]request_id['"]\s*:\s*request_id\s*,\s*
        ['"]timestamp['"]\s*:\s*[^}]+}\s*\)\s*}"""

    def replace_error_response(match):
        status_code = match.group(1)
        error_code = match.group(2)
        message = match.group(3)
        return f"""return create_error_response(
                status_code={status_code},
                error_code='{error_code}',
                message='{message}',
                request_id=request_id
            )"""

    content = re.sub(
        error_pattern, replace_error_response, content, flags=re.VERBOSE | re.MULTILINE | re.DOTALL
    )

    # Pattern 2: Success responses with body
    # Handle cases where body is JSON dumped
    success_pattern_json = r"""return\s*{\s*
        ['"]statusCode['"]\s*:\s*200\s*,\s*
        ['"]headers['"]\s*:\s*{[^}]+}\s*,\s*
        ['"]body['"]\s*:\s*json\.dumps\s*\(([^)]+)\)\s*}"""

    def replace_success_json(match):
        body = match.group(1).strip()
        return f"""return create_response(
                status_code=200,
                body={body},
                request_id=request_id
            )"""

    content = re.sub(
        success_pattern_json,
        replace_success_json,
        content,
        flags=re.VERBOSE | re.MULTILINE | re.DOTALL,
    )

    # Pattern 3: Success responses with model_dump_json
    success_pattern_model = r"""return\s*{\s*
        ['"]statusCode['"]\s*:\s*200\s*,\s*
        ['"]headers['"]\s*:\s*{[^}]+}\s*,\s*
        ['"]body['"]\s*:\s*([^.]+)\.model_dump_json\s*\([^)]*\)\s*}"""

    def replace_success_model(match):
        model_var = match.group(1).strip()
        return f"""return create_response(
                status_code=200,
                body={model_var}.model_dump(by_alias=True, mode='json'),
                request_id=request_id
            )"""

    content = re.sub(
        success_pattern_model,
        replace_success_model,
        content,
        flags=re.VERBOSE | re.MULTILINE | re.DOTALL,
    )

    # Check if we made changes
    if content != original_content:
        # Remove now-unused json import from response building
        # But keep it if it's used elsewhere
        if content.count("json.dumps") == 0 and "json.loads" not in content:
            # Check if json is used in other ways
            json_usage = re.findall(r"\bjson\.\w+", content)
            if not json_usage:
                content = re.sub(r"import json\n", "", content)

        # Write the updated content
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"  ✓ Updated successfully")
        return True
    else:
        print(f"  ⚠ No changes needed")
        return False


def main():
    """Find and update all handler files."""
    # Get the src directory
    src_dir = Path(__file__).parent
    if src_dir.name != "src":
        print("Error: This script should be run from the backend/src directory")
        return

    updated_count = 0
    total_count = 0

    # Find all handler.py files
    for handler_file in src_dir.rglob("*/handler.py"):
        # Skip common directory and __pycache__
        if "common" in handler_file.parts or "__pycache__" in str(handler_file):
            continue

        total_count += 1
        if update_handler_file(handler_file):
            updated_count += 1

    print(f"\n✅ Updated {updated_count} out of {total_count} handler files")

    # Remind about deployment
    if updated_count > 0:
        print("\n⚠️  Don't forget to:")
        print("1. Test the changes locally")
        print("2. Rebuild the Docker image")
        print("3. Push to ECR")
        print("4. Deploy with Terraform")


if __name__ == "__main__":
    main()
