@echo off
REM scripts\setup-dev.bat
REM Set up development environment with pre-commit hooks (Windows)

echo Setting up development environment...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python 3 is required but not installed.
    echo Please install Python from https://www.python.org/
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install development dependencies
echo Installing development dependencies...
pip install -r requirements-dev.txt

REM Install pre-commit hooks
echo Installing pre-commit hooks...
pre-commit install
pre-commit install --hook-type commit-msg
pre-commit install --hook-type pre-push

REM Run pre-commit on all files to check setup
echo Running pre-commit checks...
pre-commit run --all-files

echo.
echo Development environment setup complete!
echo.
echo Pre-commit hooks are now installed and will run on:
echo   - git commit (via command line, VS Code, or GitHub Desktop)
echo   - git push
echo.
echo To manually run pre-commit checks:
echo   pre-commit run --all-files
echo.
echo To temporarily skip hooks:
echo   git commit --no-verify
echo.
pause
