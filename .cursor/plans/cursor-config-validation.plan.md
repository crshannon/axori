# Cursor Configuration Validation Plan

## Overview

This plan validates the new Cursor configuration (rules, skills, commands) by implementing a feature enhancement in the property finances area. We'll enhance the `DebtLogic` component with loan summary totals and sorting, which will exercise multiple rules and ensure the agent follows best practices.

## Feature to Implement

**Enhance DebtLogic Component with Loan Summary Totals**From `docs/tasks/TODO.md`:

- [ ] Add loan summary totals (total debt, weighted rate, etc.)
- [ ] Add loan sorting/ordering (by position or date)
- [ ] Improve HELOC vs primary loan visual distinction

## Validation Goals

Test that the agent correctly follows:

1. ✅ **UI Component Rules** - Uses design system components
2. ✅ **Tailwind Best Practices** - CSS variables, dark mode patterns
3. ✅ **Type Safety** - Uses Drizzle/Zod type inference
4. ✅ **Schema Alignment** - Follows drizzle-zod workflow if schema changes needed
5. ✅ **Error Handling** - Uses centralized error utilities if API changes needed
6. ✅ **Testing Reminders** - Writes tests for new functionality
7. ✅ **Architecture** - Follows naming conventions and patterns
8. ✅ **Design System** - Uses CSS variables and design tokens

## Implementation Steps

### Phase 1: Analysis & Planning

**Goal**: Understand current implementation and plan changes

1. **Review Current DebtLogic Component**

- Read `apps/web/src/components/property-hub/property-details/financials/DebtLogic.tsx`
- Understand current loan display structure
- Identify what data is available from `useProperty` hook

2. **Review Related Files**

- Check loan schema: `packages/db/src/schema/index.ts`
- Check loan types: `packages/db/src/types.ts`
- Check API route: `apps/api/src/routes/properties.ts` (loan endpoints)
- Check validation schemas: `packages/shared/src/validation/`

3. **Plan Changes**

- Determine if schema changes needed (probably not)
- Plan UI changes for summary totals
- Plan sorting functionality
- Plan visual improvements

**Validation Checkpoints:**

- [ ] Agent references schema alignment rule when checking types
- [ ] Agent checks design system components before creating new UI
- [ ] Agent uses type inference instead of manual types

### Phase 2: Implement Loan Summary Totals

**Goal**: Add summary section showing aggregate loan metrics

1. **Create Summary Calculation Logic**

- Calculate total debt across all loans
- Calculate weighted average interest rate
- Calculate total monthly payment
- Create computed hook: `useLoanSummary(loans)`

2. **Add Summary UI Component**

- Use design system `Card` component
- Use `Typography` component for text
- Use CSS variables for colors
- Support dark mode with `dark:` classes

**Validation Checkpoints:**

- [ ] Agent uses `@axori/ui` components (Card, Typography)
- [ ] Agent uses CSS variables (`bg-[rgb(var(--color-primary))]`)
- [ ] Agent uses `dark:` classes instead of conditional logic
- [ ] Agent uses `cn()` utility for conditional classes
- [ ] Agent uses Drizzle type inference for loan types
- [ ] Agent follows component placement rules (hook in hooks/, component in components/)

### Phase 3: Implement Loan Sorting

**Goal**: Add ability to sort loans by position or date

1. **Add Sorting State**

- Add sort option state (position, date, balance, etc.)
- Create sorting utility function
- Apply sorting to loan list

2. **Add Sorting UI**

- Use design system `Select` or `Button` for sort options
- Show current sort indicator
- Maintain sort preference (localStorage optional)

**Validation Checkpoints:**

- [ ] Agent uses design system components for UI controls
- [ ] Agent follows TypeScript best practices
- [ ] Agent uses proper type inference

### Phase 4: Improve Visual Distinction

**Goal**: Better visual distinction between HELOC and primary loans

1. **Enhance Loan Card Styling**

- Add visual indicators for loan type
- Improve HELOC vs primary loan distinction
- Use design system Badge component for loan type

2. **Update Styling**

- Use CSS variables for colors
- Ensure proper dark mode support
- Use consistent spacing from design tokens

**Validation Checkpoints:**

- [ ] Agent uses `Badge` component from design system
- [ ] Agent uses CSS variables instead of hardcoded colors
- [ ] Agent uses Tailwind spacing scale consistently
- [ ] Agent tests dark mode appearance

### Phase 5: API Enhancements (If Needed)

**Goal**: Add any necessary API endpoints or modifications

1. **Review API Requirements**

- Check if current API provides all needed data
- Determine if new endpoints needed for calculations

2. **Implement API Changes (If Needed)**

- Use `withErrorHandling` wrapper
- Use `validateData` for validation
- Follow error handling patterns
- Use enhanced Zod schemas

**Validation Checkpoints:**

