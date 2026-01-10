# Loan & Financing Tracking

## Overview

Axori supports comprehensive tracking of **all financing types** - from traditional loans to hard money loans - with full history tracking for servicing transfers, rate changes, and refinances.

## Key Features

### 1. Multiple Financing Types

The `loans` table supports diverse financing arrangements:

```sql
loan_type TEXT NOT NULL
-- conventional, fha, va, usda, dscr, hard_money, 
-- heloc, seller_finance, portfolio, commercial
```

**Supported Financing Types:**
- **Conventional** - Traditional bank loans
- **FHA/VA/USDA** - Government-backed loans
- **DSCR** - Debt Service Coverage Ratio loans (investor-focused)
- **Hard Money** - Short-term bridge financing
- **HELOC** - Home Equity Line of Credit
- **Seller Finance** - Owner-financed deals
- **Portfolio** - Non-QM loans held by lenders
- **Commercial** - Multi-family/commercial property loans

### 2. Servicing Transfers (Loan Sold to New Company)

Loans are frequently **bought and sold** between servicers. Axori tracks this:

```sql
CREATE TABLE loans (
  ...
  -- Lender vs Servicer
  lender_name TEXT NOT NULL,      -- Original lender (e.g., "Wells Fargo")
  servicer_name TEXT,             -- Current servicer (e.g., "Mr. Cooper")
  loan_number TEXT,               -- Loan number (may change on transfer)
  
  -- Status tracking
  status TEXT DEFAULT 'active',   -- active, paid_off, refinanced, sold
  ...
);
```

**How It Works:**
1. **Initial Loan**: `lender_name = "Wells Fargo"`, `servicer_name = "Wells Fargo"`
2. **Servicing Transfer**: `lender_name = "Wells Fargo"` (unchanged), `servicer_name = "Mr. Cooper"` (new)
3. **History Logged**: `mortgage_history` records the transfer

**Example Transfer Log:**
```sql
INSERT INTO mortgage_history (
  mortgage_id,
  change_type,
  field_name,
  old_value,
  new_value,
  change_source,
  notes
) VALUES (
  '...uuid...',
  'servicer_transfer',
  'servicer_name',
  'Wells Fargo',
  'Mr. Cooper',
  'user',
  'Received transfer notice on 2024-01-15'
);
```

### 3. Active Loan Tracking

Properties can have **multiple loans** (1st mortgage, 2nd mortgage, HELOC):

```sql
-- Only ONE loan can be primary and active per property
CREATE UNIQUE INDEX idx_loans_primary 
  ON loans(property_id) 
  WHERE is_primary = TRUE AND status = 'active';

-- Other fields
is_primary BOOLEAN DEFAULT TRUE,     -- Primary loan
loan_position INTEGER DEFAULT 1,     -- 1st lien, 2nd lien, etc.
status TEXT DEFAULT 'active',        -- active, paid_off, refinanced, sold
```

**Example: Property with Multiple Loans**

| Loan ID | Lender | Type | Position | Status | Is Primary | Balance |
|---------|--------|------|----------|--------|------------|---------|
| `abc-123` | Wells Fargo | Conventional | 1 | active | TRUE | $320,000 |
| `def-456` | HELOC Bank | HELOC | 2 | active | FALSE | $50,000 |
| `ghi-789` | Hard Money Co | Hard Money | 1 | paid_off | FALSE | $0 |

**Business Rules:**
- ✅ One property can have multiple loans
- ✅ Only ONE loan can be `is_primary = TRUE` and `status = 'active'`
- ✅ When primary loan is paid off, user can promote another loan to primary
- ✅ Refinancing sets old loan to `status = 'refinanced'` and creates new loan

### 4. Refinance Tracking

When refinancing, create a **chain of loans**:

```sql
refinanced_from_id UUID REFERENCES loans(id),  -- Links to old loan
refinance_date DATE,
refinance_closing_costs NUMERIC(10,2),
refinance_cash_out NUMERIC(12,2),                  -- Cash-out amount
```

**Example Refinance Flow:**

**Before:**
```javascript
{
  id: "loan-1",
  property_id: "prop-123",
  lender_name: "Bank A",
  original_loan_amount: 320000,
  current_balance: 300000,
  interest_rate: 0.065,
  is_primary: true,
  status: "active"
}
```

