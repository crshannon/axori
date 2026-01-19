# Terminology Update: `mortgages` → `loans`

**Date**: 2026-01-10  
**Status**: Applied

## Rationale

The table name `mortgages` was too narrow for a system that tracks:
- Traditional mortgages (conventional, FHA, VA, USDA)
- Hard money loans
- HELOCs (Home Equity Lines of Credit)
- Seller financing
- Portfolio loans
- Commercial loans

**New name**: `loans` - More accurate umbrella term that covers all financing types.

## Changes Applied

### Database Schema

| Old Name | New Name | Type |
|----------|----------|------|
| `mortgages` | `loans` | Table |
| `mortgage_history` | `loan_history` | Table |
| `mortgage_id` | `loan_id` | Foreign key column |
| `idx_mortgages_*` | `idx_loans_*` | Indexes |

### Field Name

The `loan_type` field clearly indicates what kind of financing:

```typescript
loan_type: 
  | "conventional"    // Traditional mortgage
  | "fha"            // Government-backed
  | "va"
  | "usda"
  | "dscr"           // Investor loan (Debt Service Coverage Ratio)
  | "hard_money"     // Bridge/rehab financing
  | "heloc"          // Home Equity Line of Credit
  | "seller_finance" // Owner financing
  | "portfolio"      // Non-QM, held by lender
  | "commercial"     // Commercial property loan
```

## Documentation Updated

✅ **ADR-002** - Comprehensive Property Model Migration  
✅ **Schema Migration Comparison** - Before/after comparison  
✅ **Loan & Financing Tracking** (renamed from Mortgage & Financing Tracking)  
✅ **Axori Property Data Model** - Main schema document  
✅ **Architecture README** - Documentation index  

## API Changes

### Endpoints (Updated Naming)

```typescript
// Old
POST   /api/mortgages
GET    /api/mortgages/:id
PATCH  /api/mortgages/:id
DELETE /api/mortgages/:id
POST   /api/mortgages/:id/payment
POST   /api/mortgages/:id/refinance

// New
POST   /api/loans
GET    /api/loans/:id
PATCH  /api/loans/:id
DELETE /api/loans/:id
POST   /api/loans/:id/payment
POST   /api/loans/:id/refinance
```

### Type Names

```typescript
// Old
type Mortgage = { ... }
type MortgageInsert = { ... }
type MortgageHistory = { ... }

// New
type Loan = { ... }
type LoanInsert = { ... }
type LoanHistory = { ... }
```

## Wizard Changes

**Step 6** renamed:
- Old: "Mortgage"
- New: "Financing" or "Loan"

This better represents the diversity of financing options available.

## Benefits

1. **Accurate Terminology** - "Loans" covers all financing types
2. **Industry Standard** - Banks and financial systems use "loans"
3. **Future-Proof** - Easy to add new financing types
4. **Clearer Intent** - Loan type explicitly stated in `loan_type` field
5. **Better UX** - Users understand "loan" better than "mortgage" for hard money/HELOC

## Related Documents

- [Loan & Financing Tracking](./loan-financing-tracking.md) - Complete guide
- [ADR-002](./002-comprehensive-property-model-migration.md) - Migration plan
- [Axori Property Data Model](./axori-property-data-model.md) - Full schema

