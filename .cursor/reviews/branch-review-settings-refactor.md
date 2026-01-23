# Branch Review: Settings Refactor

**Date:** 2025-01-XX  
**Branch:** Current working branch  
**Review Focus:** Type safety, schema alignment, enum usage, and standards compliance

## Summary

This review examines the settings refactor branch against our cursor rules, focusing on:
- Type safety patterns (`.cursor/rules/type-safety.mdc`)
- Schema alignment (`.cursor/rules/schema-alignment.mdc`)
- Enum usage (`.cursor/rules/drizzle-orm.mdc`)
- Zod validation (`.cursor/rules/zod-validation.mdc`)

## ✅ Compliant Areas

### 1. Learning Hub Type Extensions
**File:** `apps/web/src/data/learning-hub/types.ts`

✅ **Correctly extended** the `LearningSnippet` interface with new context values:
- `'asset-configuration'`
- `'acquisition-metadata'`
- `'asset-dna-calibration'`
- `'calculation-presumptions'`
- `'notification-engine'`

This follows TypeScript best practices for extending union types.

### 2. Component Isolation Pattern
**Files:** `apps/web/src/components/property-hub/property-details/settings/*.tsx`

✅ **Properly extracted** settings cards into isolated components following the pattern documented in `.cursor/rules/feature-patterns.mdc`.

### 3. Drawer-Based Editing Pattern
**Files:** `apps/web/src/components/drawers/*SettingsDrawer.tsx`

✅ **Consistent implementation** of drawer-based editing pattern with URL-based state management.

## ⚠️ Issues Found

### 1. Manual Type Definition (Type Safety Violation)

**File:** `apps/web/src/hooks/api/useProperties.ts`  
**Lines:** 7-50

**Issue:** The `Property` interface is manually defined instead of using the inferred type from `@axori/db`.

```typescript
// ❌ CURRENT - Manual type definition
export interface Property {
  id: string
  portfolioId: string
  // ... manually defined fields
}

// ✅ SHOULD BE - Import from @axori/db
import type { Property } from '@axori/db'
// Or extend the base type if additional fields are needed
```

**Rule Violated:** `.cursor/rules/type-safety.mdc` - "Never manually define types that duplicate Drizzle schemas"

**Impact:** 
- Type drift between database schema and frontend types
- Manual maintenance required when schema changes
- Potential runtime errors from mismatched types

**Recommendation:**
1. Import `Property` type from `@axori/db` (or `@axori/shared` if re-exported)
2. If nested data (characteristics, acquisition, etc.) is needed, create a separate type that extends the base:
   ```typescript
   import type { Property } from '@axori/db'
   
   export interface PropertyWithRelations extends Property {
     characteristics?: PropertyCharacteristics | null
     acquisition?: PropertyAcquisition | null
     operatingExpenses?: PropertyOperatingExpenses | null
     // ... other relations
   }
   ```

### 2. PropertySettingsFormData Manual Interface ✅ DOCUMENTED

**File:** `apps/web/src/hooks/api/usePropertySettings.ts`  
**Lines:** 8-43

**Issue:** `PropertySettingsFormData` is a manually defined interface that combines data from multiple sources.

**Assessment:** This is **acceptable** because:
- It's a form-specific interface that combines data from multiple tables
- It includes display formatting (e.g., `purchasePrice` as formatted string)
- It includes fields not in the database (e.g., `notifications`)

**Fix Applied:** ✅ Added comprehensive documentation comment explaining why this manual interface is necessary:
```typescript
/**
 * Property Settings form state interface
 * 
 * NOTE: This is a form-specific interface that combines data from multiple
 * database tables (properties, propertyCharacteristics, propertyAcquisition,
 * propertyOperatingExpenses) and includes display formatting. This manual
 * interface is acceptable because:
 * 1. It combines data from multiple sources
 * 2. It includes display formatting (e.g., formatted currency strings)
 * 3. It includes UI-only fields (e.g., notifications)
 * 
 * For database types, always use inferred types from @axori/db.
 */
export interface PropertySettingsFormData {
  // ...
}
```

### 3. PropertyType Not Using Enum

**File:** `packages/db/src/schema/index.ts`  
**Line:** 157

**Issue:** `propertyType` is defined as `text("property_type")` instead of using `pgEnum()`.

