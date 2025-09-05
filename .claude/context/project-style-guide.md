---
created: 2025-09-05T09:23:26Z
last_updated: 2025-09-05T09:23:26Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## Code Standards

### General Principles
- **Readability First**: Code should be self-documenting
- **Consistency**: Follow existing patterns in the codebase
- **Simplicity**: Avoid over-engineering solutions
- **Type Safety**: Leverage TypeScript fully
- **Performance**: Consider performance implications
- **Testability**: Write testable, modular code

### TypeScript Guidelines

#### Type Definitions
```typescript
// ✅ Good: Explicit types
interface ConcertLog {
  id: string;
  artist: string;
  venue: string;
  date: Date;
  rating?: number;
}

// ❌ Bad: Using 'any'
const processConcert = (data: any) => { ... }
```

#### Avoiding 'any' Type
**NEVER use `any` type** - it defeats TypeScript's purpose. Use these alternatives:

```typescript
// ❌ Bad: Using 'any'
const data: any = fetchSomeData();
function process(input: any) { }

// ✅ Good: Type-safe alternatives
const data: unknown = fetchSomeData();           // For truly unknown types
const obj: object = {};                          // For objects
const value: string | number = getValue();       // Union types
const kvPairs: Record<string, unknown> = {};     // For key-value objects
type MyType = { name: string; age: number };     // Custom types

// For Prisma where clauses or dynamic objects
type StringFilter = {
  contains?: string;
  startsWith?: string;
  mode?: 'insensitive';
}
```

**ESLint Configuration**: The project enforces `@typescript-eslint/no-explicit-any` rule to prevent any usage.

#### Type Exports
- Export types/interfaces from the file where they're defined
- Co-locate types with their primary usage
- Use `type` imports when importing only types

#### Null Handling
- Use optional chaining (`?.`)
- Use nullish coalescing (`??`)
- Avoid non-null assertions (`!`) except when absolutely certain

### File Organization

#### Directory Structure
```
feature/
├── components/      # React components
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── types/          # TypeScript types
└── constants/      # Constants and config
```

#### File Naming Conventions
- **Components**: `kebab-case.tsx` (e.g., `follow-button.tsx`)
- **Pages**: `page.tsx` in route directories
- **API Routes**: `route.ts` for endpoints
- **Utilities**: `kebab-case.ts` (e.g., `format-date.ts`)
- **Types**: `kebab-case.types.ts` (e.g., `concert.types.ts`)
- **Constants**: `kebab-case.constants.ts`
- **Hooks**: `use-*.ts` (e.g., `use-auth.ts`)

#### Import Order
1. React/Next.js imports
2. Third-party libraries
3. Internal aliases (`@/`)
4. Relative imports
5. Type imports

```typescript
// Example import order
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { formatDate } from '../utils/format-date';
import type { ConcertLog } from '../types/concert.types';
```

### React/Next.js Patterns

#### Component Structure
```typescript
// Function declaration for pages
export default function ConcertPage() {
  // Hooks first
  const [state, setState] = useState();
  const router = useRouter();
  
  // Effects
  useEffect(() => {}, []);
  
  // Event handlers
  const handleClick = () => {};
  
  // Render
  return <div>...</div>;
}

// Arrow functions for components
export const ConcertCard = ({ concert }: Props) => {
  return <div>...</div>;
};
```

#### Server vs Client Components
```typescript
// Server Component (default)
// app/concerts/page.tsx
export default async function ConcertsPage() {
  const concerts = await getConcerts();
  return <ConcertList concerts={concerts} />;
}

// Client Component (explicit)
// components/follow-button.tsx
'use client';
export const FollowButton = () => {
  const [following, setFollowing] = useState(false);
  return <button>...</button>;
};
```

#### Props Interface
```typescript
// Define props interface above component
interface ConcertCardProps {
  concert: ConcertLog;
  onDelete?: (id: string) => void;
  className?: string;
}

export const ConcertCard = ({ 
  concert, 
  onDelete,
  className 
}: ConcertCardProps) => {
  // Component implementation
};
```

### API Design

#### Route Handlers
```typescript
// app/api/concerts/route.ts
export async function GET(request: Request) {
  // Implementation
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  // Validation
  // Processing
  return NextResponse.json(result, { status: 201 });
}
```

#### Error Handling
```typescript
try {
  const result = await riskyOperation();
  return NextResponse.json(result);
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: 'Something went wrong' },
    { status: 500 }
  );
}
```

### Database Patterns