- [ ] Agent uses `withErrorHandling` wrapper for API routes
- [ ] Agent uses `validateData` for validation
- [ ] Agent follows drizzle-zod workflow if schema changes
- [ ] Agent uses proper error response format

### Phase 6: Testing

**Goal**: Write comprehensive tests for new functionality

1. **Unit Tests**

- Test `useLoanSummary` hook calculations
- Test sorting utility functions
- Test loan type detection logic

2. **Component Tests**

- Test DebtLogic component rendering
- Test sorting functionality
- Test summary display

3. **E2E Tests (Optional)**

- Test loan display in financials page
- Test sorting interaction
- Test summary calculations

**Validation Checkpoints:**

- [ ] Agent writes tests after implementing features
- [ ] Agent follows test organization patterns
- [ ] Agent uses Playwright patterns for E2E tests
- [ ] Agent runs tests before considering complete

### Phase 7: Documentation & Review

**Goal**: Document changes and review rule compliance

1. **Document Changes**

- Update component JSDoc comments
- Document new hook usage
- Note any API changes

2. **Review Rule Compliance**

- Verify all rules were followed
- Check for any violations
- Document any issues found

**Validation Checkpoints:**

- [ ] All rules were followed correctly
- [ ] No hardcoded colors or raw HTML
- [ ] Proper type inference used
- [ ] Error handling patterns followed
- [ ] Tests written and passing

## Expected Rule Violations to Catch

The agent should automatically suggest fixes for:

1. **Hardcoded Colors**

- If agent uses `bg-[#E8FF4D]` → Should suggest `bg-[rgb(var(--color-accent))]`

2. **Raw HTML Elements**

- If agent uses `<button>` → Should suggest `<Button>` from `@axori/ui`
- If agent uses `<div className="rounded-lg border">` → Should suggest `<Card>`

3. **Conditional Dark Mode**

- If agent uses `isDark ? "bg-dark" : "bg-light"` → Should suggest `dark:` classes

4. **Manual Type Definitions**

- If agent defines `type Loan = { id: string, ... }` → Should suggest `InferSelectModel`

5. **Missing Error Handling**

- If agent creates API route without `withErrorHandling` → Should remind to use it

6. **Missing Tests**

- After implementing features → Should remind to write tests

## Success Criteria

- ✅ All 12 project rules are exercised
- ✅ Agent follows rules automatically without explicit reminders
- ✅ Agent suggests improvements when violations are detected
- ✅ Feature is implemented following all best practices
- ✅ Tests are written and passing
- ✅ Code review shows rule compliance

## Files to Modify

### Frontend

- `apps/web/src/components/property-hub/property-details/financials/DebtLogic.tsx`
- `apps/web/src/hooks/useLoanSummary.ts` (new)
- `apps/web/src/utils/loanCalculations.ts` (new, if needed)

### Tests

- `apps/web/src/hooks/__tests__/useLoanSummary.test.ts` (new)
- `apps/web/src/components/property-hub/property-details/financials/__tests__/DebtLogic.test.tsx` (new)
- `apps/web/tests/e2e/debt-logic.spec.ts` (optional, new)

### API (If Needed)

- `apps/api/src/routes/properties.ts` (if new endpoints needed)

## Validation Checklist

After implementation, verify:

### UI Components Rule

- [ ] All buttons use `<Button>` from `@axori/ui`
- [ ] All cards use `<Card>` components
- [ ] All text uses `<Typography>` component
- [ ] No raw HTML elements used

### Tailwind Best Practices Rule

- [ ] All colors use CSS variables
- [ ] Dark mode uses `dark:` classes
- [ ] `cn()` utility used for conditional classes
- [ ] Consistent spacing scale used

### Type Safety Rule

- [ ] Loan types use `InferSelectModel<typeof loans>`
- [ ] No manual type definitions
- [ ] Types imported from `@axori/db` or `@axori/shared`

### Schema Alignment Rule

- [ ] If schema changes, followed drizzle-zod workflow
- [ ] Base schemas generated from Drizzle
- [ ] Enhanced schemas created for API validation

### Error Handling Rule

- [ ] API routes use `withErrorHandling` wrapper
- [ ] Validation uses `validateData` utility
- [ ] Error responses follow consistent format

### Testing Reminders Rule

- [ ] Tests written for new functionality
- [ ] Tests follow organization patterns
- [ ] Tests run and pass

### Architecture Rule

- [ ] Naming conventions followed
- [ ] Component placement correct
- [ ] Import patterns correct

### Design System Rule

- [ ] CSS variables used for colors
- [ ] Design tokens referenced
- [ ] Components use design system

## Notes

- This is a validation exercise, not a production feature
- Focus on rule compliance over feature completeness
- Document any rule issues or improvements needed
- Use this as a learning opportunity to refine rules

## Next Steps

1. Review this plan
2. Start Phase 1: Analysis & Planning
3. Work through phases systematically
4. Document rule compliance at each phase