# Tax Shield Calculations - Execution Plan

**Plan Version:** 007  
**Created:** 2024-12-19  
**Status:** Planning

## Current State Analysis

### What Exists Now

**File:** `apps/web/src/components/property-hub/property-details/financials/TaxShieldIntel.tsx`

**Current Implementation:**
```typescript
// TODO: Calculate actual unclaimed depreciation from property data
// For now, using placeholder value
const unclaimedDepreciation = 42100
const costSegPotential = 'High Alpha'
const costSegPercentage = 85
```

**Available Data:**
- `property.acquisition.purchaseDate` - Purchase date of the property
- `property.acquisition.depreciationBasis` - Depreciation basis (cost basis for depreciation)
- `property.characteristics.propertyType` - Property type ("SFR", "Duplex", "Triplex", "Fourplex", "Condo", "Townhouse", "Multifamily")

**Missing:**
- Calculation logic for unclaimed depreciation
- Logic to determine if property is residential (27.5 years) vs commercial (39 years)
- Cost segregation potential calculation based on depreciation basis
- Utility functions for reuse

### Issues/Problems

1. Hardcoded placeholder values don't reflect actual property data
2. No calculation logic exists for tax shield metrics
3. Property type to depreciation schedule mapping is not implemented
4. Cost segregation calculations are not based on real data

## Implementation Phases

### Phase 1: Create Calculation Utilities

**Goal:** Create reusable utility functions for tax shield calculations

**Steps:**
1. [ ] Create `apps/web/src/utils/taxShieldCalculations.ts` utility file
2. [ ] Implement `getDepreciationSchedule()` - Returns 27.5 or 39 years based on property type
3. [ ] Implement `calculateUnclaimedDepreciation()` - Calculates unclaimed depreciation based on purchase date, basis, and schedule
4. [ ] Implement `calculateCostSegPotential()` - Calculates cost seg percentage and level
5. [ ] Add proper TypeScript types and JSDoc comments
6. [ ] Handle edge cases (missing dates, null values, future dates)

**File to Create:**
- `apps/web/src/utils/taxShieldCalculations.ts`

**Expected Functions:**

```typescript
/**
 * Determines depreciation schedule based on property type
 * Residential: 27.5 years (SFR, Duplex, Triplex, Fourplex, Condo, Townhouse)
 * Commercial: 39 years (Multifamily 5+ units or commercial)
 */
export function getDepreciationSchedule(propertyType: string): number

/**
 * Calculates unclaimed depreciation from purchase date to current date
 * Returns null if required data is missing
 */
export function calculateUnclaimedDepreciation(
  purchaseDate: string | null,
  depreciationBasis: number | null,
  depreciationSchedule: number
): number | null

/**
 * Calculates cost segregation potential as percentage and level
 * Returns { percentage: number, level: 'High Alpha' | 'Medium' | 'Low' }
 */
export function calculateCostSegPotential(
  depreciationBasis: number | null
): { percentage: number; level: 'High Alpha' | 'Medium' | 'Low' } | null
```

### Phase 2: Integrate Calculations into Component

**Goal:** Replace placeholder values with calculated values in `TaxShieldIntel`

**Steps:**
1. [ ] Import calculation utilities into `TaxShieldIntel.tsx`
2. [ ] Get property type from `property.characteristics.propertyType`
3. [ ] Calculate depreciation schedule using `getDepreciationSchedule()`
4. [ ] Calculate unclaimed depreciation using `calculateUnclaimedDepreciation()`
5. [ ] Calculate cost segregation potential using `calculateCostSegPotential()`
6. [ ] Update component to use calculated values instead of placeholders
7. [ ] Handle null/missing data gracefully with fallback UI

**File to Modify:**
- `apps/web/src/components/property-hub/property-details/financials/TaxShieldIntel.tsx`

**Expected Changes:**

