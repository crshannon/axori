# Financials Tab Testing Plan

**Plan Version:** 007  
**Created:** 2024-12-19  
**Status:** Planning

## Overview

Comprehensive testing plan for the Financials tab, covering calculation utilities, components, drawers, and user workflows. This plan ensures accurate financial calculations, proper data handling, and a smooth user experience.

## Testing Scope

### Components to Test

1. **Financial Pulse** - Displays projected vs actual cash flow, variance, debt service
2. **Liquidity** - Shows liquid reserves and emergency fund metrics
3. **Operating Core** - Displays NOI, gross income, fixed expenses, margin
4. **Acquisition Intel** - Shows purchase metrics, equity velocity, cash in deal
5. **Tax Shield Intel** - Displays unclaimed depreciation and cost segregation potential
6. **Debt Logic** - Lists all loans with payment details
7. **Monthly Comparison Chart** - Shows monthly projected vs actual with variance
8. **Property Transactions** - Historical P&L registry table

### Drawers to Test

1. **Add Loan Drawer** - Add/edit loan information
2. **Property Acquisition Drawer** - Edit acquisition data
3. **Operating Expenses Drawer** - Edit operating expenses
4. **Add Transaction Drawer** - Add/edit/archive/delete transactions
5. **Bank Account Connection Drawer** - Connect bank accounts

### Calculation Utilities to Test

Located in `apps/web/src/utils/finances/`:
- `income.ts` - Income calculations
- `expenses.ts` - Expense calculations
- `noi.ts` - NOI and CapEx calculations
- `debt.ts` - Debt service calculations
- `taxShield.ts` - Tax shield calculations

## Testing Strategy

### Phase 1: Unit Tests - Calculation Utilities

**Goal:** Ensure all calculation utilities produce accurate results

#### Income Calculations (`income.ts`)

**Test Cases:**
- [ ] `calculateGrossIncomeFromStructured()` with complete rental income data
- [ ] `calculateGrossIncomeFromStructured()` with partial data (some fields null)
- [ ] `calculateGrossIncomeFromStructured()` with null rental income
- [ ] `calculateGrossIncomeFromTransactions()` with income transactions
- [ ] `calculateGrossIncomeFromTransactions()` with excluded transactions (should not count)
- [ ] `calculateGrossIncomeFromTransactions()` with empty transaction array
- [ ] `calculateGrossIncome()` prefers structured data when available
- [ ] `calculateGrossIncome()` falls back to transactions when structured is missing
- [ ] `calculateGrossIncome()` falls back to transactions when structured is zero

**Expected Results:**
- Correctly sums all income sources (rent, parking, laundry, pet rent, storage, utilities)
- Handles null/undefined values gracefully (returns 0)
- Excludes transactions marked `isExcluded: true`
- Returns 0 for empty data

#### Expense Calculations (`expenses.ts`)

**Test Cases:**
- [ ] `calculateFixedExpensesFromStructured()` with complete operating expenses
- [ ] `calculateFixedExpensesFromStructured()` with annual expenses (converts to monthly)
- [ ] `calculateFixedExpensesFromStructured()` with null operating expenses
- [ ] `calculateManagementFee()` with flat fee
- [ ] `calculateManagementFee()` with percentage rate
- [ ] `calculateManagementFee()` with zero gross income (percentage should return 0)
- [ ] `calculateRecurringExpensesFromTransactions()` excludes loan payments
- [ ] `calculateRecurringExpensesFromTransactions()` excludes duplicates (management, tax, insurance)
- [ ] `calculateRecurringExpensesFromTransactions()` groups by category
- [ ] `calculateTotalFixedExpenses()` combines structured and transaction expenses correctly
- [ ] `calculateTotalFixedExpenses()` excludes duplicates between structured and transactions

**Expected Results:**
- Annual expenses correctly converted to monthly (divide by 12)
- Management fee calculated correctly (flat fee or percentage of gross income)
- Loan payments excluded from operating expenses
- Duplicates excluded (management, property tax, insurance)
- Transaction expenses grouped by category and summed

#### NOI Calculations (`noi.ts`)

**Test Cases:**
- [ ] `calculateCapExReserve()` with valid capex rate and gross income
- [ ] `calculateCapExReserve()` with null capex rate (returns 0)
- [ ] `calculateCapExReserve()` with zero gross income (returns 0)
- [ ] `calculateNOI()` with valid inputs (gross income - expenses - capex)
- [ ] `calculateNOI()` with zero gross income
- [ ] `calculateNOI()` with expenses exceeding gross income (negative NOI)
- [ ] `calculateCashFlow()` with positive NOI and debt service
- [ ] `calculateCashFlow()` with negative NOI (should still subtract debt service)

**Expected Results:**
- CapEx reserve = gross income × capex rate (when both are > 0)
- NOI = gross income - operating expenses - capex reserve
- Cash flow = NOI - debt service
- Returns 0 when inputs are invalid/null

#### Debt Service Calculations (`debt.ts`)

