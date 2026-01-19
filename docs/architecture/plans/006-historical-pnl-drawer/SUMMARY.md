# Historical P&L Registry Drawer - Summary

**Plan Version:** 006  
**Created:** 2026-01-16  
**Status:** In Progress

## What We Aim to Accomplish

Add a drawer component that allows users to manually add transactions to the Historical P&L Registry. This will enable users to record income, expenses, and capital transactions directly from the UI, complementing automated transaction imports from Plaid, AppFolio, and document AI.

## Why This Is Needed

The `PropertyTransactions` component currently displays transactions but has no way for users to add new transactions manually. Users need the ability to:
- Record one-off transactions that aren't captured by automated imports
- Manually enter historical transactions for properties added to the system
- Correct or supplement automated transaction data
- Add transactions for properties without automated integrations

## Key Goals

- **Manual Transaction Entry**: Allow users to add income, expense, and capital transactions
- **Form Validation**: Ensure all required fields are validated before submission
- **Type-Specific Fields**: Show relevant fields based on transaction type (vendor for expenses, payer for income)
- **Category Selection**: Provide dropdown for transaction categories matching the database enum
- **Design System Compliance**: Use design system components (`@axori/ui`)
- **API Integration**: Create API endpoint following existing patterns
- **Success Handling**: Refresh transaction list and close drawer on successful submission

## Expected Outcome

A fully functional drawer component that:
- Opens from the Historical P&L Registry section
- Allows users to enter transaction details (type, date, amount, category, description, etc.)
- Validates input using Zod schemas
- Submits to API endpoint for creating transactions
- Integrates seamlessly with existing `PropertyTransactions` component
- Follows the same patterns as other drawers (`OperatingExpensesDrawer`, `AddLoanDrawer`)

## Main Phases

1. **Phase 1: Validation Schema** - Create Zod schema for transaction creation
2. **Phase 2: API Endpoint** - Add POST endpoint for creating transactions
3. **Phase 3: Drawer Component** - Build the drawer with form fields
4. **Phase 4: Integration** - Wire up drawer to PropertyTransactions component and financials page

## Related Plans

- `003-pl-record-implementation/` - PropertyTransactions component implementation
- `004-property-transactions-integration/` - Transaction table schema and structure

## Notes

- **Transaction Types**: Support `income`, `expense`, and `capital` transaction types
- **Category Enum**: Use existing `transactionCategoryEnum` from schema
- **Source Field**: Default to `"manual"` for user-entered transactions
- **Review Status**: Default to `"pending"` for manual entries (user can review later)
- **Required Fields**: `type`, `transactionDate`, `amount`, `category`, `propertyId`
- **Optional Fields**: `subcategory`, `vendor`/`payer`, `description`, `notes`, `taxCategory`, `isTaxDeductible`, `isRecurring`

