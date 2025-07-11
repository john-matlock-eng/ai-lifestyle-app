@echo off
echo Installing production dependencies...
echo Note: Using --legacy-peer-deps for React 19 compatibility
call npm install --legacy-peer-deps react-router-dom@^6.28.0 react-hook-form@^7.54.2 @tanstack/react-query@^5.63.0 axios@^1.7.9 zod@^3.24.1 js-cookie@^3.0.5 @hookform/resolvers@^3.9.1

echo.
echo Installing dev dependencies...
call npm install -D @types/js-cookie@^3.0.6 msw@^2.7.0 @testing-library/react@^16.1.0 @testing-library/user-event@^14.5.2 @testing-library/jest-dom@^6.6.3 vitest@^2.1.8 @vitest/ui@^2.1.8 happy-dom@^15.11.0

echo.
echo Tailwind CSS already installed!

echo.
echo Installing UI utilities...
call npm install clsx@^2.1.1 tailwind-merge@^2.6.0

echo.
echo Installing Radix UI components (with legacy peer deps)...
call npm install --legacy-peer-deps @radix-ui/react-alert-dialog@^1.1.4 @radix-ui/react-checkbox@^1.1.3 @radix-ui/react-dialog@^1.1.4 @radix-ui/react-dropdown-menu@^2.1.4 @radix-ui/react-label@^2.1.1 @radix-ui/react-select@^2.1.4 @radix-ui/react-separator@^1.1.1 @radix-ui/react-slot@^1.1.1 @radix-ui/react-toast@^1.2.4

echo.
echo Dependencies installed successfully!
echo Note: We skipped qrcode.react as it's not compatible with React 19 yet.
echo We'll implement QR code functionality differently when needed.
echo.
echo Next steps:
echo 1. Run 'npm run msw:init' to initialize MSW
echo 2. Run 'npm run dev' to start the development server
pause