**Test Cases:**
- [ ] `calculateTotalDebtService()` with loans using `totalMonthlyPayment`
- [ ] `calculateTotalDebtService()` with loans using P&I + Escrow calculation
- [ ] `calculateTotalDebtService()` with mixed loan types
- [ ] `calculateTotalDebtService()` excludes inactive loans
- [ ] `calculateTotalDebtService()` with empty loan array (returns 0)
- [ ] `getPrimaryLoanInterestRate()` returns primary loan interest rate
- [ ] `getPrimaryLoanInterestRate()` returns 0 if no primary loan
- [ ] `getPrimaryLoanInterestRate()` converts decimal to percentage (multiplies by 100)

**Expected Results:**
- Prefers `totalMonthlyPayment` when available
- Falls back to P&I + Escrow calculation
- Only includes active loans
- Interest rate returned as percentage (4.5 for 4.5%, not 0.045)

#### Tax Shield Calculations (`taxShield.ts`)

**Test Cases:**
- [ ] `getDepreciationSchedule()` returns 27.5 for residential types (SFR, Duplex, Condo, etc.)
- [ ] `getDepreciationSchedule()` returns 39 for commercial types (Multifamily)
- [ ] `getDepreciationSchedule()` defaults to 27.5 for null/undefined property type
- [ ] `calculateUnclaimedDepreciation()` with valid purchase date and basis
- [ ] `calculateUnclaimedDepreciation()` with null purchase date (returns null)
- [ ] `calculateUnclaimedDepreciation()` with null basis (returns null)
- [ ] `calculateUnclaimedDepreciation()` with future purchase date (returns 0)
- [ ] `calculateUnclaimedDepreciation()` calculates correctly for 27.5-year schedule
- [ ] `calculateUnclaimedDepreciation()` calculates correctly for 39-year schedule
- [ ] `calculateUnclaimedDepreciation()` rounds to nearest dollar
- [ ] `calculateCostSegPotential()` returns High Alpha (≥30%) for high-value properties (≥$500k)
- [ ] `calculateCostSegPotential()` returns Medium (15-29%) for medium-value properties ($200k-$500k)
- [ ] `calculateCostSegPotential()` returns Low (<15%) for lower-value properties (<$200k)
- [ ] `calculateCostSegPotential()` returns null for null basis

**Expected Results:**
- Residential properties: 27.5-year schedule
- Commercial properties: 39-year schedule
- Unclaimed depreciation = (basis / schedule) × (months_owned / 12)
- Cost seg percentage based on property value tiers
- Handles edge cases (null values, future dates) gracefully

### Phase 2: Component Tests - Financial Cards

**Goal:** Ensure financial card components display correct data and handle edge cases

#### Financial Pulse Component

**Test Cases:**
- [ ] Displays projected cash flow when structured data available
- [ ] Displays actual cash flow when transactions available
- [ ] Shows variance (actual - projected) when both available
- [ ] Shows variance percentage correctly
- [ ] Handles missing projected data (shows only actual)
- [ ] Handles missing actual data (shows only projected)
- [ ] Shows "N/A" or 0 for missing data (not errors)
- [ ] Displays debt service correctly
- [ ] Displays interest rate from primary loan
- [ ] Shows loading state correctly
- [ ] Shows error state when property fetch fails

#### Operating Core Component

**Test Cases:**
- [ ] Displays gross income from structured data
- [ ] Falls back to transaction income when structured missing
- [ ] Lists all fixed expenses with labels
- [ ] Groups duplicate transaction expenses correctly
- [ ] Excludes loan payments from expenses list
- [ ] Calculates NOI correctly (gross income - expenses - capex)
- [ ] Displays margin percentage correctly
- [ ] Handles zero gross income (margin should be 0)
- [ ] Shows loading state correctly

#### Tax Shield Intel Component

**Test Cases:**
- [ ] Displays calculated unclaimed depreciation (not placeholder)
- [ ] Shows cost segregation potential level ("High Alpha", "Medium", "Low")
- [ ] Shows cost segregation percentage (20-40% typical range)
- [ ] Handles missing purchase date (shows 0 or "N/A")
- [ ] Handles missing depreciation basis (shows "Low" potential)
- [ ] Uses correct depreciation schedule for residential (27.5)
- [ ] Uses correct depreciation schedule for commercial (39)
- [ ] Updates calculations when property data changes

#### Acquisition Intel Component

**Test Cases:**
- [ ] Displays current basis (purchase price + closing costs)
- [ ] Calculates equity velocity correctly
- [ ] Shows cash in deal (down payment + closing costs)
- [ ] Displays closing costs percentage
- [ ] Calculates unrealized gain/loss
- [ ] Handles missing acquisition data gracefully
- [ ] Formats dates correctly

#### Debt Logic Component

**Test Cases:**
- [ ] Lists all active loans
- [ ] Excludes inactive loans from display
- [ ] Shows total monthly payment (P&I + Escrow or totalMonthlyPayment)
- [ ] Displays loan type correctly
- [ ] Shows primary loan indicator
- [ ] Handles empty loan array (shows empty state)
- [ ] Opens edit drawer when loan clicked
- [ ] Opens add loan drawer when "Add Loan" clicked

