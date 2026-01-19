# ADR-002: Comprehensive Property Model Migration (REVISED)

**Status**: Proposed  
**Date**: 2026-01-10 (Revised)  
**Author**: AI + Craig Shannon  
**Supersedes**: [ADR-001](./001-property-schema-refactoring.md)

## Context

### Current State (ADR-001)

Our current schema has 4 tables:

- `properties` - Address, geocoding, property type, status
- `property_details` - Beds, baths, sqft, lot size, year built
- `property_finances` - Purchase info, loan details
- `property_management` - Rental status, management type

**Total**: ~50 fields across 4 tables

### Desired State (axori-property-data-model.md - REVISED)

**Highly normalized architecture** with separate concerns:

```
properties (minimal core: address, status, metadata only)
├── property_characteristics (physical: beds, baths, sqft, parking, pool, etc.)
├── property_valuation (current value, appraisals, tax assessed)
├── property_acquisition (purchase, closing, BRRRR, tax basis)
├── property_rental_income (rent, other income sources - budgeted)
├── property_operating_expenses (taxes, insurance, utilities - budgeted)
├── property_images (photos, floorplans)
├── property_documents (leases, tax bills, receipts, AI processing)
│
├── loans (loans: terms, rates, payments, ARM/IO/balloon)
│   └── loan_history (balance updates, rate changes, payments)
│
├── leases (tenant leases: terms, deposits, fees)
│
├── property_expenses (actual expense transactions)
├── property_income (actual income transactions)
│
└── property_history (audit trail for all property table changes)

user
├── freedom_profiles (FIRE goals, expenses, assets)
└── projection_assumptions (portfolio modeling parameters)

cache
└── api_cache (Rentcast, Mapbox responses)
```

**Total**: 300+ fields across 17 tables

### Key Architecture Improvements

1. **Minimal Core Table** - `properties` only has address, status, metadata
2. **1:1 Related Tables** - Each concern in its own table (characteristics, valuation, etc.)
3. **Separate Budget vs Actuals** - `property_rental_income` (budget) vs `property_income` (transactions)
4. **History Tracking** - Automatic audit trail via PostgreSQL triggers
5. **Database Views** - `property_summary` joins all tables for easy querying
6. **Proper Normalization** - No redundant data, clean relationships

## Decision

**Implement a 5-phase migration** with the revised normalized structure.

### Phase 1: Core Property Data (IMMEDIATE)

**Timeline**: Week 1-2  
**Goal**: Establish normalized foundation for onboarding

#### Schema Changes

**1. Simplify `properties` table** (keep minimal):

```sql
-- REMOVE fields that belong in other tables:
-- beds, baths, sqft, year built, lot size → property_characteristics
-- purchase price/date, loan fields → property_acquisition + loans
-- rent fields → property_rental_income
-- expense fields → property_operating_expenses

-- KEEP only:
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- Add user ownership!
  portfolio_id UUID REFERENCES portfolios(id),  -- Keep for multi-user portfolios

  -- Status
  status TEXT DEFAULT 'active',
  ownership_status TEXT NOT NULL,  -- own_rented, own_vacant, under_contract, exploring

  -- Address (core)
  street_address TEXT NOT NULL,
  unit TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  county TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),

  -- Mapbox cache
  mapbox_place_id TEXT,
  full_address TEXT,
  mapbox_data TEXT,  -- JSON

  -- Rentcast cache
  rentcast_data TEXT,  -- JSON
  rentcast_fetched_at TIMESTAMPTZ,

  -- Metadata
  nickname TEXT,
  notes TEXT,
  color_tag TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_portfolio_id ON properties(portfolio_id);
```

**2. Create `property_characteristics`:**

