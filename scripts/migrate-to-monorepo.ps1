# scripts/migrate-to-monorepo.ps1
# Migrate current structure to monorepo layout

$ErrorActionPreference = "Stop"

Write-Host "Migrating to monorepo structure..." -ForegroundColor Yellow

# Create new directory structure
Write-Host "Creating new directories..." -ForegroundColor Yellow
$directories = @(
    "backend\src",
    "backend\tests", 
    "backend\terraform",
    "backend\scripts",
    "frontend\src\components",
    "frontend\src\pages",
    "frontend\src\services",
    "frontend\public",
    "shared\types",
    "shared\constants",
    "shared\schemas",
    "docs\api",
    "docs\architecture",
    "docs\deployment",
    "scripts"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# Move backend files
Write-Host "Moving backend files..." -ForegroundColor Yellow

# Python source files
if (Test-Path "src") {
    Get-ChildItem "src\*" | Move-Item -Destination "backend\src\" -Force
    Remove-Item "src" -Recurse -Force -ErrorAction SilentlyContinue
}

# Tests
if (Test-Path "tests") {
    Get-ChildItem "tests\*" | Move-Item -Destination "backend\tests\" -Force
    Remove-Item "tests" -Recurse -Force -ErrorAction SilentlyContinue
}

# Terraform
if (Test-Path "terraform") {
    Get-ChildItem "terraform\*" | Move-Item -Destination "backend\terraform\" -Force
    Remove-Item "terraform" -Recurse -Force -ErrorAction SilentlyContinue
}

# Backend-specific files
$backendFiles = @(
    "requirements*.txt",
    "Dockerfile.*",
    "pyproject.toml",
    "setup.cfg"
)

foreach ($pattern in $backendFiles) {
    Get-ChildItem $pattern -ErrorAction SilentlyContinue | Move-Item -Destination "backend\" -Force
}

# Scripts - distribute appropriately
if (Test-Path "scripts") {
    if (Test-Path "scripts\deploy-lambda.sh") {
        Move-Item "scripts\deploy-lambda.sh" -Destination "backend\scripts\" -Force
    }
    # Keep setup and local-dev scripts at root
    @("local-dev.sh", "setup-dev.*") | ForEach-Object {
        if (Test-Path "scripts\$_") {
            # Already in the right place
        }
    }
}

# Create backend Makefile
if (Test-Path "Makefile") {
    Copy-Item "Makefile" -Destination "backend\Makefile" -Force
}

# Update GitHub workflows
Write-Host "Updating GitHub workflows..." -ForegroundColor Yellow
if (Test-Path ".github\workflows\deploy.yml") {
    Move-Item ".github\workflows\deploy.yml" -Destination ".github\workflows\deploy-backend.yml" -Force
}

# Create .gitignore files
Write-Host "Creating .gitignore files..." -ForegroundColor Yellow

# Backend .gitignore
@"
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
.venv/
.coverage
.pytest_cache/
*.log
.terraform/
*.tfstate*
.terraform.lock.hcl
*.tfplan
"@ | Out-File -FilePath "backend\.gitignore" -Encoding UTF8

# Frontend .gitignore
@"
node_modules/
dist/
build/
.env.local
.env.*.local
*.log
.DS_Store
coverage/
.eslintcache
"@ | Out-File -FilePath "frontend\.gitignore" -Encoding UTF8

# Create new root Makefile
@'
# Root Makefile for AI Lifestyle App Monorepo

.PHONY: help setup test dev deploy-all clean

# Colors
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

help: ## Show this help message
	@echo 'Monorepo Commands:'
	@echo ''
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${GREEN}%-15s${NC} %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ''
	@echo 'Backend commands: cd backend && make help'
	@echo 'Frontend commands: cd frontend && npm run help'

setup: ## Set up full stack development environment
	@echo "${YELLOW}Setting up backend...${NC}"
	cd backend && make setup
	@echo "${YELLOW}Setting up frontend...${NC}"
	cd frontend && npm install || echo "Frontend not yet initialized"
	@echo "${GREEN}Setup complete!${NC}"

test: ## Run all tests
	@echo "${YELLOW}Running backend tests...${NC}"
	cd backend && make test
	@echo "${YELLOW}Running frontend tests...${NC}"
	cd frontend && npm test || echo "Frontend not yet initialized"

dev: ## Start full stack local development
	@echo "${YELLOW}Starting local development environment...${NC}"
	docker-compose up

deploy-backend: ## Deploy backend to AWS
	cd backend && make deploy ENV=$(ENV)

deploy-frontend: ## Deploy frontend to S3/CloudFront
	@echo "${YELLOW}Building frontend...${NC}"
	cd frontend && npm run build || echo "Frontend not yet initialized"
	@echo "${YELLOW}Deploying to S3...${NC}"
	@echo "TODO: Add S3 sync command"

deploy-all: deploy-backend deploy-frontend ## Deploy full stack

clean: ## Clean all build artifacts
	cd backend && make clean
	cd frontend && rm -rf dist node_modules || true
	rm -rf .pytest_cache .coverage
'@ | Out-File -FilePath "Makefile" -Encoding UTF8

# Create frontend package.json template
@'
{
  "name": "ai-lifestyle-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
  },
  "dependencies": {
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "axios": "^1.4.0",
    "@tanstack/react-query": "^4.29.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "@typescript-eslint/parser": "^5.59.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.38.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.3.4",
    "prettier": "^2.8.0",
    "typescript": "^5.0.2",
    "vite": "^4.3.0",
    "vitest": "^0.31.0"
  }
}
'@ | Out-File -FilePath "frontend\package.json" -Encoding UTF8

