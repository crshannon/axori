# Schema Migration: Before & After Comparison

## Table Count

| Metric | Before (ADR-001) | After (ADR-002 Revised) |
|--------|------------------|-------------------------|
| **Total Tables** | 4 | 10 (Phase 1) → 17 (Phase 5) |
| **Total Fields** | ~50 | ~200 (Phase 1) → ~300 (Phase 5) |
| **1:1 Relations** | 3 | 7 (Phase 1) |
| **1:Many Relations** | 0 | 1 (loans) |

## Table-by-Table Comparison

### `properties` Table

#### Before (ADR-001)
```typescript
{
  id: string
  portfolioId: string
  addedBy: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude: string
  longitude: string
  mapboxPlaceId: string
  fullAddress: string
  mapboxData: string
  propertyType: string  // ❌ Should be in characteristics
  status: string
  rentcastData: string
  rentcastFetchedAt: Date
  createdAt: Date
  updatedAt: Date
}
```

#### After (ADR-002 Revised)
```typescript
{
  id: string
  user_id: string         // ✅ NEW - User ownership/isolation
  portfolio_id: string
  
  // Status
  status: string
  ownership_status: string // ✅ NEW - own_rented, own_vacant, etc.
  
  // Address (ONLY address here)
  street_address: string
  unit: string
  city: string
  state: string
  zip_code: string
  county: string          // ✅ NEW
  latitude: string
  longitude: string
  
  // API Cache
  mapbox_place_id: string
  full_address: string
  mapbox_data: string
  rentcast_data: string
  rentcast_fetched_at: Date
  
  // Metadata
  nickname: string        // ✅ NEW
  notes: string           // ✅ NEW
  color_tag: string       // ✅ NEW
  
  created_at: Date
  updated_at: Date
}
```

**Changes:**
- ✅ Added `user_id` for security
- ✅ Added `ownership_status` (replaces inline rent status)
- ✅ Added metadata fields (nickname, notes, color_tag)
- ❌ Removed `propertyType` → moved to `property_characteristics`
- ❌ Removed `addedBy` → use `user_id` instead

---

### Physical Details

#### Before (ADR-001): `property_details`
```typescript
{
  id: string
  property_id: string
  beds: number
  baths: number
  sqft: number
  lot_size: number
  year_built: number
}
```

#### After (ADR-002): `property_characteristics`
```typescript
{
  property_id: string     // Primary key (1:1)
  
  // Type
  property_type: string   // ✅ Moved from properties
  unit_count: number      // ✅ NEW - for multifamily
  
  // Size
  bedrooms: number
  bathrooms: number
  square_feet: number
  lot_size_sqft: number
  stories: number         // ✅ NEW
  year_built: number
  
  // Parking
  parking_type: string    // ✅ NEW
  parking_spaces: number  // ✅ NEW
  
  // Features
  has_pool: boolean       // ✅ NEW
  has_hoa: boolean        // ✅ NEW
  
  // Construction
  construction_type: string // ✅ NEW
  roof_type: string         // ✅ NEW
  heating_type: string      // ✅ NEW
  cooling_type: string      // ✅ NEW
  
  updated_at: Date
}
```

**Changes:**
- ✅ Added 12 new fields for comprehensive property details
- ✅ Renamed `beds` → `bedrooms`, `baths` → `bathrooms`, `sqft` → `square_feet`
- ✅ Changed primary key from `id` to `property_id` (enforces 1:1)

---

### Financial Data

#### Before (ADR-001): `property_finances`
```typescript
{
  id: string
  property_id: string
  purchase_date: Date
  purchase_price: number
  closing_costs: number
  current_value: number       // ❌ Should be in valuation
  entity_type: string
  entity_name: string
  finance_type: string        // ❌ Loan data should be separate
  loan_type: string           // ❌
  loan_amount: number         // ❌
  interest_rate: number       // ❌
  loan_term: number           // ❌
  provider: string            // ❌
}
```

#### After (ADR-002): Split into 3 tables

**`property_valuation`** (Current value tracking)
```typescript
{
  property_id: string
  
  current_value: number
  current_value_source: string  // ✅ NEW
  current_value_date: Date      // ✅ NEW
  
  tax_assessed_value: number    // ✅ NEW
  tax_assessed_year: number     // ✅ NEW
  
  last_appraisal_value: number  // ✅ NEW
  last_appraisal_date: Date     // ✅ NEW
  
  insurance_replacement_value: number // ✅ NEW
  
  updated_at: Date
}
```

**`property_acquisition`** (Purchase details)
```typescript
{
  property_id: string
  
  purchase_price: number
  purchase_date: Date
  acquisition_method: string    // ✅ NEW - traditional, brrrr, etc.
  
  closing_costs_total: number
  closing_costs_breakdown: object // ✅ NEW - JSONB
  
  down_payment_amount: number   // ✅ NEW
  down_payment_source: string   // ✅ NEW
  
  earnest_money: number         // ✅ NEW
  seller_credits: number        // ✅ NEW
  
  // BRRRR (Phase 3)
  is_brrrr: boolean
  arv_at_purchase: number
  rehab_budget: number
  
  // Tax Basis (Phase 3)
  depreciation_basis: number
  land_value: number
  
  updated_at: Date
}
```

