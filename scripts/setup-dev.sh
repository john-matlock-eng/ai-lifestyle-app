#!/bin/bash
# scripts/setup-dev.sh
# Set up development environment with pre-commit hooks

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Setting up development environment...${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is required but not installed.${NC}"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # Unix-like
    source venv/bin/activate
fi

# Upgrade pip
echo -e "${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip

# Install development dependencies
echo -e "${YELLOW}Installing development dependencies...${NC}"
pip install -r requirements-dev.txt

# Install pre-commit hooks
echo -e "${YELLOW}Installing pre-commit hooks...${NC}"
pre-commit install
pre-commit install --hook-type commit-msg
pre-commit install --hook-type pre-push

# Run pre-commit on all files to check setup
echo -e "${YELLOW}Running pre-commit checks...${NC}"
pre-commit run --all-files || true

echo -e "${GREEN}✓ Development environment setup complete!${NC}"
echo ""
echo -e "Pre-commit hooks are now installed and will run on:"
echo -e "  - ${GREEN}git commit${NC} (via command line, VS Code, or GitHub Desktop)"
echo -e "  - ${GREEN}git push${NC}"
echo ""
echo -e "To manually run pre-commit checks:"
echo -e "  ${YELLOW}pre-commit run --all-files${NC}"
echo ""
echo -e "To temporarily skip hooks:"
echo -e "  ${YELLOW}git commit --no-verify${NC}"