#### Monthly Comparison Chart

**Test Cases:**
- [ ] Displays projected monthly values from structured data
- [ ] Aggregates actual values from transactions by month
- [ ] Calculates variance correctly for each month
- [ ] Shows variance percentage correctly
- [ ] Handles months with no transactions (shows projected only)
- [ ] Handles months with no structured data (shows actual only)
- [ ] Displays correct number of months (default 12)
- [ ] Chart renders correctly with data
- [ ] Chart handles empty data gracefully

#### Property Transactions Table

**Test Cases:**
- [ ] Displays all transactions for property
- [ ] Filters excluded transactions correctly (or shows them with indicator)
- [ ] Sorts by date correctly (newest first or configurable)
- [ ] Shows transaction type (income/expense/capital) correctly
- [ ] Formats amounts correctly (currency)
- [ ] Opens edit drawer when transaction row clicked
- [ ] Handles empty transaction list (shows empty state)

### Phase 3: Integration Tests - Drawers

**Goal:** Ensure drawers save data correctly and update UI

#### Add Transaction Drawer

**Test Cases:**
- [ ] Creates new transaction with all required fields
- [ ] Validates required fields (date, amount, category)
- [ ] Validates vendor required for expenses
- [ ] Validates payer required for income
- [ ] Saves transaction correctly via API
- [ ] Updates transaction list after save
- [ ] Edits existing transaction correctly
- [ ] Archives transaction (sets isExcluded: true)
- [ ] Deletes transaction permanently
- [ ] Shows delete confirmation before permanent delete
- [ ] Closes drawer after successful save
- [ ] Shows error message on save failure
- [ ] Handles form validation errors correctly

#### Operating Expenses Drawer

**Test Cases:**
- [ ] Loads existing operating expenses data
- [ ] Saves annual expenses correctly (property tax, insurance)
- [ ] Saves monthly expenses correctly
- [ ] Validates numeric fields (rejects non-numeric)
- [ ] Saves management fee (flat or percentage)
- [ ] Saves CapEx rate correctly
- [ ] Updates Operating Core component after save
- [ ] Updates Financial Pulse after save
- [ ] Shows error message on save failure
- [ ] Handles missing data gracefully

#### Add Loan Drawer

**Test Cases:**
- [ ] Creates new loan with all required fields
- [ ] Validates required fields (loan type, amount, interest rate)
- [ ] Saves loan correctly via API
- [ ] Updates Debt Logic component after save
- [ ] Updates debt service in Financial Pulse after save
- [ ] Edits existing loan correctly
- [ ] Calculates monthly payment correctly (P&I + Escrow)
- [ ] Shows error message on save failure
- [ ] Handles form validation errors correctly

#### Property Acquisition Drawer

**Test Cases:**
- [ ] Loads existing acquisition data
- [ ] Saves purchase price and date correctly
- [ ] Saves closing costs correctly
- [ ] Saves depreciation basis correctly
- [ ] Updates Acquisition Intel after save
- [ ] Updates Tax Shield Intel after save (if basis changed)
- [ ] Validates numeric fields
- [ ] Shows error message on save failure

### Phase 4: E2E Tests - Playwright User Workflows

**Goal:** Test complete user workflows end-to-end through the actual UI using Playwright

**Framework:** Playwright  
**Location:** `apps/web/tests/e2e/financials/`  
**Setup:** Requires authenticated user session and test property data

#### E2E Test Structure

Each E2E test should follow this pattern:
- **Setup:** Authenticate user, navigate to property financials tab
- **Action:** Perform user interactions (click, type, select)
- **Assertion:** Verify UI updates, data changes, calculations

#### Test 1: Financials Page Loads and Displays All Cards

**File:** `financials-page-load.spec.ts`

```typescript
test('financials page loads and displays all financial cards', async ({ page }) => {
  // Navigate to property financials tab
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Verify all cards are visible
  await expect(page.getByText('Financial Pulse')).toBeVisible()
  await expect(page.getByText('Liquidity')).toBeVisible()
  await expect(page.getByText('Operating Core')).toBeVisible()
  await expect(page.getByText('Acquisition Intel')).toBeVisible()
  await expect(page.getByText('Tax Shield Intel')).toBeVisible()
  await expect(page.getByText('Debt Logic')).toBeVisible()
  await expect(page.getByText('Monthly Comparison')).toBeVisible()
  await expect(page.getByText('Historical P&L Registry')).toBeVisible()
  
  // Verify no console errors
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  expect(errors).toHaveLength(0)
})
```

**Test Cases:**
- [ ] All financial cards render correctly
- [ ] All cards show loading states initially
- [ ] Cards populate with data after load
- [ ] No console errors during page load
- [ ] Page is responsive (mobile/desktop)

#### Test 2: Financial Calculations Display Correctly

**File:** `financials-calculations.spec.ts`

