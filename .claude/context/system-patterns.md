---
created: 2025-09-05T09:23:26Z
last_updated: 2025-09-05T09:23:26Z
version: 1.0
author: Claude Code PM System
---

# System Patterns

## Architectural Style
- **Pattern**: Modular Monolith with Next.js App Router
- **Approach**: Server-first with selective client interactivity
- **Data Flow**: Unidirectional with server state management
- **Separation**: Clear boundaries between auth, app, and API layers

## Design Patterns Observed

### 1. Database Singleton Pattern
**Location**: `lib/db/prisma.ts`
- Prevents connection pool exhaustion
- Reuses client in development
- Global storage for hot reload persistence
- Production optimizations included

### 2. Route Group Organization
**Pattern**: Logical grouping without URL impact
- `(app)` - Protected application routes
- `(auth)` - Public authentication routes
- Clean URL structure maintained
- Middleware protection applied

### 3. Server Component Default
**Pattern**: React Server Components (RSC)
- Components are server-rendered by default
- Client components explicitly marked
- Reduces JavaScript bundle size
- Better SEO and initial load performance

### 4. File-Based Routing
**Pattern**: Filesystem as router configuration
- `page.tsx` defines route endpoints
- `layout.tsx` provides nested layouts
- `route.ts` for API endpoints
- Dynamic segments with `[param]`

### 5. Middleware Authentication
**Location**: `middleware.ts`
- Centralized auth checks
- Route protection rules
- Redirect logic for unauthenticated users
- Public path configuration

## Data Flow Patterns

### Request Flow
1. **Client Request** → Middleware
2. **Middleware** → Auth validation
3. **Route Handler** → Server component/API
4. **Data Fetching** → Prisma → PostgreSQL
5. **Response** → Client (HTML/JSON)

### State Management Flow
```
Client State (Hooks) ↔ Server State (React Query)
                     ↓
                  API Routes
                     ↓
                Prisma ORM
                     ↓
                PostgreSQL
```

### Authentication Flow
1. **Clerk Provider** wraps application
2. **Middleware** checks authentication
3. **User Context** available throughout app
4. **Protected Routes** require valid session
5. **Profile Creation** on first sign-in

## Code Organization Patterns

### Component Structure
- **Presentation**: UI components in `/components`
- **Pages**: Route components in `/app`
- **Logic**: Utilities in `/lib`
- **Data**: Prisma schema and migrations
- **Tests**: E2E tests in `/e2e`

### API Design
- RESTful conventions
- Resource-based routing
- JSON request/response
- Error handling with status codes
- Validation before database operations

### Database Schema Design
- **Normalized**: Separate tables for entities
- **Relations**: Explicit foreign keys
- **Indexes**: Performance optimization
- **Cascading Deletes**: Referential integrity
- **Timestamps**: Audit fields (createdAt, updatedAt)

## Security Patterns

### Authentication & Authorization
- Clerk handles authentication
- Middleware enforces access control
- Session-based authorization
- Protected API routes
- User isolation in queries

### Data Validation
- Zod schemas for input validation
- Type checking with TypeScript
- Prisma schema validation
- Client-side form validation
- Server-side verification

### Environment Security
- Secrets in environment variables
- `.env.local` for local development
- Never commit sensitive data
- Separate dev/prod configurations

## Performance Patterns

### Optimization Strategies
- Server-side rendering by default
- Static generation where possible
- Image optimization built-in
- Font optimization with next/font
- Code splitting automatic
- Lazy loading for client components

### Database Optimization
- Connection pooling via Prisma
- Indexed queries for performance
- Eager loading to prevent N+1
- Efficient relationship queries

### Caching Strategy
- React Query for client-side caching
- Stale-while-revalidate pattern
- Optimistic updates for UX
- Background data synchronization

## Error Handling Patterns

### Application Errors
- Try-catch blocks in API routes
- Error boundaries for React components
- Graceful degradation
- User-friendly error messages
- Logging for debugging

### Database Errors
- Prisma error handling
- Transaction rollbacks
- Constraint violation handling
- Connection error recovery

## Testing Patterns

### E2E Testing Strategy
- Playwright for browser automation
- User journey testing
- Critical path coverage
- Cross-browser testing
- Visual regression potential

### Development Testing
- Type checking during development
- Linting for code quality
- Fast feedback loops
- Hot module replacement

## Deployment Patterns

### Build & Deploy
- Vercel platform optimization
- Serverless functions for API
- Static asset optimization
- Environment variable management
- Zero-downtime deployments

### Monitoring & Observability
- Error tracking potential
- Performance monitoring hooks
- User analytics integration ready
- Health check endpoints possible