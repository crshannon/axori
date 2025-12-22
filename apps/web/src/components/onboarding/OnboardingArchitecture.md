# Onboarding Component Architecture Proposal

## Current Issues

- 860-line monolithic component
- 8+ useState hooks managing scattered state
- Manual validation logic
- Complex state synchronization with API
- Hard to test individual steps

## Proposed Structure

```
apps/web/src/components/onboarding/
├── OnboardingPage.tsx          # Main orchestrator (100-150 lines)
├── OnboardingSidebar.tsx       # Sidebar with progress
├── hooks/
│   ├── useOnboardingForm.ts    # TanStack Form hook
│   └── useOnboardingSteps.ts  # Step navigation logic
├── steps/
│   ├── Step1NameCollection.tsx
│   ├── Step2JourneyPhase.tsx
│   ├── Step3Persona.tsx
│   ├── Step4Ownership.tsx
│   ├── Step5FreedomNumber.tsx
│   └── Step6Strategy.tsx
└── types.ts                    # Shared types

apps/web/src/routes/onboarding.tsx  # Thin route wrapper (~20 lines)
```

## Benefits

### 1. TanStack Form Integration

- Single source of truth for form state
- Built-in validation with Zod
- Automatic dirty/touched tracking
- Better error handling
- Easier to sync with React Query

### 2. Component Splitting

- Each step: ~50-100 lines (vs 200+ inline)
- Testable in isolation
- Reusable step components
- Clearer component hierarchy
- Easier to add/remove steps

### 3. Improved Maintainability

- Clear separation of concerns
- Easier to locate and fix bugs
- Better code organization
- Reduced cognitive load

## Implementation Plan

### Phase 1: Extract Types & Hooks

- Move types to separate file
- Create `useOnboardingForm` hook with TanStack Form
- Extract step navigation logic

### Phase 2: Extract Sidebar

- Create `OnboardingSidebar` component
- Move progress tracking logic

### Phase 3: Extract Steps

- Create individual step components
- Migrate each step to use form hook
- Add step-specific validation

### Phase 4: Refactor Main Component

- Simplify `OnboardingPage` to orchestrator
- Remove scattered useState hooks
- Use TanStack Form for all state

## Example: Step Component Structure

```tsx
// Step1NameCollection.tsx
interface Step1Props {
  form: UseFormReturn<OnboardingFormData>
  onNext: () => void
  isDark: boolean
}

export function Step1NameCollection({ form, onNext, isDark }: Step1Props) {
  const firstName = form.useField({ name: 'firstName' })
  const lastName = form.useField({ name: 'lastName' })

  return (
    <form.Field name="firstName">
      {(field) => (
        <input
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
        />
        {field.state.meta.errors && (
          <div>{field.state.meta.errors[0]}</div>
        )}
      )}
    </form.Field>
  )
}
```

## Migration Strategy

1. **Start with TanStack Form** - Add form hook alongside existing state
2. **Migrate one step at a time** - Start with Step 1 (simplest)
3. **Test incrementally** - Ensure each step works before moving on
4. **Remove old state** - Once all steps migrated, remove useState hooks
