#!/usr/bin/env python3
"""
Test that critical Lambda handlers can be imported without errors.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Test importing critical handlers."""
    handlers_to_test = [
        ('register_user.handler', 'lambda_handler'),
        ('get_user_by_id.handler', 'lambda_handler'),
        ('get_user_profile.handler', 'lambda_handler'),
        ('login_user.handler', 'lambda_handler'),
        ('create_journal_entry.handler', 'lambda_handler'),
        ('create_goal.handler', 'lambda_handler'),
    ]
    
    failed = []
    
    for module_path, handler_name in handlers_to_test:
        try:
            module = __import__(module_path, fromlist=[handler_name])
            handler = getattr(module, handler_name)
            print(f"OK: {module_path}")
        except Exception as e:
            print(f"FAIL: {module_path}: {type(e).__name__}: {str(e)}")
            failed.append((module_path, str(e)))
    
    if failed:
        print(f"\n{len(failed)} handlers failed to import:")
        for module, error in failed:
            print(f"  - {module}: {error}")
        return 1
    else:
        print(f"\nAll {len(handlers_to_test)} handlers imported successfully!")
        return 0

if __name__ == "__main__":
    exit(test_imports())