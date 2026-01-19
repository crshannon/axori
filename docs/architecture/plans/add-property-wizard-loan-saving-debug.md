# Add Property Wizard - Loan Saving Debugging

**Created:** 2024-12-19  
**Status:** Complete  
**Issue:** Loans not appearing on finance page after wizard creation

## Problem

Loans created via the wizard are not appearing on the finance page, even though they should be saved correctly.

## Root Cause Analysis

### Issue 1: Silent Failure in Loan Creation ⚠️ FIXED

**Problem:**

- The PUT endpoint (`/api/properties/:id`) loan creation logic (lines 841-916) had nested conditions
- Loan creation only happened if `clerkId` AND `user` were found
- If either was missing, loan silently wasn't created - **no error logged or thrown**

**Code Before:**

```typescript
if (loan) {
  if (clerkId) {
    if (user) {
      // Loan creation happens here
    }
    // If user not found, loan silently not created
  }
  // If clerkId missing, loan silently not created
}
```

**Code After:**

```typescript
if (loan) {
  try {
    if (!clerkId) {
      console.error("Loan creation failed: No authorization header found");
      throw new Error(
        "Unauthorized: No authorization header for loan creation"
      );
    }
    if (!user) {
      console.error("Loan creation failed: User not found");
      throw new Error("Unauthorized: User not found for loan creation");
    }
    // Loan creation with proper error handling
  } catch (loanError) {
    // Log errors and re-throw to outer catch block
    console.error("Loan creation error:", loanError);
    throw loanError;
  }
}
```

### Issue 2: Validation Schema Alignment ✅ VERIFIED

**Wizard Sends (usePropertyPersistence.ts):**

```typescript
{
  loanType: 'conventional',
  originalLoanAmount: 300000, // number
  interestRate: 6.5, // number (percentage 0-100)
  termMonths: 360, // number
  currentBalance: 300000, // number
  lenderName: 'Chase Bank', // string
  status: 'active',
  isPrimary: true,
  loanPosition: 1,
  monthlyPrincipalInterest: 1896.20, // number
  totalMonthlyPayment: 1896.20, // number
  monthlyEscrow: 0, // number
  monthlyPmi: 0, // number
  monthlyMip: 0, // number
  paymentDueDay: 1, // number
}
```

**API Expects (loanInsertApiSchema):**

- ✅ All fields match schema requirements
- ✅ All calculated fields are in schema (added in previous fix)
- ✅ Field types match (numbers for numeric fields)

### Issue 3: API Route Comparison

**Wizard Uses:** `PUT /api/properties/:id` with `loan` in body

- ✅ Saves all calculated fields
- ✅ Uses `loanInsertApiSchema` validation
- ✅ Fixed: Error handling added

**AddLoanDrawer Uses:** `POST /api/properties/:id/loans`

- ✅ Dedicated loan creation endpoint
- ⚠️ Doesn't save calculated payment fields (only saves basic fields)
- ✅ Uses `loanInsertApiSchema` validation

## Fixes Applied

### 1. Error Handling in PUT Endpoint ✅

**Added:**

- Explicit error checking for `clerkId` and `user`
- Error logging for debugging
- Proper error propagation (throws errors instead of silent failure)

**Code:**

```typescript
if (loan) {
  try {
    if (!clerkId) {
      console.error("Loan creation failed: No authorization header found");
      throw new Error(
        "Unauthorized: No authorization header for loan creation"
      );
    }
    if (!user) {
      console.error("Loan creation failed: User not found");
      throw new Error("Unauthorized: User not found for loan creation");
    }
    // ... loan creation logic
  } catch (loanError) {
    console.error("Loan creation error:", loanError);
    throw loanError; // Propagate to outer catch block
  }
}
```

### 2. Validation Schema ✅ COMPLETE

**Updated:**

- Added `totalMonthlyPayment` to `loanInsertApiSchema`
- Added `paymentDueDay` to `loanInsertApiSchema`

### 3. API Route Loan Field Saving ✅ COMPLETE

**Updated:**

- All calculated payment fields are saved in PUT endpoint
- `monthlyPrincipalInterest`, `totalMonthlyPayment`, `loanPosition`, etc. are persisted

## Testing Checklist

After fixes, verify:

1. **Authorization:**
   - Check browser console for authorization errors
   - Verify `Authorization` header is being sent
   - Check API logs for "User not found" errors

2. **Validation:**
   - Check browser console for Zod validation errors
   - Verify all loan fields are valid
   - Check API logs for validation failures

3. **Database:**
   - Query `loans` table directly: `SELECT * FROM loans WHERE property_id = '...'`
   - Verify loan exists with `status = 'active'`
   - Check all fields are saved correctly

4. **Finance Page:**
   - Check Network tab - verify `GET /api/properties/:id` returns loans array
   - Verify query invalidation triggers refetch
   - Check if `property.loans` is populated in DebtLogic

## Debugging Commands

**Check if loan exists:**

```sql
SELECT * FROM loans WHERE property_id = 'YOUR_PROPERTY_ID';
```

**Check loan status:**

```sql
SELECT id, lender_name, status, is_primary, monthly_principal_interest, total_monthly_payment
FROM loans
WHERE property_id = 'YOUR_PROPERTY_ID';
```

## Files Modified

1. **`apps/api/src/routes/properties.ts`**
   - Added error handling for `clerkId` and `user` checks
   - Added loan error logging with detailed error info
   - Fixed indentation issues in loan creation block

## Next Steps

1. **Test loan creation** - Create property via wizard with loan data
2. **Check console/API logs** - Look for any loan creation errors
3. **Verify database** - Confirm loan is inserted with all fields
4. **Check finance page** - Verify loan appears immediately after save

If loans still don't appear:

- Check API logs for "Loan creation failed" or validation errors
- Check browser console for API errors
- Verify authorization header is being sent correctly
- Query database directly to see if loan was created