```typescript
test('financial pulse displays correct calculations', async ({ page }) => {
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Wait for data to load
  await page.waitForSelector('[data-testid="financial-pulse"]')
  
  // Verify projected cash flow is displayed
  const projectedCashFlow = page.locator('[data-testid="projected-cash-flow"]')
  await expect(projectedCashFlow).toBeVisible()
  await expect(projectedCashFlow).toContainText('$') // Contains currency symbol
  
  // Verify actual cash flow is displayed (if transactions exist)
  const actualCashFlow = page.locator('[data-testid="actual-cash-flow"]')
  if (await actualCashFlow.isVisible()) {
    await expect(actualCashFlow).toContainText('$')
  }
  
  // Verify debt service is displayed
  const debtService = page.locator('[data-testid="debt-service"]')
  await expect(debtService).toBeVisible()
  await expect(debtService).toContainText('$')
})
```

**Test Cases:**
- [ ] Financial Pulse shows projected cash flow
- [ ] Financial Pulse shows actual cash flow (if transactions exist)
- [ ] Financial Pulse shows variance (if both projected and actual exist)
- [ ] Operating Core shows gross income, expenses, NOI
- [ ] Operating Core shows margin percentage
- [ ] Tax Shield shows unclaimed depreciation (not placeholder)
- [ ] Tax Shield shows cost segregation potential
- [ ] All numeric values formatted with currency symbols
- [ ] Negative values display correctly (not as errors)

#### Test 3: Add Operating Expenses via Drawer

**File:** `add-operating-expenses.spec.ts`

```typescript
test('add operating expenses updates financials', async ({ page }) => {
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Click "Manage" button on Operating Core
  const manageButton = page.locator('[data-testid="operating-core-manage"]')
  await manageButton.click()
  
  // Wait for drawer to open
  await expect(page.getByText('Operating Expenses')).toBeVisible()
  
  // Fill in operating expenses
  await page.fill('[name="propertyTaxAnnual"]', '12000')
  await page.fill('[name="insuranceAnnual"]', '2400')
  await page.fill('[name="hoaMonthly"]', '200')
  await page.fill('[name="managementRate"]', '0.10') // 10%
  
  // Save expenses
  await page.click('button:has-text("Save")')
  
  // Wait for drawer to close
  await expect(page.getByText('Operating Expenses')).not.toBeVisible()
  
  // Verify Operating Core updated
  await expect(page.locator('[data-testid="operating-core-expenses"]')).toContainText('$')
  
  // Verify Financial Pulse updated (NOI, cash flow)
  await page.waitForTimeout(1000) // Wait for recalculation
  const noi = page.locator('[data-testid="financial-pulse-noi"]')
  await expect(noi).toBeVisible()
})
```

**Test Cases:**
- [ ] Drawer opens when "Manage" clicked
- [ ] Form fields are editable
- [ ] Annual expenses convert to monthly correctly
- [ ] Management fee calculates correctly (flat fee or percentage)
- [ ] Save button saves data successfully
- [ ] Drawer closes after successful save
- [ ] Operating Core card updates with new values
- [ ] Financial Pulse recalculates (NOI, cash flow update)
- [ ] Error message shows if save fails

#### Test 4: Add Transaction via Drawer

**File:** `add-transaction.spec.ts`

```typescript
test('add transaction updates historical P&L registry', async ({ page }) => {
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Scroll to transactions table
  const transactionsSection = page.locator('[data-testid="property-transactions"]')
  await transactionsSection.scrollIntoViewIfNeeded()
  
  // Click "Add Transaction" button
  await page.click('button:has-text("Add Transaction")')
  
  // Wait for drawer to open
  await expect(page.getByText('Add Transaction')).toBeVisible()
  
  // Fill in transaction form
  await page.selectOption('[name="type"]', 'expense')
  await page.fill('[name="transactionDate"]', '2024-12-01')
  await page.fill('[name="amount"]', '150.00')
  await page.selectOption('[name="category"]', 'maintenance')
  await page.fill('[name="vendor"]', 'ABC Plumbing')
  await page.fill('[name="description"]', 'Plumbing repair')
  await page.check('[name="isRecurring"]') // Mark as recurring
  
  // Save transaction
  await page.click('button:has-text("Add Transaction"):not(:has-text("Cancel"))')
  
  // Wait for drawer to close
  await expect(page.getByText('Add Transaction')).not.toBeVisible()
  
  // Verify transaction appears in table
  await expect(page.locator('text=ABC Plumbing')).toBeVisible()
  await expect(page.locator('text=$150.00')).toBeVisible()
  
  // Verify Financial Pulse actual cash flow updated
  await page.waitForTimeout(1000) // Wait for recalculation
  const actualCashFlow = page.locator('[data-testid="actual-cash-flow"]')
  await expect(actualCashFlow).toBeVisible()
})
```

