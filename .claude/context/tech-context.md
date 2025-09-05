---
created: 2025-09-05T09:23:26Z
last_updated: 2025-09-05T09:23:26Z
version: 1.0
author: Claude Code PM System
---

# Technology Context

## Core Technologies

### Runtime & Framework
- **Next.js**: 15.5.2 (Latest App Router)
- **React**: 19.1.0
- **React DOM**: 19.1.0
- **Node.js**: Runtime environment
- **TypeScript**: ^5 for type safety

### Database & ORM
- **PostgreSQL**: Primary database
- **Prisma**: 6.15.0 - Next-generation ORM
- **@prisma/client**: 6.15.0 - Database client

### Authentication
- **@clerk/nextjs**: 6.31.9 - Complete auth solution
  - User management
  - Session handling
  - Social logins
  - Multi-factor authentication

### State Management
- **@tanstack/react-query**: 5.86.0
  - Server state management
  - Caching and synchronization
  - Optimistic updates
  - Background refetching

### Validation
- **Zod**: 4.1.5 - TypeScript-first schema validation

## Development Tools

### Build & Bundling
- **Next.js Build**: Production optimizations
- **Turbopack**: Development bundler (via Next.js)

### Styling
- **Tailwind CSS**: v4 (Alpha)
- **@tailwindcss/postcss**: v4
- **PostCSS**: CSS processing

### Code Quality
- **TypeScript**: Static type checking
  - Strict mode enabled (`strict: true` in tsconfig.json)
  - No implicit any (`noImplicitAny: true`)
  - Strict null checks enabled
- **ESLint**: v9 with Next.js config
  - **@typescript-eslint/no-explicit-any**: Enforced to prevent `any` usage
  - **@typescript-eslint/no-unused-vars**: Warns on unused variables
- **@eslint/eslintrc**: v3

### Testing
- **@playwright/test**: 1.55.0 - E2E testing framework

### Type Definitions
- **@types/node**: ^20
- **@types/react**: ^19
- **@types/react-dom**: ^19

## Package Scripts
```json
{
  "dev": "next dev",           // Development server
  "build": "next build",       // Production build
  "start": "next start",       // Production server
  "lint": "next lint",         // Code linting
  "test:e2e": "playwright test", // E2E tests
  "postinstall": "prisma generate" // Generate Prisma client
}
```

## Configuration Files

### TypeScript (`tsconfig.json`)
- Target: ES2017
- Module: ESNext
- JSX: Preserve
- Strict mode enabled
- Path aliases configured

### Next.js (`next.config.ts`)
- App Router enabled
- TypeScript support
- Image optimization
- Font optimization

### Tailwind CSS
- JIT mode enabled
- Custom design system
- Responsive utilities
- Dark mode support (potential)

### ESLint
- Next.js recommended rules
- TypeScript integration
- React hooks rules

## Environment Variables
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_CLERK_*` - Various Clerk public configs

## Development Workflow
1. **Local Development**: `npm run dev` on port 3000
2. **Type Checking**: Continuous via TypeScript
3. **Linting**: `npm run lint` for code quality
4. **Testing**: `npm run test:e2e` for integration tests
5. **Building**: `npm run build` for production
6. **Database**: Prisma migrations and generation

## Dependency Management
- **NPM**: Package manager
- **package-lock.json**: Locked dependencies
- **Postinstall**: Automatic Prisma client generation

## Version Control
- **Git**: Source control
- **GitHub**: Repository hosting
- **.gitignore**: Standard Next.js ignores

## Deployment
- **Target**: Vercel platform
- **Build Command**: `npm run build`
- **Output**: Static and serverless functions
- **Environment**: Node.js runtime

## Notable Patterns
1. **Server Components**: Default in App Router
2. **Client Components**: Explicit 'use client' directive
3. **API Routes**: File-based routing
4. **Database Singleton**: Prevent connection exhaustion
5. **Type Safety**: End-to-end TypeScript
6. **Schema Validation**: Zod for runtime validation