# Property Expenses Table Implementation Plan

## Overview

Implement `property_expenses` table to track actual expense transactions for properties. This complements `property_operating_expenses` which stores budgeted/expected amounts.**Key Distinction:**

- `property_operating_expenses` = Budgeted/expected expenses (for projections)
- `property_expenses` = Actual transactions (real money spent)

---

## Implementation Checklist

Following the Architect Skill guidelines for full-stack schema alignment:

### Phase 1: Database Schema (Drizzle ORM)

- [ ] **1.1** Add `propertyExpenses` table to `packages/db/src/schema/index.ts`
- Use camelCase field names (maps to snake_case in DB)
- Include all fields from spec
- Add proper foreign key references
- Add indexes for performance
- Use `timestamptz` for timestamps (not `timestamp`)
- [ ] **1.2** Create expense category enum (optional, or use text with validation)
- Consider: `expenseCategoryEnum` vs text field with Zod enum validation
- Recommendation: Use text field + Zod enum for flexibility
- [ ] **1.3** Add relations
- Add `expenses: many(propertyExpenses)` to `propertiesRelations`
- Create `propertyExpensesRelations` with:
  - `property: one(properties)`
  - `createdByUser: one(users)` (if users table exists)
  - `document: one(propertyDocuments)` (if table exists, otherwise nullable)
- [ ] **1.4** Export from schema index
- Ensure `propertyExpenses` is exported

### Phase 2: TypeScript Types

- [ ] **2.1** Use Drizzle type inference in `packages/db/src/types.ts`
- Export: `export type PropertyExpense = InferSelectModel<typeof propertyExpenses>`
- Export: `export type PropertyExpenseInsert = InferInsertModel<typeof propertyExpenses>`
- **DO NOT** manually define types - use inference only
- [ ] **2.2** Re-export from `packages/shared/src/types/index.ts`
- Import from `@axori/db` and re-export
- Maintain single source of truth

### Phase 3: Zod Validation Schemas

- [ ] **3.1** Create `propertyExpenseInsertSchema` in `packages/shared/src/validation/normalized-property.ts`
- Match all Drizzle fields (camelCase)
- Use appropriate Zod validators:
  - `z.string().uuid()` for UUIDs
  - `z.number().min(0)` for amounts
  - `z.date()` or `z.string()` for dates
  - `z.enum()` for category (if using enum)
  - `z.boolean().default()` for booleans
- Make `propertyId` required
- Make `expenseDate` and `amount` required
- Make `category` required
- All other fields optional/nullable
- [ ] **3.2** Create `propertyExpenseSelectSchema`
- Extend insert schema with `id`, `createdAt`, `updatedAt`
- [ ] **3.3** Create `propertyExpenseUpdateSchema` (optional)
- For partial updates
- Omit `id`, `propertyId`, `createdAt`
- All fields optional
- [ ] **3.4** Define expense category enum/type
- Create `expenseCategoryEnum` in Zod
- Export TypeScript type: `type ExpenseCategory = z.infer<typeof expenseCategoryEnum>`
- [ ] **3.5** Export schemas from `packages/shared/src/validation/index.ts`

### Phase 4: API Routes

