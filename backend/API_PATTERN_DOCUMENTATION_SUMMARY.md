# API Pattern Documentation Update Summary

## What Was Created

I've created comprehensive documentation for LLMs to understand the API implementation pattern used in this codebase. This addresses the critical architectural pattern that differs from typical serverless applications.

## New Documentation Files

### 1. `/backend/instructions/playbooks/single-lambda-api-pattern.md`
- **Purpose**: Detailed explanation of the single Lambda architecture
- **Contents**: 
  - Architecture diagram
  - Step-by-step implementation guide
  - CI/CD integration
  - Common patterns and best practices
- **Use Case**: Primary reference for understanding the architecture

### 2. `/backend/instructions/playbooks/api-pattern-llm-reference.md`
- **Purpose**: Quick reference guide for LLMs
- **Contents**:
  - Concise overview of the pattern
  - Quick implementation steps
  - File locations and purposes
  - Standard patterns
- **Use Case**: Quick lookup during implementation

### 3. `/backend/instructions/playbooks/common-mistakes-llm-guide.md`
- **Purpose**: Prevent common architectural mistakes
- **Contents**:
  - List of wrong approaches with corrections
  - Critical mistakes to avoid
  - Correct patterns to follow
- **Use Case**: Error prevention guide

## Key Architecture Points Documented

1. **Single Lambda Pattern**: One Lambda function (`api-handler`) serves all endpoints
2. **Router Pattern**: `main.py` acts as the central router
3. **Module Structure**: Each endpoint is a module in `src/`
4. **CI/CD Integration**: GitHub Actions handles all deployments automatically
5. **Infrastructure Pattern**: All routes configured in single API Gateway module

## Integration with Existing Documentation

Updated `/backend/instructions/instructions.md` to include:
- New "CRITICAL: Architecture Pattern" section
- Links to all three new playbooks
- Reference to GitHub Actions workflow

## How to Reference in LLM Instructions

Add this to any LLM system prompt working on this codebase:

```
CRITICAL: This application uses a Single Lambda Pattern. Before implementing any API endpoints:
1. Read: backend/instructions/playbooks/api-pattern-llm-reference.md
2. If unclear, consult: backend/instructions/playbooks/single-lambda-api-pattern.md
3. To avoid mistakes: backend/instructions/playbooks/common-mistakes-llm-guide.md

Key points:
- ONE Lambda function handles ALL routes via main.py router
- NEVER create separate Lambda functions
- ALL routes must be added to main.py
- GitHub Actions handles deployment automatically
```

## Benefits

1. **Consistency**: All LLMs will follow the same pattern
2. **Error Prevention**: Common mistakes are documented
3. **Speed**: Quick reference reduces implementation time
4. **Accuracy**: Reflects actual architecture, not theoretical patterns

## Next Steps

1. Reference these files in all backend-related LLM instructions
2. Update any existing agent instructions to include these references
3. Use for onboarding new LLMs or agents to the project

---

**Created by**: Backend Agent  
**Date**: 2025-01-07  
**Status**: Documentation complete and integrated
