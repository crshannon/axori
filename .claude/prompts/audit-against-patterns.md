# Audit Against Patterns Prompt

Use this prompt when you want Claude Code to validate in-flight work against the established patterns.

---

## Prompt

```
I've merged new Claude Code documentation and pattern guidelines to main. Please:

1. Pull the latest main branch:
   git fetch origin main && git merge origin/main

2. Read the new documentation files:
   - CLAUDE.md (expanded with comprehensive patterns)
   - .claude/settings.md (naming conventions, quality checklist)
   - .claude/patterns/feature-checklist.md (step-by-step implementation guide)
   - .claude/patterns/validation-schemas.md (Zod schema patterns)
   - .claude/patterns/design-system.md (UI/styling patterns)

3. Audit the current work in this branch against the patterns:
   - Does the database schema follow the standard field conventions (id, userId, createdAt, updatedAt)?
   - Are types inferred from Drizzle (InferSelectModel/InferInsertModel) rather than manually defined?
   - Do validation schemas follow the three-tier pattern (base → enhanced → form)?
   - Do API routes use withErrorHandling and requireAuth middleware?
   - Do TanStack Query hooks follow the standard key factory pattern?
   - Are UI components using @axori/ui instead of raw HTML?
   - Do all styles include dark mode variants?
   - Are drawer components registered in the drawer factory?

4. Create a summary of any changes needed to align with these patterns, then implement them.

5. Run the quality checks:
   pnpm type-check && pnpm lint

Focus on alignment issues only - don't refactor working code unnecessarily, but do fix any patterns that deviate from the documented standards.
```

---

## Quick Audit Checklist

For a faster review, use this condensed version:

```
Pull main and audit this branch against .claude/patterns/:

1. git fetch origin main && git merge origin/main
2. Read: CLAUDE.md, .claude/settings.md, .claude/patterns/*.md
3. Check: types inferred (not manual), 3-tier validation, API middleware, query key factories, @axori/ui usage, dark mode styles
4. Fix any deviations, then run: pnpm type-check && pnpm lint
```
