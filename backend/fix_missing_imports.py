#!/usr/bin/env python3
"""
Script to fix missing imports based on undefined names.
"""

import os
import re
from pathlib import Path

def add_json_import(file_path):
    """Add missing json import to files that use it."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if json is used but not imported
    if 'json.' in content or 'json(' in content:
        if 'import json' not in content:
            # Find the right place to add the import
            lines = content.split('\n')
            import_index = 0
            
            # Find where to insert import
            for i, line in enumerate(lines):
                if line.startswith('"""') and i > 0:
                    # After module docstring
                    for j in range(i+1, len(lines)):
                        if lines[j].strip() == '"""':
                            import_index = j + 1
                            break
                    break
                elif line.strip() and not line.startswith('#'):
                    # Before first non-comment line
                    import_index = i
                    break
            
            # Add import
            lines.insert(import_index, '')
            lines.insert(import_index + 1, 'import json')
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
            return True
    return False

def add_missing_typing_imports(file_path):
    """Add missing typing imports based on usage."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    typing_imports_needed = []
    
    # Check for typing usage
    typing_types = ['Optional', 'List', 'Dict', 'Any', 'Union', 'Tuple', 'Set', 'Callable']
    for t in typing_types:
        # Look for usage in type hints
        if re.search(rf'\b{t}\[', content) or re.search(rf': {t}\b', content):
            if f'from typing import' not in content or t not in content.split('from typing import')[1].split('\n')[0]:
                typing_imports_needed.append(t)
    
    if typing_imports_needed:
        # Check if there's already a typing import
        existing_match = re.search(r'from typing import (.+)', content)
        if existing_match:
            # Add to existing import
            existing_imports = [x.strip() for x in existing_match.group(1).split(',')]
            all_imports = sorted(set(existing_imports + typing_imports_needed))
            new_import = f"from typing import {', '.join(all_imports)}"
            content = content.replace(existing_match.group(0), new_import)
        else:
            # Add new import
            lines = content.split('\n')
            import_index = 0
            
            # Find where to insert import
            for i, line in enumerate(lines):
                if line.startswith('from ') or line.startswith('import '):
                    import_index = i
                    break
            
            lines.insert(import_index, f"from typing import {', '.join(sorted(typing_imports_needed))}")
            content = '\n'.join(lines)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def fix_boto3_imports(file_path):
    """Fix missing boto3.dynamodb.conditions imports."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    
    # Check for Key usage
    if re.search(r'\bKey\(', content) and 'from boto3.dynamodb.conditions import' not in content:
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'import boto3' in line:
                lines.insert(i + 1, 'from boto3.dynamodb.conditions import Key')
                modified = True
                break
    
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
    
    return modified

def main():
    """Fix missing imports in all Python files."""
    backend_dir = Path(__file__).parent
    src_dir = backend_dir / 'src'
    tests_dir = backend_dir / 'tests'
    
    files_fixed = 0
    
    for directory in [src_dir, tests_dir]:
        if not directory.exists():
            continue
            
        for py_file in directory.rglob('*.py'):
            if py_file.name in ['fix_missing_imports.py', 'check_imports.py', 'fix_linting.py']:
                continue
            
            fixed = False
            
            # Skip syntax error files
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    compile(f.read(), py_file, 'exec')
            except SyntaxError:
                print(f"Skipping {py_file} due to syntax error")
                continue
            
            # Fix various imports
            if add_json_import(py_file):
                fixed = True
            
            if add_missing_typing_imports(py_file):
                fixed = True
                
            if fix_boto3_imports(py_file):
                fixed = True
            
            if fixed:
                print(f"Fixed imports in: {py_file.relative_to(backend_dir)}")
                files_fixed += 1
    
    print(f"\nTotal files fixed: {files_fixed}")

if __name__ == "__main__":
    main()