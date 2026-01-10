# Axori Property Data Model

## Collection Phase Legend

| Symbol | Phase |
|--------|-------|
| 🟢 | Onboarding |
| 🔵 | Property Page |
| 🟣 | Document AI |
| 🟡 | Integration |
| ⚪ | Calculated |

---

## Tables

### `properties`

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',           -- 🟢 active, sold, pending, archived
  ownership_status TEXT NOT NULL,                  -- 🟢 own_rented, own_vacant, under_contract, exploring
  
  -- Address
  street_address TEXT NOT NULL,                    -- 🟢
  unit TEXT,                                       -- 🟢
  city TEXT NOT NULL,                              -- 🟢
  state TEXT NOT NULL,                             -- 🟢
  zip_code TEXT NOT NULL,                          -- 🟢
  county TEXT,                                     -- 🔵
  country TEXT DEFAULT 'US',                       -- 🔵
  latitude NUMERIC(10,7),                          -- 🟢
  longitude NUMERIC(10,7),                         -- 🟢
  
  -- Characteristics
  property_type TEXT NOT NULL,                     -- 🟢 SFR, Duplex, Triplex, Fourplex, Condo, Townhouse, Multifamily
  unit_count INTEGER DEFAULT 1,                    -- 🔵
  bedrooms INTEGER,                                -- 🟢
  bathrooms NUMERIC(3,1),                          -- 🟢
  square_feet INTEGER,                             -- 🟢
  year_built INTEGER,                              -- 🟢
  lot_size_sqft INTEGER,                           -- 🔵
  stories INTEGER,                                 -- 🔵
  parking_type TEXT,                               -- 🔵 garage, carport, street, none
  parking_spaces INTEGER,                          -- 🔵
  has_pool BOOLEAN DEFAULT FALSE,                  -- 🔵
  has_hoa BOOLEAN DEFAULT FALSE,                   -- 🔵
  construction_type TEXT,                          -- 🔵
  roof_type TEXT,                                  -- 🔵
  heating_type TEXT,                               -- 🔵
  cooling_type TEXT,                               -- 🔵
  
  -- Valuation
  current_value NUMERIC(12,2),                     -- 🟢
  current_value_source TEXT,                       -- 🟢 estimate, manual, appraisal, tax, purchase
  current_value_date DATE,                         -- 🟢
  tax_assessed_value NUMERIC(12,2),                -- 🔵
  tax_assessed_year INTEGER,                       -- 🔵
  last_appraisal_value NUMERIC(12,2),              -- 🔵
  last_appraisal_date DATE,                        -- 🔵
  insurance_replacement_value NUMERIC(12,2),       -- 🔵
  
  -- Rental Income
  monthly_rent NUMERIC(10,2),                      -- 🟢
  rent_source TEXT,                                -- 🟢 lease, estimate, manual
  market_rent_estimate NUMERIC(10,2),              -- 🔵
  rent_last_increased_date DATE,                   -- 🔵
  rent_last_increased_amount NUMERIC(10,2),        -- 🔵
  other_income_monthly NUMERIC(10,2) DEFAULT 0,    -- 🔵
  parking_income_monthly NUMERIC(10,2) DEFAULT 0,  -- 🔵
  laundry_income_monthly NUMERIC(10,2) DEFAULT 0,  -- 🔵
  pet_rent_monthly NUMERIC(10,2) DEFAULT 0,        -- 🔵
  storage_income_monthly NUMERIC(10,2) DEFAULT 0,  -- 🔵
  utility_reimbursement_monthly NUMERIC(10,2) DEFAULT 0, -- 🔵
  
  -- Operating Rates
  vacancy_rate NUMERIC(5,4) DEFAULT 0.05,          -- 🔵
  management_rate NUMERIC(5,4) DEFAULT 0.10,       -- 🔵
  maintenance_rate NUMERIC(5,4) DEFAULT 0.05,      -- 🔵
  capex_rate NUMERIC(5,4) DEFAULT 0.05,            -- 🔵
  
  -- Operating Expenses
  property_tax_annual NUMERIC(10,2),               -- 🟢
  insurance_annual NUMERIC(10,2),                  -- 🟢
  hoa_monthly NUMERIC(10,2) DEFAULT 0,             -- 🔵
  hoa_special_assessment NUMERIC(10,2),            -- 🔵
  hoa_special_assessment_date DATE,                -- 🔵
  utilities_monthly NUMERIC(10,2) DEFAULT 0,       -- 🔵
  water_sewer_monthly NUMERIC(10,2) DEFAULT 0,     -- 🔵
  trash_monthly NUMERIC(10,2) DEFAULT 0,           -- 🔵
  electric_monthly NUMERIC(10,2) DEFAULT 0,        -- 🔵
  gas_monthly NUMERIC(10,2) DEFAULT 0,             -- 🔵
  internet_monthly NUMERIC(10,2) DEFAULT 0,        -- 🔵
  lawn_care_monthly NUMERIC(10,2) DEFAULT 0,       -- 🔵
  snow_removal_monthly NUMERIC(10,2) DEFAULT 0,    -- 🔵
  pest_control_monthly NUMERIC(10,2) DEFAULT 0,    -- 🔵
  pool_maintenance_monthly NUMERIC(10,2) DEFAULT 0,-- 🔵
  alarm_monitoring_monthly NUMERIC(10,2) DEFAULT 0,-- 🔵
  other_expenses_monthly NUMERIC(10,2) DEFAULT 0,  -- 🔵
  
  -- Metadata
  nickname TEXT,                                   -- 🔵
  notes TEXT,                                      -- 🔵
  color_tag TEXT,                                  -- 🔵
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_state ON properties(state);
```

---

### `property_acquisition`

```sql
CREATE TABLE property_acquisition (
  property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Purchase
  purchase_price NUMERIC(12,2),                    -- 🟢
  purchase_date DATE,                              -- 🟢
  acquisition_method TEXT,                         -- 🔵 traditional, brrrr, wholesale, auction, seller_finance, subject_to, inherited, gift
  closing_costs_total NUMERIC(10,2),               -- 🔵
  closing_costs_breakdown JSONB,                   -- 🔵
  down_payment_amount NUMERIC(12,2),               -- 🔵
  down_payment_source TEXT,                        -- 🔵
  earnest_money NUMERIC(10,2),                     -- 🔵
  seller_credits NUMERIC(10,2),                    -- 🔵
  buyer_agent_commission NUMERIC(10,2),            -- 🔵
  
  -- BRRRR
  is_brrrr BOOLEAN DEFAULT FALSE,                  -- 🔵
  arv_at_purchase NUMERIC(12,2),                   -- 🔵
  purchase_to_arv_ratio NUMERIC(5,4),              -- ⚪
  rehab_budget NUMERIC(10,2),                      -- 🔵
  rehab_actual NUMERIC(10,2),                      -- 🔵
  rehab_start_date DATE,                           -- 🔵
  rehab_end_date DATE,                             -- 🔵
  holding_costs_during_rehab NUMERIC(10,2),        -- 🔵
  seasoning_required_months INTEGER,               -- 🔵
  seasoning_date DATE,                             -- 🔵
  post_rehab_appraisal NUMERIC(12,2),              -- 🔵
  post_rehab_appraisal_date DATE,                  -- 🔵
  total_cash_invested NUMERIC(12,2),               -- ⚪
  cash_left_in_deal NUMERIC(12,2),                 -- 🔵
  
  -- Tax Basis
  depreciation_basis NUMERIC(12,2),                -- 🔵
  land_value NUMERIC(12,2),                        -- 🔵
  improvement_value NUMERIC(12,2),                 -- 🔵
  depreciation_start_date DATE,                    -- 🔵
  depreciation_method TEXT DEFAULT 'straight_line',-- 🔵
  depreciation_years INTEGER DEFAULT 27,           -- 🔵
  capital_improvements_total NUMERIC(12,2) DEFAULT 0, -- 🔵
  is_1031_exchange BOOLEAN DEFAULT FALSE,          -- 🔵
  exchange_boot NUMERIC(12,2),                     -- 🔵
  exchange_from_property TEXT,                     -- 🔵
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `loans`

```sql
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',           -- 🔵 active, paid_off, refinanced, sold
  is_primary BOOLEAN DEFAULT TRUE,                 -- 🔵
  loan_position INTEGER DEFAULT 1,                 -- 🔵
  
  -- Lender
  lender_name TEXT NOT NULL,                       -- 🟢
  servicer_name TEXT,                              -- 🔵
  loan_number TEXT,                                -- 🔵
  
  -- Type
  loan_type TEXT NOT NULL,                         -- 🔵 conventional, fha, va, usda, dscr, hard_money, heloc, seller_finance, portfolio, commercial
  loan_purpose TEXT,                               -- 🔵 purchase, refinance, cash_out_refi
  
  -- Terms
  original_loan_amount NUMERIC(12,2) NOT NULL,     -- 🔵
  interest_rate NUMERIC(6,5) NOT NULL,             -- 🟢
  term_months INTEGER NOT NULL,                    -- 🟢
  start_date DATE,                                 -- 🔵
  maturity_date DATE NOT NULL,                     -- ⚪
  
  -- Current
  current_balance NUMERIC(12,2) NOT NULL,          -- 🟢
  balance_as_of_date DATE,                         -- 🔵
  
  -- Payment
  monthly_principal_interest NUMERIC(10,2),        -- ⚪
  monthly_escrow NUMERIC(10,2) DEFAULT 0,          -- 🔵
  monthly_pmi NUMERIC(10,2) DEFAULT 0,             -- 🔵
  monthly_mip NUMERIC(10,2) DEFAULT 0,             -- 🔵
  monthly_hoa_collected NUMERIC(10,2) DEFAULT 0,   -- 🔵
  total_monthly_payment NUMERIC(10,2),             -- 🟢
  extra_principal_monthly NUMERIC(10,2) DEFAULT 0, -- 🔵
  payment_due_day INTEGER DEFAULT 1,               -- 🔵
  late_fee_amount NUMERIC(8,2),                    -- 🔵
  late_fee_grace_days INTEGER DEFAULT 15,          -- 🔵
  
  -- ARM
  is_arm BOOLEAN DEFAULT FALSE,                    -- 🔵
  arm_index TEXT,                                  -- 🔵 SOFR, Prime, LIBOR, Treasury
  arm_margin NUMERIC(5,4),                         -- 🔵
  arm_first_adjustment_date DATE,                  -- 🔵
  arm_adjustment_period_months INTEGER,            -- 🔵
  arm_rate_cap_initial NUMERIC(5,4),               -- 🔵
  arm_rate_cap_periodic NUMERIC(5,4),              -- 🔵
  arm_rate_cap_lifetime NUMERIC(5,4),              -- 🔵
  arm_rate_floor NUMERIC(5,4),                     -- 🔵
  
  -- IO & Balloon
  is_interest_only BOOLEAN DEFAULT FALSE,          -- 🔵
  interest_only_end_date DATE,                     -- 🔵
  has_balloon BOOLEAN DEFAULT FALSE,               -- 🔵
  balloon_date DATE,                               -- 🔵
  balloon_amount NUMERIC(12,2),                    -- 🔵
  
  -- Prepayment
  has_prepayment_penalty BOOLEAN DEFAULT FALSE,    -- 🔵
  prepayment_penalty_type TEXT,                    -- 🔵 percentage, months_interest, declining
  prepayment_penalty_percent NUMERIC(5,4),         -- 🔵
  prepayment_penalty_months INTEGER,               -- 🔵
  prepayment_penalty_end_date DATE,                -- 🔵
  
  -- Recast
  allows_recast BOOLEAN,                           -- 🔵
  recast_fee NUMERIC(8,2),                         -- 🔵
  recast_minimum NUMERIC(10,2),                    -- 🔵
  
  -- Refinance
  refinanced_from_id UUID REFERENCES loans(id),-- 🔵
  refinance_date DATE,                             -- 🔵
  refinance_closing_costs NUMERIC(10,2),           -- 🔵
  refinance_cash_out NUMERIC(12,2),                -- 🔵
  
  notes TEXT,                                      -- 🔵
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loans_property_id ON loans(property_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE UNIQUE INDEX idx_loans_primary ON loans(property_id) WHERE is_primary = TRUE AND status = 'active';
```

---

### `leases`

```sql
CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'active',           -- 🔵 active, expired, terminated, future
  
  -- Terms
  lease_type TEXT NOT NULL DEFAULT 'fixed',        -- 🔵 fixed, month_to_month
  start_date DATE NOT NULL,                        -- 🔵
  end_date DATE,                                   -- 🔵
  term_months INTEGER,                             -- 🔵
  monthly_rent NUMERIC(10,2) NOT NULL,             -- 🔵
  rent_due_day INTEGER DEFAULT 1,                  -- 🔵
  
  -- Deposits
  security_deposit NUMERIC(10,2),                  -- 🔵
  security_deposit_location TEXT,                  -- 🔵
  last_month_rent_held NUMERIC(10,2),              -- 🔵
  pet_deposit NUMERIC(10,2),                       -- 🔵
  
  -- Fees
  late_fee_amount NUMERIC(8,2),                    -- 🔵
  late_fee_grace_days INTEGER DEFAULT 5,           -- 🔵
  late_fee_type TEXT DEFAULT 'flat',               -- 🔵 flat, percentage, daily
  nsf_fee NUMERIC(8,2),                            -- 🔵
  
  -- Increases
  allows_annual_increase BOOLEAN DEFAULT TRUE,     -- 🔵
  annual_increase_cap NUMERIC(5,4),                -- 🔵
  annual_increase_notice_days INTEGER DEFAULT 30,  -- 🔵
  
  -- Move-in/out
  move_in_date DATE,                               -- 🔵
  move_out_date DATE,                              -- 🔵
  move_out_notice_days INTEGER DEFAULT 30,         -- 🔵
  
  -- Tenant
  tenant_name TEXT,                                -- 🔵
  tenant_email TEXT,                               -- 🔵
  tenant_phone TEXT,                               -- 🔵
  tenant_count INTEGER DEFAULT 1,                  -- 🔵
  occupant_count INTEGER,                          -- 🔵
  
  -- Pets
  pets_allowed BOOLEAN DEFAULT FALSE,              -- 🔵
  pet_rent_monthly NUMERIC(10,2) DEFAULT 0,        -- 🔵
  pet_description TEXT,                            -- 🔵
  
  lease_document_id UUID,                          -- 🔵
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leases_property_id ON leases(property_id);
CREATE INDEX idx_leases_status ON leases(status);
```

---

### `property_expenses`

```sql
CREATE TABLE property_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,                          -- property_tax, insurance, mortgage_interest, mortgage_principal, management, repairs, maintenance, capex, utilities, hoa, legal, accounting, travel, marketing, office, bank_fees, licenses, depreciation, other
  subcategory TEXT,
  amount NUMERIC(10,2) NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_frequency TEXT,                       -- monthly, quarterly, annual
  recurrence_end_date DATE,
  vendor TEXT,
  description TEXT,
  is_tax_deductible BOOLEAN DEFAULT TRUE,
  tax_category TEXT,
  document_id UUID REFERENCES property_documents(id),
  receipt_storage_path TEXT,
  source TEXT DEFAULT 'manual',                    -- manual, appfolio, plaid, document_ai
  external_id TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_property_id ON property_expenses(property_id);
CREATE INDEX idx_expenses_date ON property_expenses(expense_date DESC);
CREATE INDEX idx_expenses_category ON property_expenses(category);
```

---

### `property_income`

```sql
CREATE TABLE property_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  income_date DATE NOT NULL,
  category TEXT NOT NULL,                          -- rent, parking, laundry, pet_rent, storage, utility_reimbursement, late_fee, application_fee, lease_break_fee, security_deposit_forfeit, nsf_fee, other
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  payer TEXT,
  lease_id UUID REFERENCES leases(id),
  source TEXT DEFAULT 'manual',                    -- manual, appfolio, plaid
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_income_property_id ON property_income(property_id);
CREATE INDEX idx_income_date ON property_income(income_date DESC);
```

---

### `property_history`

```sql
CREATE TABLE property_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  table_name TEXT NOT NULL DEFAULT 'properties',
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_source TEXT NOT NULL,                     -- user, rentcast, appfolio, plaid, document_ai, system
  change_reason TEXT,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_history_property_id ON property_history(property_id);
CREATE INDEX idx_history_field ON property_history(field_name);
CREATE INDEX idx_history_changed_at ON property_history(changed_at DESC);
```

---

### `mortgage_history`

```sql
CREATE TABLE loan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  
  change_type TEXT NOT NULL,                       -- balance_update, rate_change, recast, refinance, payment, escrow_change
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  balance_before NUMERIC(12,2),
  balance_after NUMERIC(12,2),
  principal_paid NUMERIC(10,2),
  interest_paid NUMERIC(10,2),
  escrow_paid NUMERIC(10,2),
  extra_principal NUMERIC(10,2),
  change_source TEXT NOT NULL,                     -- user, import, statement, plaid, system
  effective_date DATE,
  notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loan_history_loan_id ON mortgage_history(loan_id);
CREATE INDEX idx_loan_history_date ON mortgage_history(effective_date DESC);
```

---

### `property_documents`

```sql
CREATE TABLE property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  document_type TEXT NOT NULL,                     -- lease, tax_bill, insurance_policy, insurance_claim, closing_disclosure, deed, title_policy, appraisal, inspection, mortgage_statement, hoa_statement, utility_bill, receipt, contractor_invoice, permit, other
  document_year INTEGER,
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_processed_at TIMESTAMPTZ,
  ai_extracted_data JSONB,
  ai_confidence NUMERIC(4,3),
  description TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_property_id ON property_documents(property_id);
CREATE INDEX idx_documents_type ON property_documents(document_type);
```

---

### `property_images`

```sql
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  image_type TEXT DEFAULT 'photo',                 -- photo, floorplan, map, document
  category TEXT,                                   -- exterior, interior, kitchen, bathroom, bedroom, living, garage, yard, other
  is_primary BOOLEAN DEFAULT FALSE,
  caption TEXT,
  taken_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_images_property_id ON property_images(property_id);
```

---

### `api_cache`

```sql
CREATE TABLE api_cache (
  cache_key TEXT PRIMARY KEY,
  provider TEXT NOT NULL,                          -- mapbox, rentcast
  endpoint TEXT NOT NULL,
  lookup_value TEXT NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
```

---

### `freedom_profiles`

```sql
CREATE TABLE freedom_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Expenses
  monthly_expenses_total NUMERIC(10,2),
  expense_housing NUMERIC(10,2),
  expense_utilities NUMERIC(10,2),
  expense_food NUMERIC(10,2),
  expense_transportation NUMERIC(10,2),
  expense_healthcare NUMERIC(10,2),
  expense_insurance NUMERIC(10,2),
  expense_entertainment NUMERIC(10,2),
  expense_travel NUMERIC(10,2),
  expense_education NUMERIC(10,2),
  expense_giving NUMERIC(10,2),
  expense_debt_payments NUMERIC(10,2),
  expense_misc NUMERIC(10,2),
  
  -- Targets
  freedom_type TEXT DEFAULT 'barista_fire',        -- lean_fire, barista_fire, full_fire, fat_fire
  safety_multiplier NUMERIC(4,2) DEFAULT 1.25,
  target_passive_income NUMERIC(10,2),             -- ⚪
  target_freedom_date DATE,
  
  -- Income
  w2_income_annual NUMERIC(12,2),
  w2_monthly_savings NUMERIC(10,2),
  business_income_annual NUMERIC(12,2),
  dividend_income_annual NUMERIC(10,2),
  other_passive_income_annual NUMERIC(10,2),
  social_security_expected_monthly NUMERIC(10,2),
  social_security_start_age INTEGER,
  pension_expected_monthly NUMERIC(10,2),
  pension_start_age INTEGER,
  
  -- Assets
  retirement_accounts_total NUMERIC(14,2),
  brokerage_accounts_total NUMERIC(14,2),
  cash_savings_total NUMERIC(14,2),
  other_assets_total NUMERIC(14,2),
  non_property_debt_total NUMERIC(12,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `projection_assumptions`

```sql
CREATE TABLE projection_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Growth
  rent_growth_rate NUMERIC(5,4) DEFAULT 0.03,
  appreciation_rate NUMERIC(5,4) DEFAULT 0.03,
  expense_growth_rate NUMERIC(5,4) DEFAULT 0.03,
  tax_growth_rate NUMERIC(5,4) DEFAULT 0.03,
  insurance_growth_rate NUMERIC(5,4) DEFAULT 0.06,
  inflation_rate NUMERIC(5,4) DEFAULT 0.03,
  
  -- Operating
  vacancy_rate NUMERIC(5,4) DEFAULT 0.05,
  management_rate NUMERIC(5,4) DEFAULT 0.10,
  maintenance_rate NUMERIC(5,4) DEFAULT 0.05,
  capex_rate NUMERIC(5,4) DEFAULT 0.05,
  
  -- Acquisition
  target_property_value NUMERIC(12,2) DEFAULT 200000,
  target_down_payment_percent NUMERIC(5,4) DEFAULT 0.25,
  target_loan_term_years INTEGER DEFAULT 30,
  projected_interest_rate NUMERIC(6,5) DEFAULT 0.06,
  closing_cost_percent NUMERIC(5,4) DEFAULT 0.03,
  properties_per_year NUMERIC(4,2) DEFAULT 1,
  
  -- Payoff
  extra_principal_monthly NUMERIC(10,2) DEFAULT 0,
  payoff_priority TEXT DEFAULT 'highest_rate',     -- highest_rate, lowest_balance, custom
  
  -- Refinance
  refi_rate_drop_trigger NUMERIC(5,4) DEFAULT 0.0075,
  refi_break_even_months INTEGER DEFAULT 36,
  refi_closing_costs NUMERIC(10,2) DEFAULT 4000,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_assumptions_default ON projection_assumptions(user_id) WHERE is_default = TRUE;
```

---

## Onboarding Input

```typescript
interface PropertyOnboardingInput {
  // Step 1: Address
  streetAddress: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;

  // Step 2: Basics
  propertyType: 'SFR' | 'Duplex' | 'Triplex' | 'Fourplex' | 'Condo' | 'Townhouse' | 'Multifamily';
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  yearBuilt?: number;

  // Step 3: Status
  ownershipStatus: 'own_rented' | 'own_vacant' | 'under_contract' | 'exploring';

  // Step 4: Value
  currentValue: number;
  currentValueSource: 'estimate' | 'manual' | 'appraisal' | 'purchase';
  purchasePrice?: number;
  purchaseDate?: string;

  // Step 5: Rent
  monthlyRent?: number;
  rentSource?: 'lease' | 'estimate' | 'manual';

  // Step 6: Mortgage
  hasMortgage: boolean;
  mortgage?: {
    currentBalance: number;
    interestRate: number;
    monthlyPayment: number;
    loanTermYears: 15 | 20 | 30;
    lenderName?: string;
    startDate?: string;
  };

  // Step 7: Expenses
  propertyTaxAnnual?: number;
  insuranceAnnual?: number;
  hasHoa?: boolean;
  hoaMonthly?: number;
}
```

---

## Calculated Metrics

### Property-Level

| Metric | Formula |
|--------|---------|
| `gross_potential_rent` | monthly_rent × 12 |
| `gross_scheduled_income` | (rent + other_income) × 12 |
| `vacancy_loss` | gross_scheduled × vacancy_rate |
| `effective_gross_income` | gross_scheduled - vacancy_loss |
| `net_operating_income` | EGI - operating_expenses |
| `cash_flow_annual` | NOI - (monthly_payment × 12) |
| `cash_flow_monthly` | cash_flow_annual / 12 |
| `cap_rate` | NOI / current_value |
| `cash_on_cash` | cash_flow_annual / cash_invested |
| `equity` | current_value - loan_balance |
| `equity_percent` | equity / current_value |
| `ltv` | loan_balance / current_value |
| `dscr` | NOI / annual_debt_service |

### Portfolio-Level

| Metric | Formula |
|--------|---------|
| `total_value` | Sum of current_value |
| `total_debt` | Sum of loan balances |
| `total_equity` | total_value - total_debt |
| `portfolio_ltv` | total_debt / total_value |
| `total_monthly_cash_flow` | Sum of cash_flow_monthly |
| `weighted_avg_cap_rate` | Weighted by property value |
| `weighted_avg_interest_rate` | Weighted by loan balance |
| `freedom_progress` | current_passive / target_passive |
