# P&L Record Component Implementation - Summary

**Plan Version:** 003  
**Created:** 2025-01-15  
**Status:** In Progress - Schema Complete, Component Built

## What We Aim to Accomplish

Transform the PLRecord component from a static placeholder into a fully functional profit & loss ledger that tracks both income and expense transactions with advanced filtering, sorting, pagination, review workflow, and document linking capabilities.

## Why This Is Needed

The current PLRecord component is a placeholder with mock data. We need a production-ready component that:
- Integrates with our existing `property_expenses` table
- Supports income transactions (currently missing)
- Provides a unified view of all financial transactions
- Enables users to review, approve, flag, and exclude transactions
- Links transactions to documents (receipts, emails, etc.)
- Supports advanced filtering and sorting for audit purposes
- Handles large datasets with pagination

## Key Goals

- **Unified Transaction View**: Display both income and expenses in a single table
- **TanStack Table Integration**: Use TanStack Table for advanced table features
- **Review Workflow**: Allow users to flag, approve, or exclude transactions
- **Document Linking**: Link transactions to documents/records
- **Advanced Filtering**: Filter by date range, category, source, status, etc.
- **Sorting & Pagination**: Handle large datasets efficiently
- **Design System Compliance**: Use design system components throughout
- **Transaction Management**: Add/edit/delete transactions via drawer

## Expected Outcome

A fully functional P&L ledger component that:
- Displays all property transactions (income + expenses) in a unified table
- Supports filtering, sorting, and pagination
- Allows users to review and manage transactions
- Links to documents and external records
- Follows design system patterns
- Integrates seamlessly with existing expense hooks and API

## Main Phases

1. **Phase 1: Schema Analysis & Extensions** - Analyze existing schema, identify gaps, extend tables if needed
2. **Phase 2: Dependencies & Setup** - Install TanStack Table, create shared components
3. **Phase 3: Transaction Hooks & API** - Create/update hooks for unified transaction queries
4. **Phase 4: PLRecord Component** - Build main component with TanStack Table
5. **Phase 5: Transaction Drawer** - Create drawer for adding/editing transactions
6. **Phase 6: Advanced Features** - Add filtering, sorting, pagination, review workflow
7. **Phase 7: Integration & Testing** - Wire up to real data, test all features

## Related Plans

- `property-expenses-implementation.md` - Existing expense table implementation
- `drizzle-zod-migration-plan.md` - Schema validation patterns

## Notes

- **Unified Table Approach**: We're using a unified `property_transactions` table that handles all transaction types (income, expense, capital) with a `type` enum field. This provides a single source of truth for the P&L ledger.
- **No Backward Compatibility**: Since we're in MVP phase, `property_expenses` table has been removed. All transactions use `property_transactions`.
- **Transaction Types**: `income`, `expense`, `capital` - allows flexibility for future transaction types
- **Unified Categories**: Combined expense and income categories into a single `transaction_category` enum
- **Document Linking**: `documentId` field exists for linking to documents (property_documents table may need to be created later)
- **Review Workflow**: Status enum supports `pending`, `approved`, `flagged`, `excluded`