**`loans`** (Separate loan records - not inline!)
```typescript
{
  id: string                    // ✅ Own ID (one property can have multiple loans)
  property_id: string
  
  status: string                // ✅ NEW - active, paid_off, refinanced
  is_primary: boolean           // ✅ NEW
  loan_position: number         // ✅ NEW - 1st, 2nd lien
  
  lender_name: string
  servicer_name: string         // ✅ NEW
  loan_number: string           // ✅ NEW
  
  loan_type: string
  loan_purpose: string          // ✅ NEW - purchase, refi, cash-out
  
  original_loan_amount: number
  current_balance: number
  interest_rate: number
  term_months: number
  
  start_date: Date
  maturity_date: Date           // ✅ NEW (calculated)
  
  monthly_principal_interest: number
  monthly_escrow: number        // ✅ NEW
  monthly_pmi: number           // ✅ NEW
  total_monthly_payment: number
  
  // ARM, IO, Balloon (Phase 1 schema, populated later)
  is_arm: boolean
  is_interest_only: boolean
  has_balloon: boolean
  
  notes: string
  created_at: Date
  updated_at: Date
}
```

**Changes:**
- ✅ Separated valuation, acquisition, and loan data into 3 tables
- ✅ Loans now have their own `id` (supports multiple loans)
- ✅ Added comprehensive tracking for appraisals, tax assessments
- ✅ Added BRRRR and tax basis fields for Phase 3

---

### Rental & Management

#### Before (ADR-001): `property_management`
```typescript
{
  id: string
  property_id: string
  is_rented: boolean          // ❌ Use ownership_status instead
  rent_amount: number
  lease_end: Date             // ❌ Should be in leases table (Phase 4)
  tenant_name: string         // ❌ Should be in leases table
  mgmt_type: string
  pm_company: string
  strategy: string            // ❌ Not core onboarding data
}
```

#### After (ADR-002): Split into 2 tables

**`property_rental_income`** (Expected income)
```typescript
{
  property_id: string
  
  monthly_rent: number
  rent_source: string         // lease, estimate, manual
  market_rent_estimate: number // ✅ NEW
  
  rent_last_increased_date: Date    // ✅ NEW
  rent_last_increased_amount: number // ✅ NEW
  
  // Other Income Sources
  other_income_monthly: number      // ✅ NEW
  parking_income_monthly: number    // ✅ NEW
  laundry_income_monthly: number    // ✅ NEW
  pet_rent_monthly: number          // ✅ NEW
  storage_income_monthly: number    // ✅ NEW
  utility_reimbursement_monthly: number // ✅ NEW
  
  updated_at: Date
}
```

**`property_operating_expenses`** (Expected expenses)
```typescript
{
  property_id: string
  
  // Rates (for projections)
  vacancy_rate: number        // ✅ NEW
  management_rate: number     // ✅ NEW
  maintenance_rate: number    // ✅ NEW
  capex_rate: number          // ✅ NEW
  
  // Fixed Expenses
  property_tax_annual: number
  insurance_annual: number
  
  // HOA
  hoa_monthly: number
  hoa_includes: string[]      // ✅ NEW - ['water', 'trash', ...]
  hoa_special_assessment: number // ✅ NEW
  
  // Utilities (if landlord-paid)
  water_sewer_monthly: number // ✅ NEW
  trash_monthly: number       // ✅ NEW
  electric_monthly: number    // ✅ NEW
  gas_monthly: number         // ✅ NEW
  internet_monthly: number    // ✅ NEW
  
  // Services
  management_flat_fee: number // ✅ NEW
  lawn_care_monthly: number   // ✅ NEW
  snow_removal_monthly: number // ✅ NEW
  pest_control_monthly: number // ✅ NEW
  pool_maintenance_monthly: number // ✅ NEW
  alarm_monitoring_monthly: number // ✅ NEW
  
  other_expenses_monthly: number // ✅ NEW
  other_expenses_description: string // ✅ NEW
  
  updated_at: Date
}
```

**Changes:**
- ✅ Clear separation: **income** vs **expenses**
- ✅ Added itemized income sources (parking, laundry, etc.)
- ✅ Added operating rates for projections (vacancy, management, etc.)
- ✅ Added itemized utilities and services
- ❌ Removed `is_rented` → use `properties.ownership_status`
- ❌ Removed `tenant_name`, `lease_end` → Phase 4 `leases` table
- ❌ Removed `strategy` → Not core onboarding data

---

## New Tables (Phase 1)

### `property_history` (Audit Trail)
```typescript
{
  id: string
  property_id: string
  
  table_name: string          // Which table changed
  record_id: string           // For loans, leases
  field_name: string
  old_value: string
  new_value: string
  
  change_source: string       // user, rentcast, system
  change_reason: string
  changed_by: string          // user_id
  
  changed_at: Date
}
```

**Populated automatically by PostgreSQL triggers**

