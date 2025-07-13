# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Frontend Development
```bash
# Development
npm run dev              # Start development server (Vite)
npm run build            # Build for production (TypeScript + Vite)
npm run preview          # Preview production build

# Testing
npm test                 # Run tests (Vitest)
npm run test:ui          # Run tests with UI

# Code Quality
npm run lint             # ESLint
npm run type-check       # TypeScript type checking
npm run format           # Prettier formatting

# Pre-push Checklist (run these before pushing code)
npm run lint             # Check for linting errors
npm run type-check       # Check for TypeScript errors
npm run build            # Ensure build succeeds
npm test                 # Run all tests
```

### Backend Development
```bash
# Setup and deployment (from backend/ directory)
make setup               # Set up development environment
make deploy ENV=dev      # Deploy to development
make build-lambda        # Build and push Lambda containers

# Testing and validation
make test                # Run pytest
make fmt                 # Format with black/isort
make lint                # Lint with pylint/flake8
make validate            # Full validation pipeline

# Development
make logs FUNCTION=api-handler  # Tail Lambda logs
make api-url             # Get API Gateway URL
```

#### Backend Lambda Functions
Each API endpoint has its own Lambda function in `backend/src/`:
- **Journal Operations**:
  - `create_journal_entry` → `POST /journal`
  - `list_journal_entries` → `GET /journal`
  - `get_journal_entry` → `GET /journal/{entryId}`
  - `update_journal_entry` → `PUT /journal/{entryId}`
  - `delete_journal_entry` → `DELETE /journal/{entryId}`
  - `get_journal_stats` → `GET /journal/stats`
  - **Common module**: `journal_common/` contains shared models and types
- **Goal Operations**:
  - `create_goal` → `POST /goals`
  - `list_goals` → `GET /goals`
  - `get_goal` → `GET /goals/{goalId}`
  - `update_goal` → `PUT /goals/{goalId}`
  - `archive_goal` → `DELETE /goals/{goalId}`
  - **Common module**: `goals_common/` contains shared models and types

**IMPORTANT**: When creating new services, ensure the common module's `__init__.py` exports all models from `models.py`

#### Adding New API Routes
**IMPORTANT**: When creating new API endpoints, you must add them to BOTH places:
1. **Lambda handler** in `backend/src/` directory
2. **API Gateway routes** in `backend/terraform/main.tf` under the `routes` section

Example for adding a new journal route:
```hcl
# In backend/terraform/main.tf
"POST /journal/templates" = {
  authorization_type = "JWT"  # or "NONE" for public endpoints
}
```

#### Adding New Services
When creating a new service (like journal, wellness, etc.):
1. Create Lambda handlers in `backend/src/`
2. Add routes to `backend/terraform/main.tf`
3. Create service infrastructure module in `backend/terraform/services/<service>/`
4. Include the service module in main terraform:
   ```hcl
   module "journal_service" {
     source = "./services/journal"
     app_name = "ai-lifestyle"
     environment = var.environment
     aws_region = var.aws_region
   }
   ```
5. Add necessary environment variables and IAM policies to Lambda configuration

### Full Stack Development
```bash
# From project root
make setup               # Set up both frontend and backend
make test                # Run all tests
make dev                 # Start full stack with docker-compose
```

## Architecture Overview

### Application Structure
This is a privacy-first wellness platform with:
- **Frontend**: React 18 + TypeScript + Vite with Material-UI components
- **Backend**: Python Lambda functions with FastAPI handlers
- **Database**: DynamoDB with single-table design
- **Auth**: AWS Cognito with 2FA support
- **Infrastructure**: Terraform-managed AWS resources

### Key Architectural Patterns

#### Lambda Function Organization
Each backend feature is a separate Lambda function in `backend/src/`:
- Functions follow the pattern: `{action}_{resource}/handler.py`
- Shared code lives in `goals_common/` module
- Each function has its own Dockerfile for containerized deployment

#### Frontend Feature Organization
Features are organized by domain in `frontend/src/features/`:
- `auth/` - Authentication with Cognito integration
- `goals/` - Enhanced goal system (5 patterns: recurring, milestone, target, streak, limit)
- `journal/` - Rich text journaling with encryption
- Each feature contains: `components/`, `hooks/`, `services/`, `types/`

#### State Management
- **Global State**: Redux Toolkit for app-wide state
- **Server State**: TanStack Query for API data
- **Form State**: React Hook Form with Zod validation
- **Context**: React Context for auth and theme

#### Type Safety
- Shared types between frontend/backend via OpenAPI contract
- Backend uses Pydantic models with CamelCase serialization
- Frontend uses Zod schemas for runtime validation
- Type definitions in `frontend/src/types/` and `backend/src/goals_common/models.py`

### Core Encryption System
The app implements zero-knowledge encryption:
- Client-side encryption before data leaves the browser
- Symmetric encryption (AES-256-GCM) for data
- Asymmetric encryption (RSA-4096) for key sharing
- PBKDF2/Argon2id for key derivation
- Keys stored in IndexedDB, never sent to server

### Goal System Design
Enhanced goal system supports 5 patterns:
1. **Recurring**: "Walk 10k steps daily"
2. **Milestone**: "Write 50k words total"
3. **Target**: "Lose 20 lbs by June"
4. **Streak**: "Meditate 100 days straight"
5. **Limit**: "Screen time < 2 hours"

