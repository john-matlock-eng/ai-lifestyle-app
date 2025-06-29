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
