#!/usr/bin/env python3
"""Test login handler imports."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    # Test the full import chain
    from login_user.handler import lambda_handler
    print("SUCCESS: login_user.handler imports correctly")
    
    # Test repository separately
    from login_user.repository import UserRepository
    print("SUCCESS: login_user.repository imports correctly")
    
    # Test if Decimal is available in repository
    from login_user import repository
    if hasattr(repository, 'Decimal'):
        print("SUCCESS: Decimal is available in repository module")
    else:
        print("ERROR: Decimal not found in repository module")
        
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()