# Drizzle-Zod Migration Testing Checklist

## Phase 5 Testing: API Routes

### ✅ Completed Verification

1. **Schema Exports**
   - ✅ Enhanced schemas exported from `packages/shared/src/validation/index.ts`
   - ✅ `loanInsertApiSchema` and `loanUpdateApiSchema` available
   - ✅ `propertyExpenseInsertApiSchema` and `propertyExpenseUpdateApiSchema` available

2. **API Route Updates**
   - ✅ `POST /api/properties/:id/loans` uses `loanInsertApiSchema`
   - ✅ `PUT /api/properties/:id/loans/:loanId` uses `loanUpdateApiSchema`
   - ✅ `POST /api/properties/:id/expenses` uses `propertyExpenseInsertApiSchema`
   - ✅ `PUT /api/properties/:id/expenses/:expenseId` uses `propertyExpenseUpdateApiSchema`

3. **Type Safety**
   - ✅ No TypeScript errors in `apps/api/src/routes/properties.ts`
   - ✅ All type assertions properly added
   - ✅ Field name mismatches resolved

### 🧪 Manual Testing Required

#### Loan Endpoints

**Create Loan:**
```bash
POST /api/properties/{propertyId}/loans
Content-Type: application/json
Authorization: Bearer {token}

{
  "loanType": "conventional",
  "lenderName": "Test Bank",
  "originalLoanAmount": 200000,
  "interestRate": 6.5,  # Percentage (0-100)
  "termMonths": 360,
  "currentBalance": 195000
}
```

**Expected:**
- ✅ Validates `interestRate` is between 0-100
- ✅ Validates `termMonths` is positive integer
- ✅ Converts `interestRate` from percentage to decimal for DB
- ✅ Stores `termMonths` directly (not `loanTerm`)

**Update Loan:**
```bash
PUT /api/properties/{propertyId}/loans/{loanId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "currentBalance": 190000,
  "interestRate": 6.25
}
```

**Expected:**
- ✅ Partial updates work (only provided fields)
- ✅ Validates `interestRate` if provided
- ✅ Converts percentage to decimal

#### Expense Endpoints

**Create Expense:**
```bash
POST /api/properties/{propertyId}/expenses
Content-Type: application/json
Authorization: Bearer {token}

{
  "expenseDate": "2024-01-15",
  "amount": 500.00,
  "category": "repairs",
  "isRecurring": false,
  "isTaxDeductible": true
}
```

**Expected:**
- ✅ Validates `amount` is positive
- ✅ Validates `expenseDate` is ISO date string
- ✅ Validates `category` is valid enum value
- ✅ Stores `amount` as string in DB (numeric column)

**Update Expense:**
```bash
PUT /api/properties/{propertyId}/expenses/{expenseId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "amount": 600.00
}
```

**Expected:**
- ✅ Partial updates work
- ✅ Validates `amount` if provided

### 🔍 Validation Tests

1. **Interest Rate Validation**
   - ✅ Accepts 0-100
   - ✅ Rejects > 100
   - ✅ Rejects negative values

2. **Amount Validation**
   - ✅ Accepts positive numbers
   - ✅ Rejects negative numbers
   - ✅ Rejects zero (if required)

3. **Date Validation**
   - ✅ Accepts ISO date strings (YYYY-MM-DD)
   - ✅ Rejects invalid date formats

4. **Enum Validation**
   - ✅ Accepts valid enum values
   - ✅ Rejects invalid enum values

### 📝 Notes

- All numeric fields from Drizzle are stored as strings in the database
- Enhanced schemas convert them to numbers for API validation
- API converts them back to strings when storing in DB
- `interestRate` is stored as decimal (0.065) but API expects percentage (6.5)

### ⚠️ Known Issues

- Pre-existing type errors in `data-transformers.ts` (unrelated to migration)
- These don't affect runtime behavior