**Test Cases:**
- [ ] Drawer opens when "Add Transaction" clicked
- [ ] Transaction type selection (income/expense/capital) works
- [ ] Required fields validated (date, amount, category)
- [ ] Vendor required for expenses
- [ ] Payer required for income
- [ ] Recurring checkbox works
- [ ] Transaction saves successfully
- [ ] Transaction appears in table after save
- [ ] Financial Pulse actual cash flow updates
- [ ] Drawer closes after save
- [ ] Error message shows on validation failure

#### Test 5: Edit Transaction via Table Row Click

**File:** `edit-transaction.spec.ts`

```typescript
test('edit transaction from table row', async ({ page }) => {
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Wait for transactions table to load
  await page.waitForSelector('[data-testid="property-transactions-table"]')
  
  // Click on first transaction row
  const firstRow = page.locator('[data-testid="transaction-row"]').first()
  await firstRow.click()
  
  // Wait for drawer to open with transaction data
  await expect(page.getByText('Edit Transaction')).toBeVisible()
  
  // Verify form is pre-filled with existing data
  const amountField = page.locator('[name="amount"]')
  const existingAmount = await amountField.inputValue()
  expect(existingAmount).toBeTruthy()
  
  // Update transaction amount
  await amountField.clear()
  await amountField.fill('250.00')
  
  // Save changes
  await page.click('button:has-text("Update Transaction")')
  
  // Wait for drawer to close
  await expect(page.getByText('Edit Transaction')).not.toBeVisible()
  
  // Verify table updated with new amount
  await expect(page.locator('text=$250.00')).toBeVisible()
  
  // Verify Financial Pulse recalculated
  await page.waitForTimeout(1000)
})
```

**Test Cases:**
- [ ] Table row click opens drawer
- [ ] Drawer shows "Edit Transaction" title (not "Add Transaction")
- [ ] Form pre-filled with existing transaction data
- [ ] Amount field updates correctly
- [ ] Category and type are pre-selected correctly
- [ ] Changes save successfully
- [ ] Table updates with new values
- [ ] Financial Pulse recalculates after edit
- [ ] Drawer closes after save

#### Test 6: Archive Transaction via Menu

**File:** `archive-transaction.spec.ts`

```typescript
test('archive transaction excludes from calculations', async ({ page }) => {
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Get initial actual cash flow value
  const initialCashFlow = await page.locator('[data-testid="actual-cash-flow"]').textContent()
  
  // Open transaction drawer
  const firstRow = page.locator('[data-testid="transaction-row"]').first()
  await firstRow.click()
  await expect(page.getByText('Edit Transaction')).toBeVisible()
  
  // Click ellipses menu button
  await page.click('[data-testid="transaction-menu-button"]')
  
  // Click "Archive" option
  await page.click('text=Archive')
  
  // Wait for drawer to close
  await expect(page.getByText('Edit Transaction')).not.toBeVisible()
  
  // Verify transaction still visible in table (archived indicator)
  await expect(firstRow).toBeVisible()
  
  // Verify Financial Pulse actual cash flow updated (excludes archived transaction)
  await page.waitForTimeout(1000)
  const updatedCashFlow = await page.locator('[data-testid="actual-cash-flow"]').textContent()
  expect(updatedCashFlow).not.toBe(initialCashFlow)
})
```

**Test Cases:**
- [ ] Ellipses menu button visible in edit mode
- [ ] Menu dropdown shows "Archive" option
- [ ] Archive action works without confirmation
- [ ] Transaction marked as archived (indicator in table)
- [ ] Financial Pulse excludes archived transaction from calculations
- [ ] Transaction still visible in table (not deleted)

#### Test 7: Delete Transaction via Menu

**File:** `delete-transaction.spec.ts`

```typescript
test('delete transaction permanently removes it', async ({ page }) => {
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Get transaction amount for verification
  const firstRow = page.locator('[data-testid="transaction-row"]').first()
  const transactionAmount = await firstRow.locator('[data-testid="transaction-amount"]').textContent()
  
  // Open transaction drawer
  await firstRow.click()
  await expect(page.getByText('Edit Transaction')).toBeVisible()
  
  // Click ellipses menu
  await page.click('[data-testid="transaction-menu-button"]')
  
  // Click "Delete" option
  await page.click('text=Delete')
  
  // Verify delete confirmation card is shown
  await expect(page.getByText('Delete Transaction')).toBeVisible()
  await expect(page.getByText('This action cannot be undone')).toBeVisible()
  
  // Confirm deletion
  await page.click('button:has-text("Delete Permanently")')
  
  // Wait for deletion to complete
  await page.waitForTimeout(1000)
  
  // Verify transaction removed from table
  await expect(firstRow).not.toContainText(transactionAmount)
  
  // Verify Financial Pulse recalculated
  await expect(page.locator('[data-testid="actual-cash-flow"]')).toBeVisible()
})
```

**Test Cases:**
- [ ] Delete option in menu opens delete confirmation
- [ ] Delete confirmation card is shown (form hidden)
- [ ] "Cancel" button hides confirmation and shows form
- [ ] "Delete Permanently" button deletes transaction
- [ ] Transaction removed from table after deletion
- [ ] Financial Pulse recalculates after deletion
- [ ] Drawer closes after deletion

