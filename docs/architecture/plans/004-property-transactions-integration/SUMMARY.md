# Property Transactions Integration - Summary

**Plan Version:** 004  
**Created:** 2025-01-16  
**Status:** Planning

## What We Aim to Accomplish

Complete the integration of the unified `property_transactions` table by generating Zod schemas, creating API routes and hooks, and updating the PLRecord component to use the new transaction system instead of the legacy expense system.

## Why This Is Needed

We've successfully created a unified `property_transactions` table that handles all transaction types (income, expense, capital), but the application still uses the old `property_expenses` system. We need to:

- Generate validation schemas using `drizzle-zod` for type safety
- Create API routes for the unified transaction system
- Build React Query hooks for transaction operations
- Update the PLRecord component to use the new system
- Ensure backward compatibility is handled during migration

## Key Goals

- **Zod Schema Generation**: Auto-generate base schemas from Drizzle, create enhanced API schemas
- **API Integration**: Create unified transaction endpoints (GET, POST, PUT, DELETE)
- **Hook Migration**: Replace expense hooks with transaction hooks
- **Component Update**: Wire PLRecord to use new transaction hooks
- **Type Safety**: Ensure end-to-end type safety from database to frontend

## Expected Outcome

A fully functional transaction system where:

- All transactions (income, expense, capital) are stored in `property_transactions`
- API routes handle all transaction types with proper validation
- Frontend hooks provide type-safe access to transactions
- PLRecord component displays and manages all transaction types
- Migration path is clear and documented

## Main Phases

1. **Phase 1: Zod Schema Generation** - Generate base and enhanced schemas for `property_transactions`
2. **Phase 2: API Routes** - Create unified transaction endpoints with validation
3. **Phase 3: React Query Hooks** - Build hooks for transaction operations
4. **Phase 4: Component Integration** - Update PLRecord to use new hooks
5. **Phase 5: Migration & Testing** - Test end-to-end and handle any migration issues

## Related Plans

- `003-pl-record-implementation/` - Initial PLRecord component and schema design
- `drizzle-zod-migration-plan.md` - Schema validation patterns

## Notes

- The unified `property_transactions` table is already created in the schema
- We're removing backward compatibility for `property_expenses` (MVP phase)
- Need to follow the Drizzle-Zod workflow from `.skills/architect/drizzle-zod-alignment.md`
- Transaction types: `income`, `expense`, `capital`
- Unified category enum combines all transaction categories
