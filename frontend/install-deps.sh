#!/bin/bash

# Install all required dependencies for the authentication system

echo "Installing production dependencies..."
npm install react-router-dom@^6.28.0 \
  react-hook-form@^7.54.2 \
  @tanstack/react-query@^5.63.0 \
  axios@^1.7.9 \
  zod@^3.24.1 \
  js-cookie@^3.0.5 \
  qrcode.react@^4.1.0 \
  @hookform/resolvers@^3.9.1

echo "Installing dev dependencies..."
npm install -D @types/js-cookie@^3.0.6 \
  msw@^2.7.0 \
  @testing-library/react@^16.1.0 \
  @testing-library/user-event@^14.5.2 \
  @testing-library/jest-dom@^6.6.3 \
  vitest@^2.1.8 \
  @vitest/ui@^2.1.8 \
  happy-dom@^15.11.12

echo "Installing Tailwind CSS..."
npm install -D tailwindcss@^3.4.17 \
  postcss@^8.5.1 \
  autoprefixer@^10.4.20 \
  @tailwindcss/forms@^0.5.10

echo "Installing UI utilities..."
npm install clsx@^2.1.1 \
  @radix-ui/react-alert-dialog@^1.1.4 \
  @radix-ui/react-checkbox@^1.1.3 \
  @radix-ui/react-dialog@^1.1.4 \
  @radix-ui/react-dropdown-menu@^2.1.4 \
  @radix-ui/react-label@^2.1.1 \
  @radix-ui/react-select@^2.1.4 \
  @radix-ui/react-separator@^1.1.1 \
  @radix-ui/react-slot@^1.1.1 \
  @radix-ui/react-toast@^1.2.4 \
  tailwind-merge@^2.7.0

echo "Installing OpenAPI generator..."
npm install -D @openapitools/openapi-generator-cli@^2.16.3

echo "Dependencies installed successfully!"
echo "Next steps:"
echo "1. Run 'npm run msw:init' to initialize MSW"
echo "2. Run 'npm run dev' to start the development server"
