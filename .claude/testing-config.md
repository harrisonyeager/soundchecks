---
framework: playwright
test_command: npm run test:e2e
created: 2025-09-05T18:37:57Z
---

# Testing Configuration

## Framework
- Type: Playwright
- Version: 1.55.0
- Config File: Not found (using defaults)

## Test Philosophy
- **E2E ONLY** - No unit tests at this stage
- **Critical Paths** - Focus on essential user journeys
- **Real Services** - No mocks, test against actual backend
- **Selective Coverage** - Quality over quantity

## Test Structure
- Test Directory: e2e/
- Test Files: 1 E2E spec found
- Naming Pattern: *.spec.ts
- Current Tests:
  - e2e/app.spec.ts

## Commands
- Run All Tests: `npm run test:e2e`
- Run Specific Test: `npx playwright test e2e/app.spec.ts`
- Run with Debugging: `npx playwright test --debug`
- Run in UI Mode: `npx playwright test --ui`
- Run Headed: `npx playwright test --headed`

## Environment
- Required ENV vars: Standard Next.js env vars
- Test Server: http://localhost:3000 (must be running)
- Test Database: Development database
- Auth Service: Clerk (must be configured)

## Test Runner Agent Configuration
- Use verbose output for debugging
- Run tests sequentially (no parallel)
- Capture full stack traces
- No mocking - use real implementations
- Wait for each test to complete
- Focus on E2E tests only
- No unit test generation
- Test real user workflows
- Report on critical path failures

## Prerequisites Check
- Dev server must be running: `npm run dev`
- Database must be accessible
- Clerk auth must be configured