#!/usr/bin/env python3
"""
Script to fix common linting issues in the backend codebase.
"""

import os
import re
import sys
from pathlib import Path

def fix_unused_imports(file_path):
    """Remove common unused imports based on flake8 output."""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Common unused imports to remove
    unused_patterns = [
        (r'^from datetime import.*timezone.*$', 'timezone'),
        (r'^import uuid$', None),
        (r'^from typing import Optional$', None),
        (r'^from boto3.dynamodb.conditions import Key$', None),
        (r'^from boto3.dynamodb.conditions import Attr$', None),
        (r'^import json$', None),
        (r'^from decimal import Decimal$', None),
    ]
    
    modified = False
    new_lines = []
    
    for line in lines:
        should_keep = True
        for pattern, specific_import in unused_patterns:
            if re.match(pattern, line.strip()):
                # Check if it's a multi-import line
                if specific_import and ', ' in line:
                    # Remove only the specific import
                    imports = line.strip().split('import ')[1].split(', ')
                    remaining = [imp for imp in imports if imp != specific_import]
                    if remaining:
                        new_line = line.split('import')[0] + 'import ' + ', '.join(remaining) + '\n'
                        new_lines.append(new_line)
                        modified = True
                    else:
                        should_keep = False
                        modified = True
                else:
                    should_keep = False
                    modified = True
                break
        
        if should_keep:
            new_lines.append(line)
    
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        return True
    return False

def fix_line_length(file_path):
    """Fix lines that are too long by splitting them."""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    modified = False
    new_lines = []
    
    for line in lines:
        if len(line) > 100 and not line.strip().startswith('#'):
            # Handle specific patterns
            if 'UpdateExpression=' in line:
                # Split UpdateExpression
                indent = len(line) - len(line.lstrip())
                new_lines.append(line.rstrip() + '\n')
            elif 'f"' in line or "f'" in line:
                # Split f-strings
                if len(line) > 100:
                    # Find a good split point
                    split_point = line.rfind(', ', 0, 100)
                    if split_point > 0:
                        indent = len(line) - len(line.lstrip())
                        part1 = line[:split_point + 1] + '\n'
                        part2 = ' ' * (indent + 4) + line[split_point + 2:]
                        new_lines.append(part1)
                        new_lines.append(part2)
                        modified = True
                    else:
                        new_lines.append(line)
                else:
                    new_lines.append(line)
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
    
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        return True
    return False

def main():
    """Main function to process all Python files."""
    backend_dir = Path(__file__).parent
    src_dir = backend_dir / 'src'
    tests_dir = backend_dir / 'tests'
    scripts_dir = backend_dir / 'scripts'
    
    files_fixed = 0
    
    for directory in [src_dir, tests_dir, scripts_dir]:
        if not directory.exists():
            continue
            
        for py_file in directory.rglob('*.py'):
            if py_file.name == 'fix_linting.py':
                continue
                
            fixed_imports = fix_unused_imports(py_file)
            fixed_length = fix_line_length(py_file)
            
            if fixed_imports or fixed_length:
                print(f"Fixed: {py_file.relative_to(backend_dir)}")
                files_fixed += 1
    
    print(f"\nTotal files fixed: {files_fixed}")

if __name__ == "__main__":
    main()