**After Refinance:**
```javascript
// Old loan - marked as refinanced
{
  id: "loan-1",
  status: "refinanced",  // Changed
  is_primary: false,     // No longer primary
  ...
}

// New loan - replaces old loan
{
  id: "loan-2",
  property_id: "prop-123",
  lender_name: "Bank B",
  original_loan_amount: 280000,
  current_balance: 280000,
  interest_rate: 0.055,   // Better rate!
  is_primary: true,
  status: "active",
  refinanced_from_id: "loan-1",  // Links to old loan
  refinance_date: "2024-06-15",
  refinance_closing_costs: 4500,
  refinance_cash_out: 0
}
```

### 5. Hard Money & Bridge Loans

**Hard Money Example:**
```javascript
{
  loan_type: "hard_money",
  lender_name: "Fix & Flip Capital",
  original_loan_amount: 200000,
  interest_rate: 0.12,           // Higher rate
  term_months: 12,               // Short term
  is_interest_only: true,        // IO payments
  has_balloon: true,             // Balloon at end
  balloon_date: "2024-12-31",
  balloon_amount: 200000,
  notes: "BRRRR bridge loan - refinance by Dec 2024"
}
```

**Business Logic:**
1. User buys distressed property with hard money
2. Renovates property
3. After 6-12 months, refinances into conventional loan
4. Hard money loan marked as `refinanced`, new conventional loan created

### 6. Comprehensive Payment Tracking

```sql
-- Payment Components
monthly_principal_interest NUMERIC(10,2),  -- ⚪ Calculated
monthly_escrow NUMERIC(10,2),              -- Tax/insurance escrow
monthly_pmi NUMERIC(10,2),                 -- Private loan insurance
monthly_mip NUMERIC(10,2),                 -- FHA loan insurance
monthly_hoa_collected NUMERIC(10,2),       -- HOA collected by lender
total_monthly_payment NUMERIC(10,2),       -- 🟢 Total payment

extra_principal_monthly NUMERIC(10,2),     -- Extra principal payments
payment_due_day INTEGER DEFAULT 1,         -- Due date (1-31)

-- Late Fees
late_fee_amount NUMERIC(8,2),
late_fee_grace_days INTEGER DEFAULT 15,
```

**Example Payment Breakdown:**
```javascript
{
  monthly_principal_interest: 1686,  // P&I on $320k @ 6.5% for 30yr
  monthly_escrow: 650,               // $6000 tax + $1800 insurance / 12
  monthly_pmi: 200,                  // PMI on 10% down
  monthly_hoa_collected: 0,          // Not collected by lender
  extra_principal_monthly: 100,      // Extra $100/month
  total_monthly_payment: 2536        // Total
}
```

### 7. ARM (Adjustable Rate Loans)

Full ARM tracking for rate adjustments:

```sql
is_arm BOOLEAN DEFAULT FALSE,
arm_index TEXT,                       -- SOFR, Prime, LIBOR, Treasury
arm_margin NUMERIC(5,4),              -- Fixed margin (e.g., +2.5%)
arm_first_adjustment_date DATE,       -- When first adjustment occurs
arm_adjustment_period_months INT,     -- 12, 60, etc.
arm_rate_cap_initial NUMERIC(5,4),    -- Max rate increase at first adjustment
arm_rate_cap_periodic NUMERIC(5,4),   -- Max increase per adjustment
arm_rate_cap_lifetime NUMERIC(5,4),   -- Lifetime cap above initial rate
arm_rate_floor NUMERIC(5,4),          -- Minimum rate
```

**Example: 5/1 ARM**
```javascript
{
  loan_type: "conventional",
  is_arm: true,
  interest_rate: 0.05500,              // Initial rate (5.5%)
  arm_index: "SOFR",
  arm_margin: 0.02500,                 // +2.5%
  arm_first_adjustment_date: "2029-01-01",  // 5 years from origination
  arm_adjustment_period_months: 12,    // Annual adjustments after first
  arm_rate_cap_initial: 0.02000,       // 2% first adjustment cap
  arm_rate_cap_periodic: 0.02000,      // 2% per year thereafter
  arm_rate_cap_lifetime: 0.05000,      // 5% lifetime cap (max 10.5%)
  arm_rate_floor: 0.03000              // Floor at 3%
}
```

