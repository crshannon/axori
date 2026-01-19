# ADR-001: Property Schema Refactoring

**Status**: Accepted  
**Date**: 2026-01-10  
**Author**: AI + Craig Shannon

## Context

The Add Property Wizard collects extensive data across 6 steps:

1. **Address** - Location and geocoding
2. **Property Details** - Beds, baths, sqft, year built, lot size
3. **Ownership** - Entity type, entity name
4. **Financing** - Purchase details, loan information
5. **Management** - Rental status, management type
6. **Strategy** - Investment strategy

Initially, we considered storing wizard form data as a JSON blob in a `wizardData` field to persist user input across steps and page refreshes.

### Problems with JSON Blob Approach

1. **Not queryable** - Can't filter properties by bedrooms, purchase price, etc.
2. **No type safety** - JSON strings lose TypeScript typing
3. **No referential integrity** - Can't enforce relationships or constraints
4. **Poor data modeling** - Treats structured data as unstructured
5. **Limited validation** - Database can't enforce data quality rules

## Decision

**Split property data into normalized relational tables:**

### Schema Structure

```
properties (core table)
├── id, portfolioId, addedBy
├── address, city, state, zipCode
├── latitude, longitude, mapboxPlaceId
├── propertyType, status
└── rentcastData (cache only)

property_details (1:1)
├── propertyId → properties.id
├── bedrooms, bathrooms
├── squareFeet, lotSize
└── yearBuilt

property_finances (1:1)
├── propertyId → properties.id
├── purchaseDate, purchasePrice, closingCosts
├── currentValue
├── entityType, entityName
├── financeType, loanType
├── loanAmount, interestRate, loanTerm
└── lender

property_management (1:1)
├── propertyId → properties.id
├── isRented, monthlyRent, leaseEndDate
├── tenantName
├── managementType, managementCompany
└── investmentStrategy
```

### Alignment with Architect Skill

Following the [Architect Skill guidelines](../../.skills/architect/):

1. **Drizzle Schema** - Defined in `packages/db/src/schema/index.ts`
   - Used proper column types (`integer`, `numeric`, `date`, `boolean`)
   - camelCase in code, snake_case in DB
   - Foreign keys with `onDelete: "cascade"`
   - One-to-one relationships via `.unique()` constraint

2. **TypeScript Types** - Defined in `packages/db/src/types.ts`
   - Used `InferSelectModel` and `InferInsertModel`
   - No manual type duplication
   - Exported for use across packages

3. **Zod Validation** - Defined in `packages/shared/src/validation/index.ts`
   - Insert/Select/Update schemas for each table
   - Validation rules match DB constraints
   - Proper type transformations (date strings, numerics)

4. **Drizzle Relations** - Defined in schema
   - Bidirectional relations between tables
   - Type-safe queries with `.with()` syntax

## Consequences

### Positive

✅ **Queryable** - Can filter, sort, aggregate on any field  
✅ **Type-safe** - Full TypeScript support end-to-end  
✅ **Validated** - Database constraints + Zod validation  
✅ **Performant** - Indexed columns, efficient queries  
✅ **Extensible** - Easy to add fields or tables  
✅ **Maintainable** - Clear separation of concerns

### Negative

⚠️ **More complex queries** - Need joins to get full property data  
⚠️ **More tables to migrate** - Schema changes affect multiple tables  
⚠️ **Potential for orphaned data** - If cascade deletes fail (mitigated by FK constraints)

### Mitigation Strategies

1. **Use Drizzle relations** - `.with()` syntax handles joins automatically
2. **Helper queries** - Create reusable query functions for common patterns
3. **Transaction support** - Wrap multi-table operations in transactions
4. **Cascade deletes** - FK constraints ensure referential integrity

## Implementation

### Migration Required

```bash
cd packages/db
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### Code Updates Needed

1. **Update `usePropertyPersistence` hook** - Save to multiple tables
2. **Update `usePropertyFormData` hook** - Load from multiple tables
3. **Update API routes** - Join tables when fetching properties
4. **Create transaction helpers** - Wrap multi-table saves

## Alternative Considered

### JSON Blob (wizardData field)

**Pros**: Simple, one table, easy to save  
**Cons**: Not queryable, no validation, poor data modeling  
**Verdict**: ❌ Rejected - Anti-pattern for structured data

## Related

- [Architect Skill - Schema Alignment](../../.skills/architect/drizzle-zod-alignment.md)
- [Architect Skill - Type Inference](../../.skills/architect/type-inference-patterns.md)
- Property Wizard Persistence Implementation (TBD)

## References

- Drizzle ORM: https://orm.drizzle.team/
- Database Normalization: https://en.wikipedia.org/wiki/Database_normalization
- Architect Skill: `.skills/architect/SKILL.md`