#### Test 8: Add Loan via Drawer

**File:** `add-loan.spec.ts`

```typescript
test('add loan updates debt service', async ({ page }) => {
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Get initial debt service
  const initialDebtService = await page.locator('[data-testid="debt-service"]').textContent()
  
  // Click "Add Loan" in Debt Logic card
  await page.click('[data-testid="debt-logic-add-loan"]')
  
  // Wait for drawer to open
  await expect(page.getByText('Add Loan')).toBeVisible()
  
  // Fill in loan form
  await page.selectOption('[name="loanType"]', 'mortgage')
  await page.fill('[name="loanAmount"]', '300000')
  await page.fill('[name="interestRate"]', '0.045') // 4.5%
  await page.fill('[name="loanTermYears"]', '30')
  await page.fill('[name="monthlyPrincipalInterest"]', '1520')
  await page.fill('[name="monthlyEscrow"]', '500')
  
  // Save loan
  await page.click('button:has-text("Add Loan"):not(:has-text("Cancel"))')
  
  // Wait for drawer to close
  await expect(page.getByText('Add Loan')).not.toBeVisible()
  
  // Verify loan appears in Debt Logic card
  await expect(page.locator('[data-testid="debt-logic-loan-list"]')).toContainText('Mortgage')
  
  // Verify Financial Pulse debt service updated
  await page.waitForTimeout(1000)
  const updatedDebtService = await page.locator('[data-testid="debt-service"]').textContent()
  expect(updatedDebtService).not.toBe(initialDebtService)
})
```

**Test Cases:**
- [ ] Drawer opens when "Add Loan" clicked
- [ ] Loan form fields are editable
- [ ] Loan type selection works
- [ ] Monthly payment calculates correctly (P&I + Escrow)
- [ ] Loan saves successfully
- [ ] Loan appears in Debt Logic card
- [ ] Financial Pulse debt service updates
- [ ] Interest rate displays correctly in Financial Pulse
- [ ] Drawer closes after save

#### Test 9: Monthly Comparison Chart Displays Data

**File:** `monthly-chart.spec.ts`

```typescript
test('monthly comparison chart displays projected vs actual', async ({ page }) => {
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Scroll to chart section
  const chartSection = page.locator('[data-testid="monthly-comparison-chart"]')
  await chartSection.scrollIntoViewIfNeeded()
  
  // Wait for chart to render
  await page.waitForTimeout(2000) // Chart rendering delay
  
  // Verify chart container is visible
  await expect(chartSection).toBeVisible()
  
  // Verify chart has data points (check for SVG elements)
  const chartElements = page.locator('[data-testid="monthly-chart"] svg')
  await expect(chartElements.first()).toBeVisible()
  
  // Verify time period selector works (1M, 3M, 1Y tabs)
  const oneMonthTab = page.locator('button:has-text("1M")')
  await oneMonthTab.click()
  await page.waitForTimeout(1000)
  await expect(oneMonthTab).toHaveAttribute('aria-selected', 'true')
  
  // Switch to 3 months
  const threeMonthTab = page.locator('button:has-text("3M")')
  await threeMonthTab.click()
  await page.waitForTimeout(1000)
  await expect(threeMonthTab).toHaveAttribute('aria-selected', 'true')
})
```

**Test Cases:**
- [ ] Chart container renders correctly
- [ ] Chart displays projected line (if structured data exists)
- [ ] Chart displays actual line (if transactions exist)
- [ ] Chart shows variance (difference between projected and actual)
- [ ] Time period tabs work (1M, 3M, 1Y)
- [ ] Chart updates when time period changes
- [ ] Daily data shown for 1M and 3M periods
- [ ] Monthly data shown for 1Y period
- [ ] Chart handles empty data gracefully (no crash)

#### Test 10: Complete Financial Workflow

**File:** `complete-financial-workflow.spec.ts`

