#!/usr/bin/env python3
"""
Quick fix for datetime serialization error in Lambda handlers.
Adds mode='json' to all model_dump() calls to ensure datetime objects are serialized properly.
"""

import os
import re
from pathlib import Path


def fix_model_dump_calls(content):
    """Fix model_dump calls to include mode='json' parameter."""
    # Pattern to match model_dump(by_alias=True) without mode parameter
    pattern = r"\.model_dump\(by_alias=True\)"
    replacement = r".model_dump(by_alias=True, mode='json')"

    updated_content = re.sub(pattern, replacement, content)

    # Also handle cases where by_alias might not be present
    pattern2 = r"\.model_dump\(\)"
    replacement2 = r".model_dump(mode='json')"

    updated_content = re.sub(pattern2, replacement2, updated_content)

    return updated_content


def main():
    """Find and fix all handler files with model_dump calls."""
    src_dir = Path(__file__).parent
    if src_dir.name != "src":
        print("Error: This script should be run from the backend/src directory")
        return

    fixed_count = 0

    # Find all Python files
    for py_file in src_dir.rglob("*.py"):
        # Skip this script and __pycache__
        if py_file.name == "fix_datetime_serialization.py" or "__pycache__" in str(py_file):
            continue

        try:
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()

            # Check if file has model_dump calls
            if ".model_dump(" in content:
                original_content = content
                content = fix_model_dump_calls(content)

                if content != original_content:
                    with open(py_file, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"✓ Fixed {py_file}")
                    fixed_count += 1
        except Exception as e:
            print(f"✗ Error processing {py_file}: {e}")

    print(f"\n✅ Fixed {fixed_count} files")

    if fixed_count > 0:
        print("\n⚠️  Next steps:")
        print("1. Rebuild the Docker image")
        print("2. Push to ECR")
        print("3. Update Lambda function")


if __name__ == "__main__":
    main()
