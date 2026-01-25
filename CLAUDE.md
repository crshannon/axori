# CLAUDE.md - Axori Project Guide

This file provides guidance for Claude Code when working with the Axori codebase.

## Project Overview

Axori is a property management platform built as a monorepo with three apps and four packages.

## Tech Stack

- **Web**: TanStack Start + React 19 + Vite + Tailwind CSS 4
- **API**: Hono
- **Mobile**: React Native + Expo
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Auth**: Clerk
- **Package Manager**: pnpm with workspaces
- **Build**: Turborepo

## Project Structure

```
apps/
  web/          # TanStack Start web app (port 3000)
  api/          # Hono API server (port 3001)
  mobile/       # React Native/Expo app
packages/
  db/           # Drizzle schema, migrations, database client
  shared/       # Utilities, types, integrations, validation
  ui/           # Design system components
  permissions/  # Permission system
```

## Common Commands

```bash
# Development
pnpm dev                # Start web dev server
pnpm dev:api            # Start API server
pnpm dev:mobile         # Start mobile app

# Building
pnpm build              # Build all packages
pnpm build:web          # Build web only

# Testing
pnpm test               # Run all tests (Vitest)
pnpm test:e2e           # Run Playwright E2E tests
pnpm test:e2e:ui        # E2E with UI

# Code Quality
pnpm lint               # Run ESLint
pnpm format             # Run Prettier
pnpm check              # Format + lint fix
pnpm type-check         # TypeScript checks

# Database (Drizzle)
pnpm db:generate        # Generate migrations
pnpm db:push            # Push schema to database
pnpm db:studio          # Open Drizzle Studio
pnpm db:seed            # Seed database
```

## Key Patterns

### Schema Alignment (Drizzle → Zod)

- Schema source of truth: `packages/db/src/schema/index.ts`
- Use `drizzle-zod` to generate Zod schemas from Drizzle
- Infer types using `InferSelectModel`/`InferInsertModel`

### Error Handling

- Use `withErrorHandling` wrapper for API routes
- Use `validateData()` for schema validation
- Centralized errors in `apps/api/src/utils/errors.ts`

### Component Organization

- Reusable: `packages/ui/src/components/`
- Page-specific: `apps/web/src/components/`
- Routes: `apps/web/src/routes/` (file-based routing)

### Database Client

- Lazy-initialized with proxy pattern in `packages/db/src/client.ts`
- Server-side only - runtime checks prevent client-side use
- Import types from `@axori/db/types` for client-safe usage

## Code Style

- **ESLint**: `--max-warnings 0` enforced
- **Prettier**: double quotes, trailing commas (es5), 80 char width
- **TypeScript**: strict mode, no unused locals/parameters
- **Unused vars**: prefix with `_` to ignore (`argsIgnorePattern: "^_"`)

## Testing

- **Unit tests**: Vitest + Testing Library, colocated in `__tests__/` folders
- **E2E tests**: Playwright in `apps/web/tests/e2e/`
- **E2E setup**: Requires Clerk API keys and DATABASE_URL

## Key File Locations

| What | Where |
|------|-------|
| Web routes | `apps/web/src/routes/` |
| API routes | `apps/api/src/routes/` |
| Database schema | `packages/db/src/schema/index.ts` |
| Validation schemas | `packages/shared/src/validation/` |
| UI components | `packages/ui/src/components/` |
| Architecture docs | `docs/architecture/` |

## Important Notes

- Use `workspace:*` for internal package dependencies
- Web app uses path alias `@/*` → `./src/*`
- Prefer `@axori/ui` components over raw HTML
- Database uses Supabase - requires `prepare: false` for postgres client
