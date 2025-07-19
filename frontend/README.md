# AI Lifestyle App - Frontend

## Overview
This is the frontend application for the AI Lifestyle App, built with React, TypeScript, and Vite.

## Documentation

### 📚 Essential Reading
1. **[Frontend Architecture Guide](./CLAUDE.md)** - Complete overview of the frontend architecture, patterns, and best practices
2. **[TypeScript Guide](./TYPESCRIPT_GUIDE.md)** - Understanding our type system and avoiding common type errors
3. **[Quick Reference](./QUICK_REFERENCE.md)** - Cheat sheet for common imports and patterns

### 🔧 Feature Documentation
- **[Journal Developer Guide](./src/features/journal/JOURNAL_DEVELOPER_GUIDE.md)** - Deep dive into the journal feature

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL
```

### Development
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Building
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure
```
frontend/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # Shared components
│   ├── contexts/         # React contexts
│   ├── features/         # Feature modules
│   ├── hooks/           # Custom hooks
│   ├── services/        # Business logic
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript types (IMPORTANT: Always use these!)
│   └── utils/           # Utilities
├── public/              # Static assets
└── index.html          
```

## Key Technologies
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Query** - Server state management
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **React Hook Form** - Forms
- **Zod** - Validation

## Common Commands
```bash
# Install a new package
npm install package-name

# Add types for a package
npm install --save-dev @types/package-name

# Check for outdated packages
npm outdated

# Update packages
npm update
```

## Troubleshooting

### Type Errors
See [TypeScript Guide](./TYPESCRIPT_GUIDE.md) for common type issues and solutions.

### Build Errors
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf dist .vite`
3. Check TypeScript: `npm run type-check`

### Import Errors
- Always use absolute imports: `@/components/...`
- Import types from `@/types/...`
- See [Quick Reference](./QUICK_REFERENCE.md) for import patterns

## Contributing
1. Read the documentation files above
2. Follow existing patterns
3. Ensure TypeScript types are correct
4. Test your changes thoroughly
5. Update documentation if needed

## Support
For questions or issues:
1. Check the documentation
2. Look for similar patterns in the codebase
3. Check TypeScript errors carefully
4. Create an issue with details

## License
Private - All rights reserved
