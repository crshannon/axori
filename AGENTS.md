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

- `/plan-feature` - Plan a feature from Linear ticket with rules and agents
- `/create-linear-issue` - Create a Linear issue from current context
- `/create-commit` - Create a commit with branch management and Linear integration
- `/create-pr` - Create a GitHub pull request

See `.cursor/commands/` for command documentation.

## Feature Development Workflow

When starting a new feature or update:

### 1. Plan the Feature

Use `/plan-feature` with your Linear ticket:

```
/plan-feature linear=AXO-123
```

This will:

- Fetch Linear issue details
- Analyze scope (frontend/backend/fullstack)
- Detect focus area (components/api/database/ui)
- Generate structured plan in `.cursor/plans/`
- Apply relevant rules automatically
- Create feature branch (optional)

### 2. Review the Plan

The generated plan includes:

- **Overview** - Feature summary from Linear
- **Requirements** - Parsed acceptance criteria
- **Architecture** - Database, API, component structure
- **Implementation Tasks** - Step-by-step with rule references
- **Testing Strategy** - Unit, integration, E2E plans
- **Design System** - UI components and styling
- **Relevant Rules** - All applicable rules listed

### 3. Implement Following the Plan

Reference the plan as you work:

- Follow task order
- Check rule references for each task
- Use rule files for guidance
- Update plan as you progress

### 4. Commit with Linear Reference

Use `/create-commit` to commit with Linear integration:

```
/create-commit -l AXO-123
```

This will:

- Auto-generate commit message from changes
- Link commit to Linear issue
- Prevent commits to main/master
- Create branch if needed

### 5. Create Pull Request

When ready, use `/create-pr`:

```
/create-pr title="Feature: Add loan summary" linear=AXO-123
```

## Best Practices

1. **Always start with `/plan-feature`** - Gets you organized with all rules applied
2. **Reference the plan** - Mention plan ID in commits: `Plan: axo-123-feature-name`
3. **Follow rule references** - Each task links to relevant rules
4. **Update plan as you go** - Mark tasks complete, add notes
5. **Use Linear integration** - Link commits and PRs to tickets

## Example Workflow

```bash
# 1. Plan the feature
/plan-feature linear=AXO-45

# 2. Review generated plan
cat .cursor/plans/axo-45-add-loan-sorting.plan.md

# 3. Start implementing (plan creates branch automatically)
# Follow tasks in plan, reference rules as needed

# 4. Commit work
/create-commit -l AXO-45

# 5. Create PR when done
/create-pr title="Feature: Add loan sorting" linear=AXO-45
```

## Getting Help

- Check rule files in `.cursor/rules/` for specific guidance
- Review skills in `.skills/` for detailed patterns
- See architecture docs in `docs/architecture/` for planning