# Create frontend README
@'
# AI Lifestyle Frontend

React + Material UI frontend for the AI Lifestyle application.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:9000
VITE_AUTH_DOMAIN=your-auth-domain
```
'@ | Out-File -FilePath "frontend\README.md" -Encoding UTF8

# Create updated docker-compose.yml
@'
version: '3.8'

services:
  # Backend services
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: ai-lifestyle-dynamodb
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -inMemory"

  lambda-api:
    build:
      context: ./backend
      dockerfile: Dockerfile.api-handler
      args:
        ENVIRONMENT: dev
    container_name: ai-lifestyle-lambda-api
    ports:
      - "9000:8080"
    environment:
      - AWS_ACCESS_KEY_ID=local
      - AWS_SECRET_ACCESS_KEY=local
      - AWS_REGION=us-east-1
      - ENVIRONMENT=local
      - TABLE_NAME=users-local
      - DYNAMODB_ENDPOINT=http://dynamodb-local:8000
    depends_on:
      - dynamodb-local
    volumes:
      - ./backend/src:/var/task:ro

  # Frontend development server
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: ai-lifestyle-frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:9000
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - ./shared:/app/shared
    depends_on:
      - lambda-api

  # DynamoDB Admin
  dynamodb-admin:
    image: aaronshaf/dynamodb-admin:latest
    container_name: ai-lifestyle-dynamodb-admin
    ports:
      - "8001:8001"
    environment:
      - DYNAMO_ENDPOINT=http://dynamodb-local:8000
    depends_on:
      - dynamodb-local

networks:
  default:
    name: ai-lifestyle-network
'@ | Out-File -FilePath "docker-compose.yml" -Encoding UTF8

# Create frontend Dockerfile for development
@'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
'@ | Out-File -FilePath "frontend\Dockerfile.dev" -Encoding UTF8

# Create shared types example
@'
// Shared types between frontend and backend

export interface User {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  metadata?: {
    timestamp: string;
    version: string;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  environment: string;
  timestamp: string;
  checks: {
    dynamodb: {
      status: string;
      [key: string]: any;
    };
  };
}
'@ | Out-File -FilePath "shared\types\index.ts" -Encoding UTF8

# Update root .gitignore
@'
# IDEs
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
!.vscode/launch.json
*.swp
*.swo
*~
.DS_Store

# Python
__pycache__/
*.py[cod]
.venv/
venv/
.coverage
.pytest_cache/

# Node
node_modules/
npm-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.egg-info/
.terraform/
*.tfstate*

# Environment files
.env
.env.*
!.env.example

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db
'@ | Out-File -FilePath ".gitignore" -Encoding UTF8

Write-Host "Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the new structure"
Write-Host "2. Update import paths in Python files (add 'backend.' prefix if needed)"
Write-Host "3. Update GitHub Actions workflows to use working-directory: backend"
Write-Host "4. Initialize frontend: cd frontend && npm install"
Write-Host "5. Commit the changes"
Write-Host ""
Write-Host "File structure:" -ForegroundColor Yellow

# Show directory structure
Get-ChildItem -Directory -Recurse -Depth 2 | Where-Object { $_.FullName -notmatch '\\\.git' } | ForEach-Object {
    $indent = "  " * ($_.FullName.Split('\').Count - (Get-Location).Path.Split('\').Count - 1)
    Write-Host "$indent$($_.Name)\"
}