```typescript
test('complete workflow: setup property financials from scratch', async ({ page }) => {
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Step 1: Add acquisition data
  await page.click('[data-testid="acquisition-intel-manage"]')
  await page.fill('[name="purchasePrice"]', '500000')
  await page.fill('[name="purchaseDate"]', '2023-01-01')
  await page.fill('[name="closingCostsTotal"]', '15000')
  await page.fill('[name="depreciationBasis"]', '500000')
  await page.click('button:has-text("Save")')
  await page.waitForTimeout(1000)
  
  // Step 2: Add operating expenses
  await page.click('[data-testid="operating-core-manage"]')
  await page.fill('[name="propertyTaxAnnual"]', '12000')
  await page.fill('[name="insuranceAnnual"]', '2400')
  await page.fill('[name="hoaMonthly"]', '200')
  await page.fill('[name="managementRate"]', '0.10')
  await page.click('button:has-text("Save")')
  await page.waitForTimeout(1000)
  
  // Step 3: Add loan
  await page.click('[data-testid="debt-logic-add-loan"]')
  await page.selectOption('[name="loanType"]', 'mortgage')
  await page.fill('[name="loanAmount"]', '400000')
  await page.fill('[name="interestRate"]', '0.045')
  await page.fill('[name="monthlyPrincipalInterest"]', '2026')
  await page.fill('[name="monthlyEscrow"]', '600')
  await page.click('button:has-text("Add Loan")')
  await page.waitForTimeout(1000)
  
  // Step 4: Add transactions
  await page.click('button:has-text("Add Transaction")')
  await page.selectOption('[name="type"]', 'income')
  await page.fill('[name="amount"]', '3000')
  await page.selectOption('[name="category"]', 'rent')
  await page.fill('[name="payer"]', 'Tenant A')
  await page.click('button:has-text("Add Transaction")')
  await page.waitForTimeout(1000)
  
  // Step 5: Verify all financial cards show correct values
  // Financial Pulse should show projected and actual cash flow
  await expect(page.locator('[data-testid="projected-cash-flow"]')).toBeVisible()
  await expect(page.locator('[data-testid="actual-cash-flow"]')).toBeVisible()
  
  // Operating Core should show NOI and margin
  await expect(page.locator('[data-testid="operating-core-noi"]')).toBeVisible()
  await expect(page.locator('[data-testid="operating-core-margin"]')).toBeVisible()
  
  // Tax Shield should show calculated depreciation (not placeholder)
  const unclaimedDepreciation = await page.locator('[data-testid="tax-shield-depreciation"]').textContent()
  expect(unclaimedDepreciation).not.toContain('42100') // Not placeholder
  
  // Debt Logic should show loan
  await expect(page.locator('[data-testid="debt-logic-loan-list"]')).toContainText('Mortgage')
})
```

**Test Cases:**
- [ ] Complete workflow from empty property to full financial setup
- [ ] All cards update correctly after each step
- [ ] Calculations are correct at each step
- [ ] No data loss between steps
- [ ] All drawers open and close correctly

#### Test 11: Error Handling and Validation

**File:** `error-handling.spec.ts`

```typescript
test('validation errors display correctly in forms', async ({ page }) => {
  await page.goto('/property-hub/[propertyId]/financials')
  
  // Test transaction form validation
  await page.click('button:has-text("Add Transaction")')
  await page.selectOption('[name="type"]', 'expense')
  
  // Try to save without required fields
  await page.click('button:has-text("Add Transaction"):not(:has-text("Cancel"))')
  
  // Verify error messages display
  await expect(page.locator('text=Transaction date is required')).toBeVisible()
  await expect(page.locator('text=Amount must be greater than 0')).toBeVisible()
  await expect(page.locator('text=Category is required')).toBeVisible()
  await expect(page.locator('text=Vendor is required for expenses')).toBeVisible()
  
  // Fill in fields and verify errors clear
  await page.fill('[name="transactionDate"]', '2024-12-01')
  await expect(page.locator('text=Transaction date is required')).not.toBeVisible()
})
```

**Test Cases:**
- [ ] Form validation errors display correctly
- [ ] Error messages clear when fields are filled
- [ ] Server error messages display in error card
- [ ] Network errors handled gracefully (not crash)
- [ ] Invalid data formats rejected (negative amounts, future dates, etc.)

## E2E Test Organization

### Test File Structure

```
apps/web/tests/e2e/financials/
├── financials-page-load.spec.ts
├── financials-calculations.spec.ts
├── add-operating-expenses.spec.ts
├── add-transaction.spec.ts
├── edit-transaction.spec.ts
├── archive-transaction.spec.ts
├── delete-transaction.spec.ts
├── add-loan.spec.ts
├── monthly-chart.spec.ts
├── complete-financial-workflow.spec.ts
└── error-handling.spec.ts
```

### Shared Test Helpers

Create `apps/web/tests/e2e/financials/helpers.ts`:

```typescript
export async function navigateToFinancials(page, propertyId: string) {
  await page.goto(`/property-hub/${propertyId}/financials`)
  await page.waitForSelector('[data-testid="financial-pulse"]', { timeout: 10000 })
}

export async function addTransaction(page, transaction: {
  type: 'income' | 'expense' | 'capital'
  amount: string
  category: string
  date?: string
  vendor?: string
  payer?: string
}) {
  await page.click('button:has-text("Add Transaction")')
  await page.waitForSelector('[data-testid="transaction-drawer"]')
  
  await page.selectOption('[name="type"]', transaction.type)
  await page.fill('[name="transactionDate"]', transaction.date || new Date().toISOString().split('T')[0])
  await page.fill('[name="amount"]', transaction.amount)
  await page.selectOption('[name="category"]', transaction.category)
  
  if (transaction.type === 'expense' && transaction.vendor) {
    await page.fill('[name="vendor"]', transaction.vendor)
  }
  if (transaction.type === 'income' && transaction.payer) {
    await page.fill('[name="payer"]', transaction.payer)
  }
  
  await page.click('button:has-text("Add Transaction"):not(:has-text("Cancel"))')
  await page.waitForTimeout(1000) // Wait for save
}

// More helper functions...
```

