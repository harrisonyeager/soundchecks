---
created: 2025-09-05T09:23:26Z
last_updated: 2025-09-05T09:23:26Z
version: 1.0
author: Claude Code PM System
---

# Project Structure

## Directory Organization

```
soundchecks/
├── .claude/                 # Claude Code PM configuration
│   ├── context/            # Context documentation
│   ├── scripts/            # PM automation scripts
│   └── CLAUDE.md          # AI assistant instructions
├── .next/                  # Next.js build output
├── .vercel/                # Vercel deployment config
├── app/                    # Next.js App Router
│   ├── (app)/             # Protected app routes
│   │   ├── concerts/      # Concert management pages
│   │   │   ├── new/       # Create new concert log
│   │   │   └── page.tsx   # Concert listing
│   │   └── profile/       # User profiles
│   │       └── [username]/ # Dynamic user profiles
│   ├── (auth)/            # Authentication routes
│   │   ├── sign-in/       # Sign in page
│   │   └── sign-up/       # Sign up page
│   ├── api/               # API Routes
│   │   ├── concerts/      # Concert CRUD operations
│   │   └── follow/        # Follow/unfollow actions
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Landing page
├── components/             # Reusable React components
│   └── follow-button.tsx  # Follow/unfollow component
├── e2e/                    # End-to-end tests
├── lib/                    # Shared utilities
│   └── db/                # Database utilities
│       └── prisma.ts      # Prisma client singleton
├── prisma/                 # Database schema
│   └── schema.prisma      # Prisma schema definition
├── public/                 # Static assets
└── node_modules/          # Dependencies

```

## File Naming Patterns
- **Pages**: `page.tsx` for route segments
- **Layouts**: `layout.tsx` for nested layouts
- **Components**: kebab-case `.tsx` files
- **API Routes**: `route.ts` for API endpoints
- **Utilities**: kebab-case `.ts` files
- **Types**: Often co-located with components
- **Tests**: `.test.ts` or in `e2e/` directory

## Module Organization

### App Router Structure
- **(app)** - Protected routes requiring authentication
- **(auth)** - Public authentication routes
- **api** - Backend API endpoints
- Dynamic routes use `[param]` syntax
- Route groups use `(group)` syntax

### Component Architecture
- Components are functional with hooks
- Server components by default in app directory
- Client components marked with 'use client'
- Shared components in `/components`

### Data Layer
- Prisma ORM for database access
- PostgreSQL as primary database
- Database client singleton pattern
- Schema-first approach with migrations

### State Management
- React Query for server state
- React hooks for local state
- Clerk for authentication state

## Build Outputs
- `.next/` - Next.js production build
- `node_modules/` - NPM dependencies
- `test-results/` - Playwright test outputs

## Configuration Files
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS config
- `eslint.config.mjs` - ESLint rules
- `package.json` - Dependencies and scripts
- `.env` / `.env.local` - Environment variables
- `middleware.ts` - Next.js middleware

## Key Patterns
1. **Route Groups** - Organize routes without affecting URL structure
2. **Dynamic Routes** - Parameter-based routing with [param]
3. **Server/Client Split** - Clear separation of server and client components
4. **API Routes** - RESTful endpoints in app/api
5. **Database Access** - Centralized through Prisma client
6. **Environment Config** - Separated dev/prod configurations