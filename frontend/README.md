# AI Lifestyle App - Frontend

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

**Note**: This project uses React 19. Some packages require `--legacy-peer-deps` flag.

1. Install dependencies:
```bash
# Essential dependencies for authentication UI
npm install --legacy-peer-deps react-router-dom @tanstack/react-query axios zod js-cookie react-hook-form @hookform/resolvers clsx tailwindcss postcss autoprefixer @tailwindcss/forms

# Development dependencies
npm install -D @types/js-cookie msw @testing-library/react @testing-library/user-event vitest happy-dom
```

2. Initialize MSW (for API mocking):
```bash
npm run msw:init
```

3. Start the development server:
```bash
npm run dev
```

The app will open at http://localhost:3000

## 🧪 Test Accounts

| Type | Email | Password | Notes |
|------|-------|----------|-------|
| Regular | user@example.com | ExistingP@ss123 | Standard login |
| MFA | mfa@example.com | MfaUserP@ss123 | Requires 6-digit code |

## 🎨 Features

### Authentication System (✅ Complete)
- User registration with validation
- Login with optional 2FA
- Protected routes
- Session management
- Professional navigation

### Coming Soon
- 2FA setup interface
- Password reset flow
- Profile management
- Settings pages

## 📁 Project Structure

```
src/
├── api/                 # API client and configuration
│   └── client.ts       # Axios instance with interceptors
├── components/         # Reusable UI components
│   ├── common/        # Generic components (Button, Input, etc.)
│   └── layout/        # Layout components (Header, Footer, etc.)
├── features/          # Feature-based modules
│   └── auth/         # Authentication feature
│       ├── components/   # Auth-specific components
│       ├── hooks/       # Auth-specific hooks
│       ├── services/    # API services
│       ├── types/       # TypeScript types
│       └── utils/       # Auth utilities
├── hooks/             # Global custom hooks
├── pages/             # Page components (route endpoints)
├── types/             # Global TypeScript types
└── utils/             # Global utilities
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🎨 Design System

We use Tailwind CSS with a custom color palette:

- **Primary**: Blue (#2196f3)
- **Error**: Red (#f44336)
- **Success**: Green (#4caf50)
- **Neutral**: Gray scale

## 🧪 Testing

Run tests with:
```bash
npm run test
```

For UI testing:
```bash
npm run test:ui
```

## 📝 Code Style

- TypeScript for type safety
- React Hook Form for forms
- Zod for validation
- React Query for server state
- Tailwind CSS for styling
- ESLint + Prettier for code formatting

## 🔐 Authentication Flow

1. **Registration**: `/register`
   - Email/password validation
   - Real-time password strength indicator
   - Success page with email verification instructions

2. **Login**: `/login` (coming soon)
   - Email/password authentication
   - 2FA support
   - Remember me option

3. **Protected Routes**: Wrapped with `ProtectedRoute` component
   - Automatic token refresh
   - Redirect to login on unauthorized

## 🚀 Deployment

### Development
```bash
npm run build:dev
# Deploy to S3/CloudFront dev environment
```

### Production
```bash
npm run build
# Deploy to S3/CloudFront production
```

## 📚 Key Dependencies

- **React 19**: UI library
- **Vite**: Build tool
- **React Router**: Client-side routing
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **React Query**: Server state management
- **Axios**: HTTP client
- **Tailwind CSS**: Utility-first CSS
- **Radix UI**: Accessible UI primitives

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for all new code
3. Write tests for new features
4. Update documentation as needed
5. Run linter before committing

## 📞 Support

For questions or issues, contact the AI Lifestyle team.
