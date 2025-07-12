@echo off
echo Fixing Tiptap dependencies...

echo Removing node_modules and package-lock.json...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo Installing dependencies with legacy peer deps...
npm install --legacy-peer-deps

echo Dependencies fixed!
echo Please restart your development server.
pause