### E2E Test Prerequisites

**Before running E2E tests:**
1. Test database with seed data
2. Authenticated test user
3. Test property with various data states (complete, minimal, etc.)
4. API server running and accessible
5. Mock external services (bank connections, etc.) if needed

### Phase 5: Edge Cases & Data Validation

**Goal:** Ensure application handles edge cases gracefully

#### Missing Data Scenarios

- [ ] Property with no rental income data (should show transaction income)
- [ ] Property with no operating expenses (should show transaction expenses only)
- [ ] Property with no loans (debt service should be 0)
- [ ] Property with no transactions (should show projected only)
- [ ] Property with missing purchase date (tax shield should show 0)
- [ ] Property with missing depreciation basis (tax shield should show "Low" potential)

#### Invalid Data Scenarios

- [ ] Negative amounts in transactions (should validate)
- [ ] Future transaction dates (should allow or validate)
- [ ] Transaction amounts with too many decimal places (should format)
- [ ] Loan interest rate > 100% (should validate)
- [ ] Zero or negative purchase price (should handle gracefully)

#### Calculation Edge Cases

- [ ] Cash flow negative (should display correctly, not error)
- [ ] NOI negative (should display correctly)
- [ ] Variance negative (should show as negative value)
- [ ] Cost segregation at exact threshold values ($200k, $500k)
- [ ] Depreciation schedule for unknown property types (should default to 27.5)

#### UI Edge Cases

- [ ] Very large numbers (should format with commas, not overflow)
- [ ] Very long property names (should truncate or wrap)
- [ ] Rapid drawer open/close (should not cause errors)
- [ ] Network failure during save (should show error, not crash)
- [ ] Concurrent edits (should handle race conditions)

## Test Data Requirements

### Test Properties Needed

1. **Complete Property** - All data present (income, expenses, loans, transactions)
2. **Minimal Property** - Only basic data (no transactions, minimal expenses)
3. **Residential Property** - SFR or Condo (27.5-year depreciation)
4. **Commercial Property** - Multifamily (39-year depreciation)
5. **New Property** - Recently purchased (< 1 year ago)
6. **Old Property** - Purchased 10+ years ago
7. **High Value Property** - Depreciation basis > $500k
8. **Low Value Property** - Depreciation basis < $200k

### Test Transactions Needed

1. **Income Transactions** - Rent, parking, laundry, etc.
2. **Expense Transactions** - Property tax, insurance, maintenance, etc.
3. **Recurring Transactions** - Monthly expenses
4. **One-time Transactions** - Capital improvements, repairs
5. **Excluded Transactions** - Archived transactions
6. **Transactions with Missing Fields** - Partial data

## Testing Tools & Setup

### Unit Tests
- **Framework:** Vitest
- **Location:** `apps/web/src/utils/finances/__tests__/`
- **Coverage Target:** 90%+ for calculation utilities

### Component Tests
- **Framework:** React Testing Library + Vitest
- **Location:** `apps/web/src/components/property-hub/property-details/financials/__tests__/`
- **Coverage Target:** 80%+ for components

### Integration Tests
- **Framework:** React Testing Library + MSW (Mock Service Worker)
- **Location:** `apps/web/src/components/drawers/__tests__/`
- **Mock API:** MSW handlers for property/transaction endpoints

### E2E Tests
- **Framework:** Playwright
- **Location:** `apps/web/tests/e2e/financials/`
- **Environment:** Test database with seed data

## Success Criteria

### Calculation Accuracy
- [ ] All calculation utilities pass unit tests with 90%+ coverage
- [ ] Calculation results match expected values from manual calculations
- [ ] Edge cases handled correctly (null values, zero amounts, negative results)

### Component Functionality
- [ ] All financial cards display correct data
- [ ] Components handle missing data gracefully (no crashes)
- [ ] Loading and error states display correctly

### User Experience
- [ ] All drawers save data successfully
- [ ] Data updates immediately after save (no refresh needed)
- [ ] Error messages are clear and actionable
- [ ] Form validation works correctly

### Data Integrity
- [ ] No duplicate expenses between structured data and transactions
- [ ] Loan payments excluded from operating expenses
- [ ] Archived transactions excluded from calculations
- [ ] Calculations update when data changes

### Performance
- [ ] Financials tab loads in < 2 seconds
- [ ] Calculations don't block UI
- [ ] Large transaction lists render efficiently
- [ ] Charts render smoothly

## Testing Timeline

1. **Week 1:** Phase 1 - Unit tests for calculation utilities
2. **Week 2:** Phase 2 - Component tests for financial cards
3. **Week 3:** Phase 3 - Integration tests for drawers
4. **Week 4:** Phase 4 - E2E tests for workflows
5. **Week 5:** Phase 5 - Edge cases and bug fixes

## Notes

- All tests should use test data, not production data
- Mock API responses for consistency
- Use consistent test property IDs across test suites
- Document any calculation discrepancies found during testing
- Update tests when calculation logic changes

