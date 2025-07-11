@echo off
echo Installing essential dependencies for React 19...
echo.

echo Installing routing and form libraries...
call npm install --legacy-peer-deps react-router-dom@^6.28.0 react-hook-form@^7.54.2 @hookform/resolvers@^3.9.1

echo.
echo Installing HTTP and validation...
call npm install axios@^1.7.9 zod@^3.24.1 js-cookie@^3.0.5

echo.
echo Installing React Query...
call npm install --legacy-peer-deps @tanstack/react-query@^5.63.0

echo.
echo Installing utilities...
call npm install clsx@^2.1.1 tailwind-merge@^2.6.0

echo.
echo Installing dev dependencies...
call npm install -D @types/js-cookie@^3.0.6

echo.
echo Essential dependencies installed!
echo.
echo Run 'npm run dev' to start the development server
pause