### `api_cache` (External API Responses)
```typescript
{
  cache_key: string           // Primary key
  provider: string            // 'rentcast', 'mapbox'
  endpoint: string
  lookup_value: string
  response_data: object       // JSONB
  created_at: Date
  expires_at: Date
  hit_count: number
  last_accessed_at: Date
}
```

**Centralizes Mapbox and Rentcast caching**

---

## Database Views

### `property_summary` (Phase 1)
Joins all property tables for easy querying:

```sql
CREATE VIEW property_summary AS
SELECT 
  p.*,
  pc.property_type, pc.bedrooms, pc.bathrooms, pc.square_feet,
  pv.current_value,
  pa.purchase_price, pa.purchase_date,
  pri.monthly_rent,
  poe.property_tax_annual, poe.insurance_annual,
  m.current_balance AS mortgage_balance,
  m.total_monthly_payment AS mortgage_payment
FROM properties p
LEFT JOIN property_characteristics pc ON pc.property_id = p.id
LEFT JOIN property_valuation pv ON pv.property_id = p.id
LEFT JOIN property_acquisition pa ON pa.property_id = p.id
LEFT JOIN property_rental_income pri ON pri.property_id = p.id
LEFT JOIN property_operating_expenses poe ON poe.property_id = p.id
LEFT JOIN loans m ON m.property_id = p.id 
  AND m.is_primary = TRUE AND m.status = 'active';
```

**Benefits:**
- Simple queries: `SELECT * FROM property_summary WHERE user_id = $1`
- Hides join complexity
- Can add indexes to view

---

## Wizard Mapping Changes

| Step | Before (ADR-001) | After (ADR-002) |
|------|------------------|-----------------|
| **Step 1: Address** | `properties` | `properties` (address + status) |
| **Step 2: Details** | `property_details` | `property_characteristics` |
| **Step 3: Ownership** | `property_finances` | `properties.ownership_status` + `property_acquisition` |
| **Step 4: Value** | `property_finances.current_value` | `property_valuation` |
| **Step 5: Rent** | `property_management` | `property_rental_income` |
| **Step 6: Mortgage** | `property_finances` (inline) | `loans` (separate record!) |
| **Step 7: Expenses** | *(missing)* | `property_operating_expenses` ✅ NEW |

---

## API Changes

### Before
```typescript
// Create property
POST /api/properties
{
  address: "123 Main St",
  city: "Austin",
  beds: 3,               // ❌ Mixed concerns
  baths: 2,
  purchasePrice: 400000, // ❌ Mixed concerns
  loanAmount: 320000,    // ❌ Inline loan
  rentAmount: 2500       // ❌ Mixed concerns
}

// Returns flat object
```

### After
```typescript
// Create property (transaction-wrapped)
POST /api/properties
{
  // Core
  address: "123 Main St",
  city: "Austin",
  ownership_status: "own_rented",
  
  // Characteristics
  characteristics: {
    property_type: "SFR",
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1800
  },
  
  // Valuation
  valuation: {
    current_value: 450000,
    current_value_source: "estimate"
  },
  
  // Acquisition
  acquisition: {
    purchase_price: 400000,
    purchase_date: "2023-01-15",
    down_payment_amount: 80000
  },
  
  // Rental Income
  rental_income: {
    monthly_rent: 2500,
    rent_source: "lease"
  },
  
  // Operating Expenses
  operating_expenses: {
    property_tax_annual: 6000,
    insurance_annual: 1200
  },
  
  // Loan (separate)
  mortgage: {
    lender_name: "Wells Fargo",
    original_loan_amount: 320000,
    current_balance: 320000,
    interest_rate: 0.065,
    term_months: 360
  }
}

// Returns with relations
{
  ...property,
  characteristics: {...},
  valuation: {...},
  acquisition: {...},
  rental_income: {...},
  operating_expenses: {...},
  loans: [...]
}
```

---

## Security Improvements

### Before (ADR-001)
```typescript
// ❌ NO user filtering - all properties visible to all users!
const properties = await db.select().from(properties)
```

### After (ADR-002)
```typescript
// ✅ User isolation enforced
const properties = await db
  .select()
  .from(properties)
  .where(eq(properties.user_id, authenticatedUserId))
```

**Critical security fix per Architect Skill guidelines!**

---

## Benefits Summary

| Benefit | Description |
|---------|-------------|
| 🔒 **Security** | User data isolation via `user_id` |
| 📊 **Normalized** | Each table has single responsibility |
| 🔍 **Queryable** | Can filter/sort on any field efficiently |
| 📝 **Audit Trail** | Automatic history tracking via triggers |
| 🎯 **Type Safe** | Drizzle relations provide full type safety |
| 🚀 **Scalable** | Easy to add fields without bloating tables |
| 💰 **Budget vs Actuals** | Clear separation (Phase 2 adds transactions) |
| 📈 **Analytics Ready** | Clean data for NOI, cash flow, portfolio metrics |

---

## Migration Path

1. ✅ Create new normalized tables
2. ✅ Migrate data from old tables
3. ✅ Update API routes to use new tables
4. ✅ Update wizard to save to new tables
5. ✅ Update hooks to load from new tables
6. ✅ Test thoroughly
7. ✅ Drop old tables

**Zero downtime possible with careful migration strategy!**

