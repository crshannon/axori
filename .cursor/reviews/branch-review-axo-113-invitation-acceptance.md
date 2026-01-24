# Branch Review: AXO-113 Portfolio Invitation Acceptance

## Overview
Review of branch `cursor/AXO-113-portfolio-invitation-acceptance-de4c` against project rules and best practices.

## ✅ What's Working Well

1. **Centralized Role Constants** - ✅ Fixed
   - `InvitationAccept.tsx` now uses `PORTFOLIO_ROLE_LABELS` and `PORTFOLIO_ROLE_DESCRIPTIONS` from `@axori/permissions`
   - Email templates use centralized constants with helper functions

2. **Component Structure** - ✅ Good
   - Components are properly placed in `apps/web/src/components/invitations/`
   - Route follows TanStack Router patterns

3. **Design System Usage** - ✅ Good
   - Uses `Button` component from `@axori/ui`
   - Consistent styling patterns

## ❌ Issues Found

### 1. **Type Safety Issues**

#### Issue: `as any` type assertion in navigation
**File:** `apps/web/src/components/invitations/InvitationAccept.tsx:57`
```typescript
navigate({ to: '/dashboard' as any })
```
**Problem:** Bypasses TypeScript type checking
**Fix:** Use proper route typing:
```typescript
import { useNavigate } from '@tanstack/react-router'
// Use the route path directly
navigate({ to: '/dashboard' })
```

#### Issue: Hardcoded role type instead of `PortfolioRole`
**File:** `apps/web/src/hooks/api/useInvitations.ts:13`
```typescript
role: 'owner' | 'admin' | 'member' | 'viewer'
```
**Problem:** Duplicates type definition, should use `PortfolioRole` from `@axori/permissions`
**Fix:**
```typescript
import type { PortfolioRole } from '@axori/permissions'
role: PortfolioRole
```

#### Issue: Type error in AddLoanDrawer
**File:** `apps/web/src/components/drawers/AddLoanDrawer.tsx:147`
**Problem:** `loanType` is `string` but should be the enum type from schema
**Fix:** Type the formData properly:
```typescript
import type { LoanInsert } from '@axori/db' // or appropriate type

const [formData, setFormData] = useState<{
  loanType: LoanInsert['loanType']
  // ... other fields
}>({
  loanType: 'conventional',
  // ...
})
```

### 2. **Centralized Constants Violation**

#### Issue: Loan types defined locally
**File:** `apps/web/src/components/drawers/AddLoanDrawer.tsx:178-190`
```typescript
const loanTypes = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  // ... 11 more types
]
```
**Problem:** Violates centralized constants pattern. Should be in `packages/shared/src/constants/`
**Fix:** Create `packages/shared/src/constants/loan-constants.ts`:
```typescript
export interface LoanTypeOption {
  value: string
  label: string
}

export const LOAN_TYPE_OPTIONS: LoanTypeOption[] = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  { value: 'va', label: 'VA' },
  { value: 'usda', label: 'USDA' },
  { value: 'dscr', label: 'DSCR' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'hard_money', label: 'Hard Money' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'heloc', label: 'HELOC' },
  { value: 'construction', label: 'Construction' },
  { value: 'owner_financed', label: 'Owner Financed' },
  { value: 'seller_finance', label: 'Seller Finance' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
]

export const LOAN_TYPE_LABELS: Record<string, string> = {
  conventional: 'Conventional',
  fha: 'FHA',
  // ... etc
}
```

### 3. **Email Template Type Safety**

#### Issue: Hardcoded role type
**File:** `packages/shared/src/email/templates.tsx:133`
```typescript
role: "admin" | "member" | "viewer"
```
**Problem:** Missing "owner" and should use `PortfolioRole` type
**Fix:**
```typescript
import type { PortfolioRole } from '@axori/permissions'
role: PortfolioRole
```

### 4. **Error Handling**

#### Issue: Generic error handling
**File:** `apps/web/src/components/invitations/InvitationAccept.tsx:59`
```typescript
catch (err: any) {
  setError(err.message || 'Failed to accept invitation')
}
```
**Problem:** Uses `any` type, should be more specific
**Fix:**
```typescript
catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Failed to accept invitation'
  setError(message)
}
```

## 📋 Action Items

### High Priority
1. ✅ **DONE:** Centralize role constants (already fixed)
2. ✅ **DONE:** Create `packages/shared/src/constants/loan-constants.ts` and move loan types
3. ✅ **DONE:** Fix type safety issues (remove `as any`, use proper types)
4. ✅ **DONE:** Update `useInvitations.ts` to use `PortfolioRole` type
5. ✅ **DONE:** Fix `AddLoanDrawer.tsx` type error for `loanType`

### Medium Priority
6. ✅ **DONE:** Update email template `PortfolioInvitationEmailProps` to use `PortfolioRole`
7. ✅ **DONE:** Improve error handling (remove `any` types)

### Low Priority
8. **TODO:** Consider extracting helper functions for role formatting
9. **TODO:** Add JSDoc comments for complex functions

## 📝 Recommendations

### 1. Create Loan Constants File
Following the pattern in `property-constants.ts`, create:
- `packages/shared/src/constants/loan-constants.ts`
- Export `LOAN_TYPE_OPTIONS`, `LOAN_TYPE_LABELS`
- Update `packages/shared/src/index.ts` to export

### 2. Type Safety Improvements
- Remove all `as any` assertions
- Use proper route types from TanStack Router
- Import and use `PortfolioRole` type consistently
- Type form data properly with inferred types from schemas

### 3. Schema Alignment
- Ensure loan types match database enum exactly
- Use `drizzle-zod` generated types where possible
- Follow type inference patterns from `.cursor/rules/type-safety.mdc`

## ✅ Compliance Checklist

- [x] Uses centralized role constants
- [x] Uses centralized loan type constants
- [x] No `as any` type assertions
- [x] Proper TypeScript types throughout
- [x] Uses design system components
- [x] Follows component placement rules
- [x] Error handling follows best practices
- [x] Email templates use centralized constants

## Summary

The branch has good structure and follows most patterns. **Most issues have been fixed:**

### ✅ Fixed
1. ✅ **Centralized loan constants** - Created `packages/shared/src/constants/loan-constants.ts`
2. ✅ **Type safety improvements** - Removed `as any`, improved error handling
3. ✅ **Consistent use of `PortfolioRole` type** - Updated `useInvitations.ts` and email templates
4. ✅ **AddLoanDrawer uses centralized constants** - Now imports `LOAN_TYPE_OPTIONS`
5. ✅ **Type safety in AddLoanDrawer** - Properly typed with `LoanInsertApi`

### ⚠️ Minor Issues Remaining
- One ESLint import order warning in `AddLoanDrawer.tsx` (cosmetic, doesn't affect functionality)

### Overall Assessment
**✅ Good** - The branch now follows project best practices:
- Uses centralized constants for roles and loan types
- Proper TypeScript types throughout
- Follows component placement rules
- Uses design system components
- Improved error handling

The branch is ready for review with only minor linting issues.
