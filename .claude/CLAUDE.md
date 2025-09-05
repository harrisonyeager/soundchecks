# CLAUDE.md

> Think carefully and implement the most concise solution that changes as little code as possible.

## USE SUB-AGENTS FOR CONTEXT OPTIMIZATION

### 1. Always use the file-analyzer sub-agent when asked to read files.
The file-analyzer agent is an expert in extracting and summarizing critical information from files, particularly log files and verbose outputs. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 2. Always use the code-analyzer sub-agent when asked to search code, analyze code, research bugs, or trace logic flow.

The code-analyzer agent is an expert in code analysis, logic tracing, and vulnerability detection. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 3. Always use the test-runner sub-agent to run tests and analyze the test results.

Using the test-runner agent ensures:

- Full test output is captured for debugging
- Main conversation stays clean and focused
- Context usage is optimized
- All issues are properly surfaced
- No approval dialogs interrupt the workflow

## Philosophy

### Error Handling

- **Fail fast** for critical configuration (missing text model)
- **Log and continue** for optional features (extraction model)
- **Graceful degradation** when external services unavailable
- **User-friendly messages** through resilience layer

### Testing

- Always use the test-runner agent to execute tests.
- Do not use mock services for anything ever.
- Do not move on to the next test until the current test is complete.
- If the test fails, consider checking if the test is structured correctly before deciding we need to refactor the codebase.
- Tests to be verbose so we can use them for debugging.

### E2E Testing Strategy (Playwright)

- **E2E ONLY** - No unit tests at this stage, focus on critical user paths
- **Real Services** - Test against actual database, auth (Clerk), and APIs
- **Selective Coverage** - Quality over quantity, test what matters most
- **User Behavior Focus** - Test workflows, not implementation details
- **No Test Generation** - Don't create new tests unless explicitly requested
- **Test Command** - Use `npm run test:e2e` for all E2E tests
- **Prerequisites** - Always ensure dev server is running on localhost:3000 before tests


## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
- Please tell me if there is a better approach than the one I am taking.
- Please tell me if there is a relevant standard or convention that I appear to be unaware of.
- Be skeptical.
- Be concise.
- Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
- Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
- Occasional pleasantries are fine.
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES:

- NO PARTIAL IMPLEMENTATION
- NO SIMPLIFICATION : no "//This is simplified stuff for now, complete implementation would blablabla"
- NO CODE DUPLICATION : check existing codebase to reuse functions and constants Read files before writing new functions. Use common sense function name to find them easily.
- NO DEAD CODE : either use or delete from codebase completely
- IMPLEMENT TEST FOR EVERY FUNCTIONS
- NO CHEATER TESTS : test must be accurate, reflect real usage and be designed to reveal flaws. No useless tests! Design tests to be verbose so we can use them for debuging.
- NO INCONSISTENT NAMING - read existing codebase naming patterns.
- NO OVER-ENGINEERING - Don't add unnecessary abstractions, factory patterns, or middleware when simple functions would work. Don't think "enterprise" when you need "working"
- NO MIXED CONCERNS - Don't put validation logic inside API handlers, database queries inside UI components, etc. instead of proper separation
- NO RESOURCE LEAKS - Don't forget to close database connections, clear timeouts, remove event listeners, or clean up file handles

## Project-Specific Instructions

### SoundChecks Application
- **Stack**: Next.js 15, TypeScript, Prisma, Clerk Auth, TanStack Query
- **Database**: PostgreSQL with Prisma ORM
- **API Pattern**: Next.js App Router API routes with Zod validation
- **Auth**: Clerk for authentication, user context required for all data operations
- **Testing**: E2E only with Playwright, no unit tests at this stage

### Code Patterns
- Use App Router conventions for all routes
- Implement server components by default, client components only when needed
- Use Prisma for all database operations
- Validate API inputs with Zod schemas
- Handle errors gracefully with appropriate HTTP status codes

## Testing Commands

- Run E2E tests: `npm run test:e2e`
- Run dev server: `npm run dev`
- Run linting: `npm run lint`
- Run build: `npm run build`

## Important Notes

- Always check existing code patterns before implementing new features
- Reuse existing utilities and components
- Follow the established project structure
- Ensure Clerk authentication is properly integrated
- Test against real services, never use mocks