**Rate Change Tracking:**
When rate adjusts, `mortgage_history` logs it:
```sql
INSERT INTO mortgage_history (
  mortgage_id,
  change_type,
  field_name,
  old_value,
  new_value,
  change_source,
  notes
) VALUES (
  '...uuid...',
  'rate_change',
  'interest_rate',
  '0.05500',
  '0.06750',  -- Adjusted to SOFR (4.25%) + margin (2.5%)
  'system',
  'ARM adjustment based on SOFR index'
);
```

### 8. Interest-Only & Balloon Loans

```sql
-- Interest-Only
is_interest_only BOOLEAN DEFAULT FALSE,
interest_only_end_date DATE,            -- When IO period ends

-- Balloon
has_balloon BOOLEAN DEFAULT FALSE,
balloon_date DATE,
balloon_amount NUMERIC(12,2),
```

**Example: IO Hard Money Loan**
```javascript
{
  loan_type: "hard_money",
  original_loan_amount: 180000,
  interest_rate: 0.11,
  term_months: 12,
  is_interest_only: true,
  interest_only_end_date: "2024-12-31",  // IO entire term
  has_balloon: true,
  balloon_date: "2024-12-31",
  balloon_amount: 180000,                 // Full principal due at end
  monthly_principal_interest: 1650        // Interest only ($180k * 11% / 12)
}
```

### 9. Prepayment Penalties

```sql
has_prepayment_penalty BOOLEAN DEFAULT FALSE,
prepayment_penalty_type TEXT,          -- percentage, months_interest, declining
prepayment_penalty_percent NUMERIC(5,4),
prepayment_penalty_months INTEGER,
prepayment_penalty_end_date DATE,
```

**Example: Hard Money with Prepayment Penalty**
```javascript
{
  loan_type: "hard_money",
  has_prepayment_penalty: true,
  prepayment_penalty_type: "percentage",
  prepayment_penalty_percent: 0.03,      // 3% of balance
  prepayment_penalty_end_date: "2024-06-30",  // First 6 months
  notes: "3% penalty if paid off before 6 months"
}
```

### 10. Loan History (Full Audit Trail)

Every change to a loan is logged:

```sql
CREATE TABLE mortgage_history (
  id UUID PRIMARY KEY,
  mortgage_id UUID REFERENCES loans(id),
  
  change_type TEXT NOT NULL,
  -- balance_update, rate_change, recast, refinance, 
  -- payment, escrow_change, servicer_transfer
  
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  
  balance_before NUMERIC(12,2),
  balance_after NUMERIC(12,2),
  principal_paid NUMERIC(10,2),
  interest_paid NUMERIC(10,2),
  escrow_paid NUMERIC(10,2),
  extra_principal NUMERIC(10,2),
  
  change_source TEXT NOT NULL,
  -- user, import, statement, plaid, system
  
  effective_date DATE,
  notes TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example History Entries:**

```javascript
// Servicing transfer
{
  change_type: "servicer_transfer",
  field_name: "servicer_name",
  old_value: "Wells Fargo",
  new_value: "Mr. Cooper",
  change_source: "user",
  notes: "Transfer notice received via mail"
}

// Rate change (ARM adjustment)
{
  change_type: "rate_change",
  field_name: "interest_rate",
  old_value: "0.05500",
  new_value: "0.06250",
  change_source: "system",
  notes: "Annual ARM adjustment"
}

// Payment recorded
{
  change_type: "payment",
  balance_before: 300000,
  balance_after: 299200,
  principal_paid: 800,
  interest_paid: 1650,
  escrow_paid: 650,
  extra_principal: 100,
  change_source: "plaid",
  effective_date: "2024-01-01"
}

