@echo off
echo 🔧 Fixing Rollup platform dependencies...

echo 📦 Removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo 📥 Installing dependencies...
npm install --legacy-peer-deps

echo.
echo ✅ Dependencies installed successfully!
echo.
echo You can now run:
echo   npm run dev    - Start development server
echo   npm test       - Run tests
echo   npm run build  - Build for production
