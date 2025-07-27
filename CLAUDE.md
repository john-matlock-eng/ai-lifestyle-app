# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Lifestyle App - A privacy-first wellness platform with end-to-end encryption, featuring journal entries, goal tracking, AI analysis, and future health/finance modules.

**Current Status**: Sprint 2 - Authentication complete, working on Core Encryption Service

## Essential Commands

### Backend Development
```bash
# Navigate to backend
cd backend

# Run tests
make test

# Format code (MUST run before commits)
make fmt

# Lint code
make lint

# Run a single test
pytest tests/path/to/test.py -v

# Build Lambda containers
make build-lambda
```

### Frontend Development
```bash
# Navigate to frontend
cd frontend

# Start development server
npm run dev

# Run tests
npm run test

# Type checking (MUST pass before commits)
npm run type-check

# Lint code (MUST pass before commits)
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Run a single test
npm run test -- path/to/test.spec.ts
```

### Full Stack
```bash
# Start local development with Docker
docker-compose up

# Run all tests
make test  # from root directory
```

## Critical Architecture Rules

### 1. OpenAPI Contract is LAW
The contract at `/contract/openapi.yaml` is the single source of truth for ALL API definitions:
- Backend and frontend MUST match schemas exactly
- Never add fields or validation not in the contract
- If blocked by contract, update contract first
- Validate changes: `npx @apidevtools/swagger-cli validate contract/openapi.yaml`
- Generate frontend types: `npx openapi-typescript contract/openapi.yaml --output frontend/src/api/generated.ts`

### 2. Backend Architecture
- **Pattern**: One Lambda function per endpoint
- **Structure**: `/backend/src/{operationId}/` with handler.py, service.py, repository.py, models.py
- **Database**: DynamoDB single-table design
- **Key Patterns**:
  - User: `PK=USER#{user_id}`, `SK=PROFILE`
  - Goal: `PK=USER#{user_id}`, `SK=GOAL#{goal_id}`
  - Journal: `PK=USER#{user_id}`, `SK=JOURNAL#{entry_id}`
- **Testing**: Use pytest with moto for AWS mocking
- **Error Handling**: Use specific error types from `*_common/errors.py`

### 3. Frontend Architecture
- **Stack**: React 18 + TypeScript + Vite + TailwindCSS
- **State**: TanStack Query (React Query) - NOT Redux for server state
- **Structure**: Feature-based organization in `/frontend/src/features/`
- **Types**: ALL types from `/frontend/src/types/` - never redefine locally
- **API**: Use generated types from contract
- **Forms**: React Hook Form + Zod validation
- **Encryption**: Web Crypto API via useEncryption hook

### 4. No Manual Deployments
- ALL deployments through GitHub Actions CI/CD
- Never run `terraform apply`, `docker push`, or manual AWS commands
- Commit and push to trigger deployments

## Development Workflow

### Adding New Features
1. Update OpenAPI contract first
2. Implement backend Lambda function
3. Generate frontend types
4. Implement frontend components
5. Write tests (unit + integration)
6. Run quality checks before commit:
   - Backend: `make fmt && make lint && make test`
   - Frontend: `npm run format && npm run lint && npm run type-check && npm run test`

### Common Pitfalls to Avoid
1. **Type Mismatches**: Always use types from `src/types/`, not local definitions
2. **API Contract Violations**: Follow OpenAPI spec exactly
3. **Missing Encryption**: All sensitive data must use Core Encryption Service
4. **State Management**: Use React Query for server state, not useState
5. **Date Handling**: All dates are ISO strings in API
6. **Testing Warnings**: "Template validation failed" errors in tests are EXPECTED - they test error handling

## Key Design Decisions

### Privacy & Security
- Zero-knowledge architecture - server never sees unencrypted data
- End-to-end encryption by default
- Client-side encryption with Web Crypto API
- Each module has isolated encryption context

### Current Sprint Focus
- Implementing Core Encryption Service (see `/docs/adr/ADR-007-core-encryption-service.md`)
- Migrating journal encryption to core service
- Finalizing Goal System design

### Testing Requirements
- Backend: pytest with >80% coverage
- Frontend: Vitest with React Testing Library
- Integration tests for all user journeys
- Accessibility testing (keyboard nav, ARIA, screen readers)

## Important Documentation
- **Architecture Decisions**: `/docs/adr/`
- **Feature Specs**: `/docs/features/`
- **Backend Patterns**: `/backend/instructions/playbooks/`
- **Frontend Guide**: `/frontend/CLAUDE.md`
- **Sprint Planning**: `/pm/active-sprint.md`

## Environment Setup
- DynamoDB Local: port 8000
- Lambda API: port 9000  
- Frontend dev: port 3000
- DynamoDB Admin: port 8001

## Quick Debugging
- Backend logs: `make logs FUNCTION=create-goal ENV=dev`
- Frontend: React Query DevTools in browser
- API validation: Check against OpenAPI contract first
- Type errors: Verify using correct imports from `src/types/`