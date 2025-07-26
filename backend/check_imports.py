#!/usr/bin/env python3
"""
Script to check for undefined names and missing imports in Python files.
"""

import ast
import os
import sys
from pathlib import Path
from typing import Set, List, Tuple

class ImportChecker(ast.NodeVisitor):
    """AST visitor to check for undefined names."""
    
    def __init__(self):
        self.imports = set()
        self.from_imports = {}
        self.undefined = set()
        self.defined = set()
        self.builtin_names = set(dir(__builtins__))
        
    def visit_Import(self, node):
        for alias in node.names:
            name = alias.asname if alias.asname else alias.name
            self.imports.add(name.split('.')[0])
            self.defined.add(name)
        self.generic_visit(node)
        
    def visit_ImportFrom(self, node):
        if node.module:
            for alias in node.names:
                if alias.name == '*':
                    # Can't track star imports
                    self.imports.add('*')
                else:
                    name = alias.asname if alias.asname else alias.name
                    self.defined.add(name)
                    if node.module not in self.from_imports:
                        self.from_imports[node.module] = set()
                    self.from_imports[node.module].add(alias.name)
        self.generic_visit(node)
        
    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            if (node.id not in self.defined and 
                node.id not in self.builtin_names and
                node.id not in ['self', 'cls', '__name__', '__file__']):
                self.undefined.add(node.id)
        elif isinstance(node.ctx, ast.Store):
            self.defined.add(node.id)
        self.generic_visit(node)
        
    def visit_FunctionDef(self, node):
        self.defined.add(node.name)
        # Add function arguments to defined names
        for arg in node.args.args:
            self.defined.add(arg.arg)
        self.generic_visit(node)
        
    def visit_ClassDef(self, node):
        self.defined.add(node.name)
        self.generic_visit(node)
        
    def visit_For(self, node):
        if isinstance(node.target, ast.Name):
            self.defined.add(node.target.id)
        self.generic_visit(node)
        
    def visit_ExceptHandler(self, node):
        if node.name:
            self.defined.add(node.name)
        self.generic_visit(node)

def check_file(file_path: Path) -> List[str]:
    """Check a single Python file for undefined names."""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        tree = ast.parse(content, filename=str(file_path))
        checker = ImportChecker()
        checker.visit(tree)
        
        # Check for common missing imports
        common_missing = {
            'Optional': 'from typing import Optional',
            'List': 'from typing import List',
            'Dict': 'from typing import Dict',
            'Any': 'from typing import Any',
            'Union': 'from typing import Union',
            'Tuple': 'from typing import Tuple',
            'Set': 'from typing import Set',
            'Callable': 'from typing import Callable',
            'datetime': 'from datetime import datetime',
            'timezone': 'from datetime import timezone',
            'timedelta': 'from datetime import timedelta',
            'json': 'import json',
            'os': 'import os',
            'sys': 'import sys',
            'uuid': 'import uuid',
            'Decimal': 'from decimal import Decimal',
            'BaseModel': 'from pydantic import BaseModel',
            'Field': 'from pydantic import Field',
            'ValidationError': 'from pydantic import ValidationError',
        }
        
        for name in checker.undefined:
            if name in common_missing:
                issues.append(f"{file_path}: Undefined name '{name}' - add: {common_missing[name]}")
            else:
                issues.append(f"{file_path}: Undefined name '{name}'")
                
    except SyntaxError as e:
        issues.append(f"{file_path}: SyntaxError: {e}")
    except Exception as e:
        issues.append(f"{file_path}: Error: {e}")
        
    return issues

def main():
    """Check all Python files for import issues."""
    backend_dir = Path(__file__).parent
    src_dir = backend_dir / 'src'
    tests_dir = backend_dir / 'tests'
    
    all_issues = []
    files_checked = 0
    
    for directory in [src_dir, tests_dir]:
        if not directory.exists():
            continue
            
        for py_file in directory.rglob('*.py'):
            if py_file.name == 'check_imports.py':
                continue
                
            issues = check_file(py_file)
            if issues:
                all_issues.extend(issues)
            files_checked += 1
    
    if all_issues:
        print(f"Found {len(all_issues)} issues in {files_checked} files:\n")
        for issue in sorted(all_issues):
            print(issue)
        return 1
    else:
        print(f"✓ No undefined names found in {files_checked} files")
        return 0

if __name__ == "__main__":
    sys.exit(main())