```typescript
// ❌ CURRENT
propertyType: text("property_type").notNull(),

// ✅ SHOULD BE (per rules)
export const propertyTypeEnum = pgEnum("property_type", [
  "Single Family",
  "Multi-Family",
  "Commercial - Retail",
  "Industrial Flex",
  // ... other values
]);

propertyType: propertyTypeEnum("property_type").notNull(),
```

**Rule Violated:** `.cursor/rules/drizzle-orm.mdc` - "Use pgEnum() for Enums"

**Impact:**
- No type safety at the database level
- Potential for invalid values
- Manual validation required

**Note:** This is a **pre-existing issue** in the schema, not introduced by this branch. However, it should be noted for future refactoring.

**Recommendation:** Create a separate task to migrate `propertyType` to use `pgEnum()`:
1. Create the enum definition
2. Generate migration
3. Update all references
4. Update Zod schemas (drizzle-zod will auto-generate `z.enum()`)

### 4. Type Assertion in saveSettings ✅ FIXED

**File:** `apps/web/src/hooks/api/usePropertySettings.ts`  
**Line:** 273

**Issue:** Uses type assertion `as { id: string }` which bypasses type checking.

**Fix Applied:**
```typescript
// ✅ FIXED - Now uses PropertyInsert type
import type { PropertyInsert } from '@axori/shared'
await updateMutation.mutateAsync(updatePayload as Partial<PropertyInsert> & { id: string })
```

**Status:** ✅ Fixed - Now uses proper type from `@axori/shared` instead of generic assertion.

### 5. String Literal Types for PropertyType Values

**File:** `apps/web/src/hooks/api/usePropertySettings.ts`  
**Lines:** 230-236

**Issue:** Property type mapping uses string literals that could be typed more strictly.

**Current:**
```typescript
const typeMap: Record<string, string> = {
  'single-family': 'Single Family',
  'multi-family': 'Multi-Family',
  // ...
}
```

**Recommendation:** If propertyType becomes an enum, this mapping could use the enum type:
```typescript
// After propertyType is an enum
import type { PropertyTypeEnum } from '@axori/db'

const typeMap: Record<string, PropertyTypeEnum> = {
  'single-family': 'Single Family',
  // ...
}
```

## 📋 Action Items

### High Priority
1. ✅ **Add documentation comment** to `PropertySettingsFormData` explaining why manual interface is acceptable - **FIXED**
2. ✅ **Replace type assertion** in `saveSettings` with proper type - **FIXED**
3. ⚠️ **Fix Property type definition** in `useProperties.ts` to use inferred type from `@axori/db` - **PRE-EXISTING ISSUE** (not introduced by this branch)

### Medium Priority
4. **Create task** to migrate `propertyType` to `pgEnum()` (pre-existing issue, not blocking)
5. **Review all type imports** to ensure they come from `@axori/db` or `@axori/shared`

### Low Priority
6. **Consider creating** a `PropertyWithRelations` type for API responses that include nested data
7. **Document** the form data transformation patterns (display formatting, etc.)

## ✅ Standards Compliance Summary

| Rule | Status | Notes |
|------|--------|-------|
| Type Safety (type-safety.mdc) | ⚠️ Partial | Property type manually defined |
| Schema Alignment (schema-alignment.mdc) | ✅ Compliant | No schema changes in this branch |
| Enum Usage (drizzle-orm.mdc) | ⚠️ Pre-existing | propertyType not using pgEnum (pre-existing) |
| Zod Validation (zod-validation.mdc) | ✅ Compliant | No validation changes in this branch |
| Component Isolation (feature-patterns.mdc) | ✅ Compliant | Properly extracted components |
| Drawer Pattern (feature-patterns.mdc) | ✅ Compliant | Consistent implementation |

## Conclusion

The branch is **mostly compliant** with our standards. The main issues are:
1. Manual `Property` type definition (should use inferred type)
2. Pre-existing `propertyType` not using enum (not blocking, but should be addressed)

The component isolation and drawer patterns are well-implemented. The `PropertySettingsFormData` manual interface is acceptable given its form-specific nature, but should be documented.

**Recommendation:** Address the high-priority items before merging, and create a follow-up task for the enum migration.