```typescript
// Replace lines 28-32 with:
import { 
  getDepreciationSchedule, 
  calculateUnclaimedDepreciation,
  calculateCostSegPotential 
} from '@/utils/taxShieldCalculations'

// Inside component:
const propertyType = property.characteristics?.propertyType
const depreciationSchedule = propertyType 
  ? getDepreciationSchedule(propertyType) 
  : 27.5 // Default to residential

const unclaimedDepreciation = calculateUnclaimedDepreciation(
  acquisition?.purchaseDate || null,
  depreciationBasis,
  depreciationSchedule
) ?? 0 // Fallback to 0 if null

const costSeg = calculateCostSegPotential(depreciationBasis)
const costSegPotential = costSeg?.level ?? 'Low'
const costSegPercentage = costSeg?.percentage ?? 0
```

### Phase 3: Testing & Validation

**Goal:** Ensure calculations work correctly for all property types and edge cases

**Steps:**
1. [ ] Test with residential property types (SFR, Duplex, Condo, etc.)
2. [ ] Test with commercial property type (Multifamily)
3. [ ] Test with missing purchase date
4. [ ] Test with missing depreciation basis
5. [ ] Test with null property type
6. [ ] Test with future purchase dates
7. [ ] Test with very old purchase dates (20+ years)
8. [ ] Verify cost segregation percentage ranges (20-40% typical)

**Test Cases:**
- Residential property purchased 3 years ago with $500k basis
- Commercial property purchased 10 years ago with $1M basis
- Property with missing purchase date
- Property with missing depreciation basis
- Property purchased yesterday (minimal unclaimed depreciation)
- Property purchased 30 years ago (maximum depreciation period)

## Calculation Details

### Depreciation Schedule
- **Residential** (SFR, Duplex, Triplex, Fourplex, Condo, Townhouse): **27.5 years**
- **Commercial** (Multifamily 5+ units, Commercial): **39 years**
- **Default**: If property type is unclear, default to 27.5 years

### Unclaimed Depreciation Formula
```
Annual Depreciation = Depreciation Basis / Depreciation Schedule
Months Owned = (Current Date - Purchase Date) in months
Unclaimed Depreciation = Annual Depreciation × (Months Owned / 12)
```

**Edge Cases:**
- If purchase date is in the future → return 0
- If purchase date or basis is null → return null
- Round to nearest dollar

### Cost Segregation Potential
- **Percentage**: Estimate based on typical cost segregation results (20-40% of basis)
  - For now, use a calculated estimate: `basis > 500k ? 35% : basis > 200k ? 30% : 25%`
  - Future: Could be based on property features (improvements, fixtures, etc.)
- **Level Classification**:
  - **High Alpha**: ≥30%
  - **Medium**: 15-29%
  - **Low**: <15%

## File Changes Summary

### New Files
- `apps/web/src/utils/taxShieldCalculations.ts` - Calculation utilities

### Modified Files
- `apps/web/src/components/property-hub/property-details/financials/TaxShieldIntel.tsx` - Replace placeholders with calculations

## Testing Strategy

### Unit Tests (Manual)
1. Test each utility function with various inputs
2. Verify depreciation schedule mapping
3. Verify unclaimed depreciation calculations with known values
4. Verify cost segregation classification

### Integration Tests (Manual)
1. Load property with all data present → verify calculations display
2. Load property with missing purchase date → verify graceful handling
3. Load property with missing basis → verify graceful handling
4. Test with different property types → verify correct schedules

## Rollback Plan

If issues arise:
1. Revert `TaxShieldIntel.tsx` changes
2. Restore placeholder values temporarily
3. Keep utility file for future use but don't import it
4. Investigate issues and fix before re-integrating

## Success Criteria

- [ ] `TaxShieldIntel` displays calculated unclaimed depreciation based on actual property data
- [ ] Cost segregation potential is calculated and displayed correctly
- [ ] Component handles missing data gracefully (shows 0 or "N/A" instead of errors)
- [ ] Calculations work for both residential and commercial property types
- [ ] No TypeScript or runtime errors
- [ ] Component still displays correctly in UI