// Refinance
{
  change_type: "refinance",
  old_value: "6.5%",
  new_value: "5.5%",
  notes: "Refinanced to lower rate, saved $180/month"
}
```

## Wizard Integration

### Step 6: Mortgage/Financing

**UI Flow:**

1. **Has Financing?**
   - Yes → Continue
   - No (Cash Purchase) → Skip to Step 7

2. **Financing Type:**
   - Conventional
   - FHA/VA/USDA
   - DSCR
   - Hard Money
   - HELOC
   - Seller Finance
   - Other

3. **Lender Information:**
   - Lender Name (required)
   - Servicer Name (if different)
   - Loan Number (optional)

4. **Loan Terms:**
   - Original Loan Amount
   - Current Balance
   - Interest Rate
   - Term (years: 15, 20, 30, custom)
   - Start Date

5. **Payment Information:**
   - Monthly P&I (calculated)
   - Escrow (tax/insurance)
   - PMI/MIP
   - Total Monthly Payment

6. **Special Features** (conditional):
   - ARM? → Show ARM fields
   - Interest-Only? → Show IO end date
   - Balloon? → Show balloon date/amount
   - Prepayment Penalty? → Show penalty details

## API Endpoints

### Create Mortgage
```typescript
POST /api/loans
{
  property_id: "uuid",
  loan_type: "conventional",
  lender_name: "Wells Fargo",
  servicer_name: "Wells Fargo",
  original_loan_amount: 320000,
  current_balance: 320000,
  interest_rate: 0.065,
  term_months: 360,
  start_date: "2024-01-15",
  monthly_escrow: 650,
  monthly_pmi: 200,
  is_primary: true
}
```

### Update Servicer (Transfer)
```typescript
PATCH /api/loans/:id
{
  servicer_name: "Mr. Cooper",
  loan_number: "NEW-1234567"  // May change on transfer
}
// Automatically logs to mortgage_history
```

### Record Payment
```typescript
POST /api/loans/:id/payment
{
  payment_date: "2024-01-01",
  principal_paid: 800,
  interest_paid: 1650,
  escrow_paid: 650,
  extra_principal: 100
}
// Updates current_balance and logs to mortgage_history
```

### Refinance
```typescript
POST /api/loans/:id/refinance
{
  new_lender_name: "Better Mortgage",
  new_loan_amount: 280000,
  new_interest_rate: 0.055,
  new_term_months: 360,
  closing_costs: 4500,
  cash_out: 0
}
// Marks old loan as refinanced, creates new loan
```

## Query Examples

### Get Active Primary Mortgage
```sql
SELECT * FROM loans
WHERE property_id = 'uuid'
  AND is_primary = TRUE
  AND status = 'active';
```

### Get All Loans for Property
```sql
SELECT * FROM loans
WHERE property_id = 'uuid'
ORDER BY loan_position, created_at;
```

### Get Loan History
```sql
SELECT * FROM mortgage_history
WHERE mortgage_id = 'uuid'
ORDER BY changed_at DESC;
```

### Track Servicing Transfers
```sql
SELECT 
  m.loan_number,
  mh.old_value AS old_servicer,
  mh.new_value AS new_servicer,
  mh.changed_at AS transfer_date
FROM mortgage_history mh
JOIN loans m ON m.id = mh.mortgage_id
WHERE mh.change_type = 'servicer_transfer'
  AND m.property_id = 'uuid';
```

## Business Rules Summary

1. ✅ **Multiple Loans Supported** - 1st mortgage, 2nd mortgage, HELOC
2. ✅ **One Primary Active Loan** - Enforced by unique index
3. ✅ **Servicing Transfers Tracked** - Separate lender vs servicer fields
4. ✅ **Full Refinance Chain** - `refinanced_from_id` links loans
5. ✅ **Comprehensive History** - Every change logged with source
6. ✅ **Diverse Financing Types** - Traditional to hard money
7. ✅ **ARM Support** - Full adjustment tracking
8. ✅ **IO & Balloon** - Complete special loan support
9. ✅ **Payment Tracking** - Principal, interest, escrow breakdown
10. ✅ **Prepayment Penalties** - Track early payoff costs

## Future Enhancements (Phase 2+)

- **Plaid Integration** - Auto-import loan payments
- **Payment Reminders** - Notify before due date
- **Amortization Calculator** - Show payoff schedule
- **Rate Watch** - Alert when refi makes sense
- **Servicer Contact Info** - Store servicer phone/website
- **Document Storage** - Link loan statements to property_documents
- **Escrow Analysis** - Track escrow shortages/surpluses

