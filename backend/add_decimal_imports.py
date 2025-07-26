#!/usr/bin/env python3
"""
Add missing Decimal imports to files that use it.
"""

import os
import re
from pathlib import Path

def needs_decimal_import(file_path):
    """Check if file uses Decimal but doesn't import it."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if Decimal is used
    if re.search(r'\bDecimal\b', content):
        # Check if it's already imported
        if 'from decimal import Decimal' not in content:
            return True
    return False

def add_decimal_import(file_path):
    """Add Decimal import to a file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find where to insert the import
    import_index = 0
    has_datetime_import = False
    
    for i, line in enumerate(lines):
        if 'from datetime import' in line:
            has_datetime_import = True
            import_index = i + 1
            break
        elif line.startswith('import ') or line.startswith('from '):
            import_index = i + 1
    
    # If we found datetime import, add after it
    if has_datetime_import:
        lines.insert(import_index, 'from decimal import Decimal\n')
    else:
        # Otherwise add at the beginning of imports
        lines.insert(import_index, 'from decimal import Decimal\n')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    return True

def main():
    """Check and fix Decimal imports."""
    backend_dir = Path(__file__).parent
    src_dir = backend_dir / 'src'
    
    files_fixed = 0
    
    for py_file in src_dir.rglob('*.py'):
        if py_file.name in ['add_decimal_imports.py']:
            continue
            
        if needs_decimal_import(py_file):
            print(f"Adding Decimal import to: {py_file.relative_to(backend_dir)}")
            add_decimal_import(py_file)
            files_fixed += 1
    
    print(f"\nTotal files fixed: {files_fixed}")

if __name__ == "__main__":
    main()