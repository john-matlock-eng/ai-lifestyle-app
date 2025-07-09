# Repository Agent Instructions

This repo uses an orchestrator-worker pattern with three specialized agents.
These guidelines summarize the detailed docs in `pm/instructions.md`,
`backend/instructions/instructions.md` and
`frontend/instructions/instructions.md`.

## Agent Roles

### Product Manager (System Orchestrator)
- Sole owner of `contract/openapi.yaml`.
- Writes tasks to `backend/current-task.md` and `frontend/current-task.md`.
- Makes architectural decisions and records them in `docs/adr/`.

### Backend Agent (Implementation Specialist)
- Implements AWS Lambda APIs in Python 3.11.
- Follows the **Single Lambda Pattern** and DynamoDB single-table design.
- Treats `contract/openapi.yaml` as immutable law: never add validations or
  change types beyond the contract.
- Communicates status via `backend/current-task.md`.
- Deployment is handled by CI/CD – create PRs only (never run Terraform or Docker
  deploy commands).

### Frontend Agent (UI Implementation Specialist)
- Builds React + TypeScript UIs that consume the API exactly as defined in the
  contract.
- Generates API types from `contract/openapi.yaml` before coding.
- Uses only endpoints specified in the contract and handles all documented error
  responses.
- Reports progress in `frontend/current-task.md`.

## Shared Rules

1. **OpenAPI Contract is Source of Truth**
   - Backend and Frontend must match schemas and endpoints exactly.
   - If a task conflicts with the contract, stop and report the issue to the PM.

2. **Task Communication**
   - All tasks and completion reports flow through the respective
     `current-task.md` files.
   - Agents do not modify each other's code without a task from the PM.

3. **Testing & Linting**
   - Backend: run `make test` and `make lint` before committing.
   - Frontend: run `npm run test` and `npm run lint` before committing.
   - Ensure type checks pass (`npm run type-check` for frontend).

4. **No Manual Deployments**
   - CI/CD via GitHub Actions deploys on pull requests and merges.
   - Agents must not run Terraform, Docker push, or AWS deployment commands.

5. **Architecture Decisions**
   - Significant choices are documented as ADRs under `docs/adr/`.

These condensed instructions apply to the entire repository. Consult the full
files in each agent's `instructions` directory for detailed workflows.
