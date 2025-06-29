# Makefile for AI Lifestyle App

.PHONY: help init plan deploy destroy test fmt clean build-lambda logs

# Default environment
ENV ?= dev
FUNCTION ?= api-handler
AWS_REGION ?= us-east-1

# Colors
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo 'Usage: make [target] ENV=dev|prod'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${GREEN}%-15s${NC} %s\n", $1, $2}' $(MAKEFILE_LIST)

setup: ## Set up development environment with pre-commit hooks
	@echo "${YELLOW}Setting up development environment...${NC}"
	@chmod +x scripts/*.sh || true
	@./scripts/setup-dev.sh

init: ## Initialize Terraform
	@echo "${YELLOW}Initializing Terraform for ${ENV}...${NC}"
	cd terraform && terraform init \
		-backend-config="key=${ENV}/terraform.tfstate" \
		-reconfigure

plan: ## Plan Terraform changes
	@echo "${YELLOW}Planning Terraform changes for ${ENV}...${NC}"
	cd terraform && terraform plan \
		-var="environment=${ENV}" \
		-var="aws_account_id=${AWS_ACCOUNT_ID}"

deploy: ## Deploy infrastructure
	@echo "${YELLOW}Deploying infrastructure to ${ENV}...${NC}"
	cd terraform && terraform apply \
		-var="environment=${ENV}" \
		-var="aws_account_id=${AWS_ACCOUNT_ID}" \
		-auto-approve

destroy: ## Destroy infrastructure (use with caution!)
	@echo "${RED}WARNING: This will destroy all infrastructure in ${ENV}${NC}"
	@read -p "Are you sure? Type 'yes' to continue: " confirm && \
	if [ "$$confirm" = "yes" ]; then \
		cd terraform && terraform destroy \
			-var="environment=${ENV}" \
			-var="aws_account_id=${AWS_ACCOUNT_ID}" \
			-auto-approve; \
	else \
		echo "Cancelled."; \
	fi

build-lambda: ## Build and push Lambda container
	@echo "${YELLOW}Building Lambda function: ${FUNCTION}${NC}"
	./scripts/deploy-lambda.sh ${ENV} ${FUNCTION}

test: ## Run tests
	@echo "${YELLOW}Running tests...${NC}"
	python -m pytest tests/ -v

test-lambda-local: ## Test Lambda locally with Docker
	@echo "${YELLOW}Building Lambda image locally...${NC}"
	docker build -t lambda-test -f Dockerfile.${FUNCTION} .
	@echo "${YELLOW}Starting Lambda runtime...${NC}"
	docker run -p 9000:8080 lambda-test &
	@sleep 3
	@echo "${YELLOW}Testing Lambda...${NC}"
	curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
		-d '{"httpMethod":"GET","path":"/health"}'
	@docker stop $$(docker ps -q --filter ancestor=lambda-test)

fmt: ## Format Terraform and Python code
	@echo "${YELLOW}Formatting Terraform files...${NC}"
	cd terraform && terraform fmt -recursive
	@echo "${YELLOW}Formatting Python files...${NC}"
	black src/ tests/
	isort src/ tests/

lint: ## Lint code
	@echo "${YELLOW}Linting Terraform...${NC}"
	cd terraform && terraform validate
	@echo "${YELLOW}Linting Python...${NC}"
	pylint src/
	flake8 src/

logs: ## Tail Lambda logs
	@echo "${YELLOW}Tailing logs for ${FUNCTION}-${ENV}...${NC}"
	aws logs tail /aws/lambda/${FUNCTION}-${ENV} --follow

clean: ## Clean up generated files
	@echo "${YELLOW}Cleaning up...${NC}"
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name ".DS_Store" -delete
	rm -rf .terraform/
	rm -f terraform.tfstate*

ecr-login: ## Login to ECR
	@echo "${YELLOW}Logging in to ECR...${NC}"
	aws ecr get-login-password --region ${AWS_REGION} | \
		docker login --username AWS --password-stdin \
		$$(cd terraform && terraform output -raw ecr_repository_url)

list-images: ## List ECR images
	@echo "${YELLOW}ECR images for ${ENV}:${NC}"
	aws ecr list-images --repository-name lifestyle-app-${ENV} \
		--query 'imageIds[*].[imageTag]' --output table

api-url: ## Get API Gateway URL
	@echo "${GREEN}API URL for ${ENV}:${NC}"
	@cd terraform && terraform output -raw api_endpoint 2>/dev/null || \
		echo "${RED}API not deployed yet${NC}"

validate: init fmt lint ## Validate all code

all: validate deploy build-lambda ## Full deployment

.DEFAULT_GOAL := help