### Testing Strategy
- **Frontend**: Vitest + Testing Library + MSW for API mocking
- **Backend**: pytest with fixtures for DynamoDB testing
- **Integration**: End-to-end tests for critical user journeys
- **Contract**: OpenAPI validation between frontend/backend

### Deployment Pipeline
- **Development**: Auto-deploy to dev environment on PR
- **Production**: Manual deployment with approval
- **Infrastructure**: Terraform manages all AWS resources
- **Containers**: Lambda functions deployed as container images

#### Deploying New API Routes
After adding new routes to `backend/terraform/main.tf`:
1. Commit and push changes
2. GitHub Actions will run Terraform plan
3. Review the plan to ensure routes are being added
4. Terraform apply will update API Gateway with new routes
5. Lambda functions must be deployed separately via container builds

Note: API Gateway routes can be deployed before the Lambda handlers exist, but will return 5xx errors until the handlers are implemented.

## Important Development Notes

### Authentication Flow
- Registration requires email verification via Cognito
- Login supports optional 2FA with TOTP
- Token refresh handled automatically in AuthContext
- Session warnings appear 5 minutes before expiry

### API Integration
- All API calls go through `frontend/src/api/client.ts`
- Error handling includes retry logic and user feedback
- Bearer token authentication with automatic refresh
- OpenAPI contract at `contract/openapi.yaml` is source of truth

#### API Route Patterns
- **IMPORTANT**: API routes do NOT include `/v1` prefix - this is handled by the base URL
- Use simple resource paths: `/goals`, `/journal`, `/auth/login`, etc.
- Examples of correct patterns:
  - `GET /goals` - List goals
  - `POST /goals` - Create goal
  - `GET /goals/{id}` - Get specific goal
  - `PUT /goals/{id}` - Update goal
  - `DELETE /goals/{id}` - Delete goal
  - `GET /journal` - List journal entries
  - `POST /journal` - Create journal entry
  - `GET /journal/stats` - Get journal statistics

### Encryption Patterns
- Encrypt data before sending to server in service layers
- Decrypt data after receiving from server
- Use `useEncryption` hook for encryption state management
- Never store unencrypted sensitive data

### Database Patterns
- Single DynamoDB table with composite keys
- PK pattern: `USER#{user_id}`, SK patterns vary by entity type
- Use GSIs for different access patterns
- Repository pattern abstracts DynamoDB operations

### Code Style
- Frontend: ESLint + Prettier with strict TypeScript
- Backend: Black + isort + pylint with 100-char line length
- Use absolute imports and barrel exports (`index.ts` files)
- Component files use PascalCase, utility files use camelCase

## Journal Feature Specifics

### Journal Search Implementation
The journal search feature uses browser's IndexedDB for local storage with encryption:
- Full-text search across journal entries
- Tag-based filtering
- Journal type filtering
- Timeframe/date range filtering
- Search results are decrypted on-the-fly

### Emotion Selector Component
The `EmotionSelector` component provides two interfaces:
1. **Emotion Wheel**: Interactive circular visualization with zoom/pan
2. **Drill-Down List**: Hierarchical list interface

Key features:
- **Progressive Reveal Mode**: Guides users through 3-step selection (Core → Secondary → Tertiary)
- **Hierarchical Selection**: Automatically selects parent emotions when selecting children
- **Multi-selection Support**: Can select multiple emotions across hierarchy
- **Zoom/Pan**: Mouse wheel zoom (0.8x-4x), click-drag panning when zoomed
- **Responsive Design**: Adapts to container size with minimum 400px

#### Common Issues and Solutions
- **Runtime Error "e.some is not a function"**: Ensure `selectedEmotions` prop is always an array
- **TypeScript Errors**: Add type annotations to array methods: `.filter((id: string) => ...)`
- **CSS Issues**: Use `@emotion/react` for styled components, avoid inline styles for complex styling

### Rich Text Editor (TipTap)
The journal uses TipTap editor with:
- Markdown support with live preview
- Bubble menu for text formatting (appears on selection)
- Floating menu for block insertion
- Character count extension
- Task lists, code blocks, quotes support

Key configuration:
- Bubble/Floating menus disabled by default to prevent DOM issues
- Toolbar always visible for consistent UX
- Focus management handled properly to prevent selection loss

### Template System
Journal templates use enhanced template structure:
```typescript
interface EnhancedTemplate {
  id: string;
  name: string;
  version: number;
  sections: SectionDefinition[];
}
```

Templates support:
- Progressive sections with AI suggestions
- Privacy levels per section (private, ai, shared, public)
- Draft management with auto-save
- Template validation with Zod schemas

### Development Workflow Tips
1. **Always run the quality check trio**:
   ```bash
   npm run lint && npm test -- --run && npm run build
   ```
2. **Common test warnings to ignore**:
   - Template validation errors in tests are intentional (testing invalid templates)
   - Skipped tests are by design (e.g., auth tests requiring Cognito setup)

3. **When modifying emotion components**:
   - Test with both progressive reveal on/off
   - Verify touch events work on mobile
   - Check zoom boundaries don't break UI

4. **Performance considerations**:
   - Emotion wheel SVG can be large - limit re-renders
   - Use `useCallback` for event handlers in frequently updated components
   - Batch DOM updates when possible