#### Prisma Queries
```typescript
// Use explicit selects for performance
const concerts = await prisma.concertLog.findMany({
  where: { profileId: userId },
  select: {
    id: true,
    artist: true,
    venue: true,
    date: true,
    rating: true,
  },
  orderBy: { date: 'desc' },
});

// Include relations when needed
const profile = await prisma.profile.findUnique({
  where: { username },
  include: {
    logs: true,
    followers: true,
    following: true,
  },
});
```

#### Transaction Handling
```typescript
const result = await prisma.$transaction(async (tx) => {
  const concert = await tx.concertLog.create({ data });
  await tx.profile.update({ where, data });
  return concert;
});
```

### Styling Conventions

#### Tailwind CSS Classes
```jsx
// Order: positioning, display, spacing, sizing, colors, text, effects
<div className="absolute flex items-center p-4 w-full bg-white text-gray-900 shadow-md">

// Responsive modifiers: mobile-first
<div className="w-full md:w-1/2 lg:w-1/3">

// State modifiers
<button className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50">
```

#### Component Styling Pattern
```typescript
// Use cn() utility for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className // Allow override via props
)}>
```

### State Management

#### Local State
```typescript
// Use useState for component state
const [isLoading, setIsLoading] = useState(false);

// Use useReducer for complex state
const [state, dispatch] = useReducer(reducer, initialState);
```

#### Server State
```typescript
// Use React Query for server state
const { data, error, isLoading } = useQuery({
  queryKey: ['concerts', userId],
  queryFn: () => fetchConcerts(userId),
});

// Mutations
const mutation = useMutation({
  mutationFn: createConcert,
  onSuccess: () => {
    queryClient.invalidateQueries(['concerts']);
  },
});
```

### Testing Patterns

#### E2E Tests
```typescript
// e2e/concerts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Concert Management', () => {
  test('should create a new concert', async ({ page }) => {
    await page.goto('/concerts/new');
    await page.fill('[name="artist"]', 'Test Artist');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL(/\/concerts/);
  });
});
```

### Comment Guidelines

#### When to Comment
- Complex business logic
- Non-obvious implementations
- TODO items with context
- API documentation
- Workarounds with explanations

#### Comment Style
```typescript
// Single line for brief comments

/**
 * Multi-line for function documentation
 * @param userId - The user's ID
 * @returns Array of concerts
 */

// TODO: Refactor this when we upgrade to Next.js 16
// FIXME: Temporary workaround for Prisma bug #1234
```

### Git Conventions

#### Branch Names
- `feature/add-concert-search`
- `fix/profile-loading-error`
- `refactor/optimize-queries`
- `docs/update-readme`

#### Commit Messages
```
type(scope): description

feat(concerts): add search functionality
fix(auth): resolve sign-in redirect issue
refactor(db): optimize concert queries
docs(api): update endpoint documentation
```

Types: feat, fix, refactor, docs, test, chore, style

### Security Best Practices

#### Input Validation
```typescript
// Always validate input
const schema = z.object({
  artist: z.string().min(1).max(100),
  venue: z.string().min(1).max(100),
  date: z.string().datetime(),
  rating: z.number().min(1).max(5).optional(),
});

const validated = schema.parse(input);
```

#### Authentication Checks
```typescript
// Check authentication in API routes
import { currentUser } from '@clerk/nextjs';

const user = await currentUser();
if (!user) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

### Performance Guidelines

#### Image Optimization
```jsx
import Image from 'next/image';

// Use Next.js Image component
<Image
  src={imageUrl}
  alt="Concert photo"
  width={800}
  height={600}
  loading="lazy"
/>
```

#### Data Fetching
```typescript
// Parallel data fetching
const [concerts, profile] = await Promise.all([
  getConcerts(),
  getProfile(),
]);

// Use suspense for loading states
<Suspense fallback={<Loading />}>
  <ConcertList />
</Suspense>
```

### Accessibility Standards

#### ARIA Labels
```jsx
<button aria-label="Follow user">
  <FollowIcon />
</button>

<input 
  aria-label="Search concerts"
  placeholder="Search..."
/>
```

#### Keyboard Navigation
- All interactive elements keyboard accessible
- Focus indicators visible
- Tab order logical
- Escape key closes modals

### Environment Variables

#### Naming Convention
```bash
# Public variables (exposed to client)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# Private variables (server only)
DATABASE_URL=
CLERK_SECRET_KEY=
```

#### Usage
```typescript
// Server-side
const dbUrl = process.env.DATABASE_URL;

// Client-side (must be prefixed)
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
```

## Quality Checklist

Before committing code:
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] No console.logs in production code
- [ ] All imports used
- [ ] Props interfaces defined
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Mobile responsive
- [ ] Accessibility considered
- [ ] Performance optimized