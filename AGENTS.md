# Axori Project Instructions

This file provides high-level guidance for working with the Axori codebase. For detailed rules, see `.cursor/rules/`.

## Project Overview

Axori is a modern property management platform built with:

- **Frontend**: TanStack Start (React), React Native/Expo
- **Backend**: Hono API, PostgreSQL via Supabase
- **Database**: Drizzle ORM
- **Validation**: Zod with drizzle-zod
- **Styling**: Tailwind CSS with design system
- **Monorepo**: pnpm workspaces + Turborepo

## Quick Reference

### Component Placement

- **Reusable components** → `packages/ui/src/components/`
- **Page-specific components** → `apps/web/src/components/`
- **Pages/routes** → `apps/web/src/routes/`

### Design System

- Always use `@axori/ui` components instead of raw HTML
- Use CSS variables for colors: `bg-[rgb(var(--color-primary))]`
- Use Tailwind `dark:` classes for dark mode
- See `packages/ui/DESIGN_TOKENS.md` for design tokens

### Database & Validation

- **Single source of truth**: Drizzle schema
- **Zod schemas**: Generated from Drizzle using `drizzle-zod`
- **Type inference**: Always use `InferSelectModel`/`InferInsertModel`
- **Error handling**: Use centralized utilities from `apps/api/src/utils/errors.ts`

### Testing

- Write tests after implementing features
- Use Playwright for E2E tests
- Run tests before committing

## Key Patterns

### Schema Alignment

1. Define Drizzle schema
2. Generate base Zod schemas with `drizzle-zod`
3. Create enhanced schemas for API-specific validation
4. Export types for frontend use

### Error Handling

Always use `withErrorHandling` wrapper:

```typescript
import { withErrorHandling, validateData } from "../utils/errors";

router.post(
  "/",
  withErrorHandling(
    async (c) => {
      const validated = validateData(body, schema, { operation: "create" });
      // ... handler logic
    },
    { operation: "create" }
  )
);
```

### Component Conversion

Convert raw HTML to design system components:

```tsx
// Before
<button className="bg-blue-500">Click</button>;

// After
import { Button } from "@axori/ui";
<Button variant="primary">Click</Button>;
```

## Detailed Rules

For specific guidance, see the rules in `.cursor/rules/`:

- **Project Structure** (`.cursor/rules/project-structure.mdc`) - Always applies
- **UI Components** (`.cursor/rules/ui-components.mdc`) - Component conversion
- **Architecture** (`.cursor/rules/architecture.mdc`) - Best practices
- **Error Handling** (`.cursor/rules/error-handling.mdc`) - API error patterns
- **Schema Alignment** (`.cursor/rules/schema-alignment.mdc`) - Drizzle-Zod workflow
- **Design System** (`.cursor/rules/design-system.mdc`) - Design system usage
- **Type Safety** (`.cursor/rules/type-safety.mdc`) - Type inference patterns
- **Tailwind** (`.cursor/rules/tailwind-best-practices.mdc`) - CSS best practices
- **Zod Validation** (`.cursor/rules/zod-validation.mdc`) - Validation patterns
- **Drizzle ORM** (`.cursor/rules/drizzle-orm.mdc`) - Database patterns
- **Testing** (`.cursor/rules/testing-reminders.mdc`) - Always applies
- **Linear Integration** (`.cursor/rules/linear-integration.mdc`) - Linear workflow
- **Learning Hub** (`.cursor/rules/learning-hub-integration.mdc`) - Learning hub patterns

## Skills

Agent Skills are available in `.skills/`:

- **Architect** (`.skills/architect/`) - Full-stack architectural guidance
- **Design** (`.skills/design/`) - Design system implementation

## Commands

See `.cursor/commands.md` for all available commands.

### Cursor Chat Commands

Use these in Cursor chat with `/` prefix:

- `/create-linear-issue` - Create a Linear issue from current context
- `/create-commit` - Create a commit with branch management and Linear integration
- `/create-pr` - Create a GitHub pull request

See `.cursor/commands/` for command documentation.

## Getting Help

- Check rule files in `.cursor/rules/` for specific guidance
- Review skills in `.skills/` for detailed patterns
- See architecture docs in `docs/architecture/` for planning
