# AI Lifestyle App

A serverless AI-powered lifestyle application built on AWS using Terraform, Python, and containerized Lambda functions.

## Quick Start

See [Next Steps Guide](./NEXT_STEPS.md) for detailed setup instructions.

```bash
# Set up development environment (installs pre-commit hooks)
make setup

# Deploy infrastructure
make deploy ENV=dev

# Build and push Lambda
make build-lambda FUNCTION=api-handler

# Run tests
make test

# Start local environment
./scripts/local-dev.sh
```

## Architecture

- **API Gateway**: HTTP API v2 for REST endpoints
- **Lambda**: ARM64 containerized functions
- **DynamoDB**: NoSQL database
- **ECR**: Container registry
- **GitHub Actions**: CI/CD pipeline

## Development

```bash
# Install dependencies
pip install -r requirements-dev.txt

# Run locally
docker-compose up

# Format code
make fmt

# Run linting
make lint
```

## Pre-commit Hooks

This project uses pre-commit hooks for code quality. They work automatically with:
- Command line git
- VS Code Source Control
- GitHub Desktop

To install: `make setup`

If hooks fail in GitHub Desktop, check View > Show Command Output for details.

## License

MIT