```sql
CREATE TABLE property_characteristics (
  property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,

  property_type TEXT NOT NULL,
  unit_count INTEGER DEFAULT 1,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  square_feet INTEGER,
  lot_size_sqft INTEGER,
  stories INTEGER,
  year_built INTEGER,

  parking_type TEXT,
  parking_spaces INTEGER,

  has_pool BOOLEAN DEFAULT FALSE,
  has_hoa BOOLEAN DEFAULT FALSE,

  construction_type TEXT,
  roof_type TEXT,
  heating_type TEXT,
  cooling_type TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**3. Create `property_valuation`:**

```sql
CREATE TABLE property_valuation (
  property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,

  current_value NUMERIC(12,2),
  current_value_source TEXT,
  current_value_date DATE,

  tax_assessed_value NUMERIC(12,2),
  tax_assessed_year INTEGER,

  last_appraisal_value NUMERIC(12,2),
  last_appraisal_date DATE,

  insurance_replacement_value NUMERIC(12,2),

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**4. Create `property_acquisition`:**

```sql
CREATE TABLE property_acquisition (
  property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,

  purchase_price NUMERIC(12,2),
  purchase_date DATE,
  acquisition_method TEXT,

  closing_costs_total NUMERIC(10,2),
  down_payment_amount NUMERIC(12,2),
  down_payment_source TEXT,

  earnest_money NUMERIC(10,2),
  seller_credits NUMERIC(10,2),

  -- BRRRR (Phase 3)
  is_brrrr BOOLEAN DEFAULT FALSE,
  arv_at_purchase NUMERIC(12,2),
  rehab_budget NUMERIC(10,2),

  -- Tax Basis (Phase 3)
  depreciation_basis NUMERIC(12,2),
  land_value NUMERIC(12,2),

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**5. Create `property_rental_income`:**

```sql
CREATE TABLE property_rental_income (
  property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,

  monthly_rent NUMERIC(10,2),
  rent_source TEXT,
  market_rent_estimate NUMERIC(10,2),

  other_income_monthly NUMERIC(10,2) DEFAULT 0,
  parking_income_monthly NUMERIC(10,2) DEFAULT 0,
  laundry_income_monthly NUMERIC(10,2) DEFAULT 0,
  pet_rent_monthly NUMERIC(10,2) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**6. Create `property_operating_expenses`:**

```sql
CREATE TABLE property_operating_expenses (
  property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,

  -- Rates (for projections)
  vacancy_rate NUMERIC(5,4) DEFAULT 0.05,
  management_rate NUMERIC(5,4) DEFAULT 0.10,
  maintenance_rate NUMERIC(5,4) DEFAULT 0.05,
  capex_rate NUMERIC(5,4) DEFAULT 0.05,

  -- Fixed Expenses
  property_tax_annual NUMERIC(10,2),
  insurance_annual NUMERIC(10,2),

  -- HOA
  hoa_monthly NUMERIC(10,2) DEFAULT 0,

  -- Utilities (if landlord-paid)
  water_sewer_monthly NUMERIC(10,2) DEFAULT 0,
  electric_monthly NUMERIC(10,2) DEFAULT 0,
  gas_monthly NUMERIC(10,2) DEFAULT 0,

  -- Services
  lawn_care_monthly NUMERIC(10,2) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**7. Create `loans`:**

```sql
CREATE TABLE loans (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'active',
  is_primary BOOLEAN DEFAULT TRUE,
  loan_position INTEGER DEFAULT 1,

  lender_name TEXT NOT NULL,
  loan_type TEXT DEFAULT 'conventional',

  original_loan_amount NUMERIC(12,2) NOT NULL,
  current_balance NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(6,5) NOT NULL,
  term_months INTEGER NOT NULL,

  start_date DATE,
  maturity_date DATE,

  monthly_principal_interest NUMERIC(10,2),
  monthly_escrow NUMERIC(10,2) DEFAULT 0,
  monthly_pmi NUMERIC(10,2) DEFAULT 0,
  total_monthly_payment NUMERIC(10,2),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loans_property_id ON loans(property_id);
CREATE UNIQUE INDEX idx_loans_primary
  ON loans(property_id)
  WHERE is_primary = TRUE AND status = 'active';
```

**8. Create `property_history`:**

```sql
CREATE TABLE property_history (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,

  table_name TEXT NOT NULL,
  record_id UUID,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,

  change_source TEXT NOT NULL,  -- user, rentcast, system
  change_reason TEXT,
  changed_by UUID REFERENCES users(id),

  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_history_property_id ON property_history(property_id);
CREATE INDEX idx_property_history_table ON property_history(table_name);
CREATE INDEX idx_property_history_changed_at ON property_history(changed_at DESC);
```

**9. Create history triggers** (see axori-property-data-model.md for full implementation)

**10. Create `property_summary` view:**

```sql
CREATE VIEW property_summary AS
SELECT
  p.*,
  pc.property_type, pc.bedrooms, pc.bathrooms, pc.square_feet,
  pv.current_value,
  pa.purchase_price, pa.purchase_date,
  pri.monthly_rent,
  poe.property_tax_annual, poe.insurance_annual,
  m.current_balance AS loan_balance,
  m.total_monthly_payment AS loan_payment
FROM properties p
LEFT JOIN property_characteristics pc ON pc.property_id = p.id
LEFT JOIN property_valuation pv ON pv.property_id = p.id
LEFT JOIN property_acquisition pa ON pa.property_id = p.id
LEFT JOIN property_rental_income pri ON pri.property_id = p.id
LEFT JOIN property_operating_expenses poe ON poe.property_id = p.id
LEFT JOIN loans m ON m.property_id = p.id
  AND m.is_primary = TRUE AND m.status = 'active';
```

#### Critical Change: Add `user_id` to properties

**Security Fix** (from Architect Skill):

```sql
ALTER TABLE properties ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_properties_user_id ON properties(user_id);
```

This enables **user data isolation** - each user only sees their own properties.

#### UI Changes (Add Property Wizard)

**Restructured to match new tables:**

- **Step 1: Address** → `properties`
- **Step 2: Property Details** → `property_characteristics`
- **Step 3: Ownership Status** → `properties.ownership_status`, `property_acquisition`
- **Step 4: Value** → `property_valuation`
- **Step 5: Rent** → `property_rental_income`
- **Step 6: Mortgage** → `loans` (separate record!)
- **Step 7: Expenses** → `property_operating_expenses`

---

### Phase 2: Transaction Tracking (MEDIUM)

**Timeline**: Week 3-4

Create:

- `property_expenses` - Actual expense transactions
- `property_income` - Actual income transactions
- UI for adding/editing transactions

---

### Phase 3: Advanced Acquisition (ADVANCED)

**Timeline**: Week 5-6

Expand:

- `property_acquisition` - BRRRR fields, tax basis, depreciation
- UI for BRRRR calculator, depreciation tracker

---

### Phase 4: Lease Management (ADVANCED)

**Timeline**: Week 7-8

Create:

- `leases` - Tenant lease management
- UI for lease creation, renewals, termination

---

### Phase 5: Documents & Images (POLISH)

**Timeline**: Week 9-10

Create:

- `property_documents` - Document storage with AI extraction
- `property_images` - Photo management
- `loan_history` - Loan payment history
- UI for uploads, viewing, AI processing

---

## Implementation Strategy

### Architect Skill Alignment

1. ✅ **Drizzle Schema** - One table per file in `packages/db/src/schema/`
2. ✅ **camelCase in code** - `propertyType`, maps to `property_type` in DB
3. ✅ **Type Inference** - `InferSelectModel<typeof propertyCharacteristics>`
4. ✅ **Zod Validation** - Match DB constraints exactly
5. ✅ **User Data Isolation** - `user_id` foreign key + API filtering
6. ✅ **Relations** - Drizzle `relations()` for type-safe joins
7. ✅ **Views** - Use for common queries

### Migration Safety

```sql
-- Step 1: Add new tables (Phase 1)
CREATE TABLE property_characteristics (...);
CREATE TABLE property_valuation (...);
-- etc.

-- Step 2: Migrate data from old tables
INSERT INTO property_characteristics (property_id, bedrooms, bathrooms, ...)
SELECT id, beds, baths, ... FROM property_details;

-- Step 3: Drop old tables (after confirming data migrated)
DROP TABLE property_details;
DROP TABLE property_finances;
DROP TABLE property_management;
```

### Database Triggers

Use PostgreSQL triggers for automatic history tracking:

```sql
CREATE TRIGGER characteristics_history_trigger
  BEFORE UPDATE ON property_characteristics
  FOR EACH ROW EXECUTE FUNCTION track_property_related_changes();
```

## Consequences

### Positive

✅ **Clean Separation** - Each table has a single responsibility  
✅ **Easily Extensible** - Add fields to specific tables without bloating others  
✅ **Queryable** - Can filter/sort on any field  
✅ **Audit Trail** - Automatic history tracking  
✅ **Views Simplify** - Complex joins hidden behind views  
✅ **User Isolation** - Security built into schema  
✅ **Budget vs Actuals** - Clear distinction between projections and reality

### Negative

⚠️ **More Tables** - 17 tables vs 4 tables  
⚠️ **More Joins** - Fetching full property requires many joins (mitigated by views)  
⚠️ **More Migrations** - Each table change requires migration  
⚠️ **Transaction Coordination** - Must wrap multi-table saves in DB transactions

### Mitigation

1. **Use Views** - `property_summary` hides join complexity
2. **Drizzle Relations** - `.with()` makes joins type-safe and easy
3. **Transactions** - Wrap related saves in single transaction
4. **Caching** - Cache frequently accessed property summaries
5. **Incremental** - Phase approach reduces risk

## Alternatives Considered

### Alternative 1: Wide Properties Table

**Pros**: Simple, one table  
**Cons**: 100+ columns, poor normalization, hard to extend  
**Verdict**: ❌ Rejected - Doesn't scale

### Alternative 2: EAV (Entity-Attribute-Value)

**Pros**: Infinitely flexible  
**Cons**: Complex queries, no type safety, performance issues  
**Verdict**: ❌ Rejected - Anti-pattern for structured data

### Alternative 3: JSON Columns

**Pros**: Flexible, fewer tables  
**Cons**: Not queryable, no validation, loses type safety  
**Verdict**: ❌ Rejected - Loses SQL benefits

## Next Steps

1. ✅ **Review & Approve** this ADR
2. **Implement Phase 1**:
   - Define Drizzle schemas
   - Export TypeScript types
   - Create Zod validation
   - Generate migrations
   - Update wizard UI
   - Update API routes
   - Test end-to-end

## Related

- [ADR-001: Property Schema Refactoring](./001-property-schema-refactoring.md) - Initial schema
- [Property Data Model](./axori-property-data-model.md) - Complete target schema
- [Architect Skill](../../.skills/architect/SKILL.md) - Development guidelines

## References

- Database Normalization: https://en.wikipedia.org/wiki/Database_normalization
- PostgreSQL Triggers: https://www.postgresql.org/docs/current/triggers.html
- Drizzle Relations: https://orm.drizzle.team/docs/rqb#select-with-relations