- [ ] **4.1** Create expense routes in `apps/api/src/routes/properties.ts` or new file
- `GET /api/properties/:id/expenses` - List expenses for property
- `GET /api/properties/:id/expenses/:expenseId` - Get single expense
- `POST /api/properties/:id/expenses` - Create expense
- `PUT /api/properties/:id/expenses/:expenseId` - Update expense
- `DELETE /api/properties/:id/expenses/:expenseId` - Delete expense
- [ ] **4.2** Security & Authorization (CRITICAL)
- ✅ Verify user owns property before any operation
- ✅ Get `clerkId` from `Authorization` header (Bearer token)
- ✅ Lookup `userId` from `users` table using `clerkId`
- ✅ Verify property belongs to user: `property.userId === user.id`
- ✅ Filter all queries by property ownership
- ✅ Never expose other users' expenses
- ✅ Validate `propertyId` in URL matches authenticated user's property
- ✅ Set `createdBy` from authenticated user's `id` (not clerkId)
- ✅ Return 401 if no auth header, 404 if property not found (don't reveal existence)
- [ ] **4.3** Validation
- Use `propertyExpenseInsertSchema` for POST
- Use `propertyExpenseUpdateSchema` for PUT
- Validate category against enum
- Validate date formats
- Validate amount > 0
- [ ] **4.4** Query Features
- Filter by date range
- Filter by category
- Filter by isTaxDeductible
- Sort by date (desc by default)
- Pagination support

### Phase 5: Database Migration

- [ ] **5.1** Generate migration
- Run `pnpm --filter @axori/db db:generate`
- Review generated migration file
- Verify indexes are created
- Verify foreign key constraints
- [ ] **5.2** Test migration
- Run migration on dev database
- Verify table structure
- Verify indexes exist
- Test cascade delete

### Phase 6: Frontend Integration

- [ ] **6.1** Create React hooks in `apps/web/src/hooks/api/useProperties.ts`
- `usePropertyExpenses(propertyId)` - Query hook
- `useCreateExpense()` - Mutation hook
- `useUpdateExpense()` - Mutation hook
- `useDeleteExpense()` - Mutation hook
- [ ] **6.2** Update Property type interface
- Add `expenses?: PropertyExpense[]` to Property type
- Ensure API response includes expenses
- [ ] **6.3** Create expense components (future)
- Expense list component
- Expense form/drawer
- Expense category selector

### Phase 7: Testing & Validation

- [ ] **7.1** Verify schema alignment
- Drizzle fields match Zod schema fields
- Types are inferred (not manually defined)
- Field names are camelCase in code, snake_case in DB
- [ ] **7.2** Test API endpoints
- Create expense
- Update expense
- Delete expense
- List expenses with filters
- Verify user isolation (can't access other users' expenses)
- [ ] **7.3** Test security
- Unauthenticated requests fail
- User can't access other users' property expenses
- User can't create expenses for properties they don't own

---

## Schema Implementation Details

### Drizzle Schema Structure

```typescript
// In packages/db/src/schema/index.ts

import {
  pgTable,
  uuid,
  date,
  numeric,
  text,
  boolean,
  timestamptz,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const propertyExpenses = pgTable(
  "property_expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),

    // Transaction Details
    expenseDate: date("expense_date").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    category: text("category").notNull(),
    subcategory: text("subcategory"),
    vendor: text("vendor"),
    description: text("description"),

    // Recurring
    isRecurring: boolean("is_recurring").default(false),
    recurrenceFrequency: text("recurrence_frequency"), // 'monthly' | 'quarterly' | 'annual'
    recurrenceEndDate: date("recurrence_end_date"),

    // Tax
    isTaxDeductible: boolean("is_tax_deductible").default(true),
    taxCategory: text("tax_category"),

    // Document Link (optional - may not exist yet)
    documentId: uuid("document_id"), // .references(() => propertyDocuments.id) - if table exists

    // Source Tracking
    source: text("source").default("manual"), // 'manual' | 'appfolio' | 'plaid' | 'document_ai'
    externalId: text("external_id"),

    // Metadata
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    propertyIdIdx: index("idx_property_expenses_property_id").on(
      table.propertyId
    ),
    dateIdx: index("idx_property_expenses_date").on(table.expenseDate),
    categoryIdx: index("idx_property_expenses_category").on(table.category),
  })
);
```

### Relations

```typescript
// Add to propertiesRelations
export const propertiesRelations = relations(properties, ({ many, one }) => ({
  // ... existing relations
  expenses: many(propertyExpenses),
}));

// New relation
export const propertyExpensesRelations = relations(
  propertyExpenses,
  ({ one }) => ({
    property: one(properties, {
      fields: [propertyExpenses.propertyId],
      references: [properties.id],
    }),
    createdByUser: one(users, {
      fields: [propertyExpenses.createdBy],
      references: [users.id],
    }),
    // Only add if propertyDocuments table exists:
    // document: one(propertyDocuments, {
    //   fields: [propertyExpenses.documentId],
    //   references: [propertyDocuments.id],
    // }),
  })
);
```

### Zod Validation Schema

```typescript
// In packages/shared/src/validation/normalized-property.ts

export const expenseCategoryEnum = z.enum([
  "acquisition",
  "property_tax",
  "insurance",
  "hoa",
  "management",
  "repairs",
  "maintenance",
  "capex",
  "utilities",
  "legal",
  "accounting",
  "marketing",
  "travel",
  "office",
  "bank_fees",
  "licenses",
  "other",
]);

export const recurrenceFrequencyEnum = z.enum([
  "monthly",
  "quarterly",
  "annual",
]);

export const expenseSourceEnum = z.enum([
  "manual",
  "appfolio",
  "plaid",
  "document_ai",
]);

export const propertyExpenseInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),

  // Transaction Details
  expenseDate: z.union([z.string(), z.date()]),
  amount: z.number().min(0, "Amount must be positive"),
  category: expenseCategoryEnum,
  subcategory: z.string().max(100).optional().nullable(),
  vendor: z.string().max(255).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),

  // Recurring
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: recurrenceFrequencyEnum.optional().nullable(),
  recurrenceEndDate: z.union([z.string(), z.date()]).optional().nullable(),

  // Tax
  isTaxDeductible: z.boolean().default(true),
  taxCategory: z.string().max(100).optional().nullable(),

  // Document Link
  documentId: z.string().uuid().optional().nullable(),

  // Source Tracking
  source: expenseSourceEnum.default("manual"),
  externalId: z.string().max(255).optional().nullable(),

  // Metadata (set by API, not user input)
  createdBy: z.string().uuid().optional().nullable(),
});

export const propertyExpenseSelectSchema = propertyExpenseInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const propertyExpenseUpdateSchema = propertyExpenseInsertSchema
  .omit({ propertyId: true, id: true, createdAt: true })
  .partial();
```

### API Route Structure

```typescript
// In apps/api/src/routes/properties.ts or new expenses.ts file

// GET /api/properties/:id/expenses
propertiesRouter.get("/:id/expenses", async (c) => {
  const { id } = c.req.param();

  // Security: Get user from auth header
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Lookup user by clerkId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Security: Verify user owns property
  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.userId, user.id)))
    .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  // Query expenses with filters
  const expenses = await db
    .select()
    .from(propertyExpenses)
    .where(eq(propertyExpenses.propertyId, id))
    .orderBy(desc(propertyExpenses.expenseDate));

  return c.json({ expenses });
});

// POST /api/properties/:id/expenses
propertiesRouter.post("/:id/expenses", async (c) => {
  const { id } = c.req.param();

  // Security: Get user from auth header
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Lookup user by clerkId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Security: Verify user owns property
  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.userId, user.id)))
    .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  const data = propertyExpenseInsertSchema.parse(await c.req.json());

  const expense = await db
    .insert(propertyExpenses)
    .values({
      ...data,
      propertyId: id,
      createdBy: user.id, // Use user.id (UUID), not clerkId
    })
    .returning();

  return c.json({ expense: expense[0] });
});
```

---

## Security Checklist

Following architect skill security guidelines:

- [ ] ✅ All expense endpoints require authentication (Authorization header with Clerk ID)
- [ ] ✅ Verify property ownership before any expense operation
- [ ] ✅ Filter expenses by property ownership (never expose other users' data)
- [ ] ✅ Set `createdBy` from authenticated user
- [ ] ✅ Validate `propertyId` in URL matches user's property
- [ ] ✅ Use parameterized queries (Drizzle handles this)
- [ ] ✅ Validate all input with Zod schemas
- [ ] ✅ Return 404 for non-existent resources (don't reveal existence)

---

## Field Naming Alignment

Following architect skill naming conventions:

- **Drizzle Schema**: camelCase (`expenseDate`, `isRecurring`)
- **Database Columns**: snake_case (`expense_date`, `is_recurring`) - automatic via Drizzle
- **Zod Schema**: camelCase (`expenseDate`, `isRecurring`) - matches Drizzle
- **TypeScript Types**: camelCase (inferred from Drizzle)
- **API JSON**: camelCase (matches frontend)

---

## Migration Considerations

1. **Foreign Key to propertyDocuments**:

- Check if `property_documents` table exists
- If not, make `documentId` nullable without FK constraint initially
- Add FK constraint later when documents table is created

2. **Foreign Key to users**:

- Check if `users` table has `id` field
- If using Clerk, may need to use `clerkId` instead
- Verify user reference pattern in existing code

3. **Indexes**:

- Add indexes for common query patterns
- `propertyId` + `expenseDate` for date range queries
- `category` for filtering by category

---

## Next Steps

1. Review existing schema patterns
2. Check if `propertyDocuments` table exists
3. Verify user reference pattern (`users.id` vs `clerkId`)
4. Implement Drizzle schema
5. Generate and review migration
6. Implement Zod schemas
7. Implement API routes with security
8. Create frontend hooks
9. Test end-to-end

---

## Notes

- Acquisition costs should have `isTaxDeductible: false` (capitalized, not deducted)
- Recurring expenses can be used to generate future expense projections
- `source` field enables tracking data provenance for integrations
- `externalId` allows linking to external systems (AppFolio, Plaid, etc.)
