---
name: Architect
description: Ensures architectural consistency across Drizzle ORM schemas, Zod validation schemas, TypeScript types, API routes, and enforces security best practices for user data privacy and authorization.
---

# Architect Skill

This skill ensures full-stack architectural consistency and security across the Axori application. Use this skill when:

- Adding or modifying database schemas
- Creating or updating Zod validation schemas
- Defining TypeScript types
- Building API routes
- Implementing user-scoped features
- Ensuring data privacy and security

## Core Principles

1. **Single Source of Truth**: Drizzle schema is the single source of truth - all Zod schemas are generated from it using `drizzle-zod`
2. **Schema Alignment**: Drizzle schemas, Zod schemas, and TypeScript types must be perfectly aligned
3. **Type Safety**: Always use Drizzle/Zod type inference instead of manual type definitions
4. **Security First**: User data must be isolated and protected with proper authorization
5. **Consistency**: Follow established patterns across all layers of the application

## Quick Reference

- **Drizzle-Zod Pattern**: See [drizzle-zod-alignment.md](./drizzle-zod-alignment.md) for the complete workflow using `drizzle-zod`
- **Schema Alignment**: See [drizzle-zod-alignment.md](./drizzle-zod-alignment.md) for field mapping rules and type conversions
- **Type Patterns**: See [type-inference-patterns.md](./type-inference-patterns.md) for type inference usage
- **Security**: See [security-guidelines.md](./security-guidelines.md) for user privacy and authorization patterns
- **Best Practices**: See [best-practices.md](./best-practices.md) for architectural patterns
- **Common Issues**: See [common-pitfalls.md](./common-pitfalls.md) for known problems and solutions
- **Feature Checklist**: See [full-stack-checklist.md](./full-stack-checklist.md) when adding new features
- **Planning Workflow**: See [planning-workflow.md](./planning-workflow.md) for creating and executing architectural plans

## Key Alignment Rules

### 1. Field Naming Convention

- **Drizzle**: Uses camelCase in code (`zipCode`) but maps to snake_case in DB (`zip_code`)
- **Zod**: Should use camelCase to match the code layer
- **API**: Accepts and returns camelCase

### 2. Type Inference

Always use Drizzle/Zod type inference:

```typescript
// Drizzle-inferred types (for database operations)
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
export type UserProfile = InferSelectModel<typeof users>;
export type UserProfileInsert = InferInsertModel<typeof users>;

// Zod-inferred types (for API/frontend use)
import type { z } from "zod";
import { userInsertApiSchema } from "../validation";
export type UserInsertApi = z.infer<typeof userInsertApiSchema>;
```

Never manually define types that duplicate Drizzle schemas or Zod schemas.

### 3. Schema Generation Workflow

1. **Define Drizzle Schema** - Use `pgEnum()` for enums, proper types for all fields
2. **Generate Base Schemas** - Use `createInsertSchema()` and `createSelectSchema()` from `drizzle-zod`
3. **Create Enhanced Schemas** - Extend base schemas with API-specific validation
4. **Export Types** - Export Zod-inferred types from enhanced schemas
5. **Use in API Routes** - Validate with enhanced schemas, convert API format to DB format
6. **Use in Frontend Hooks** - Use Zod-inferred types for type safety

### 4. Required vs Optional Fields

- Base schemas automatically match Drizzle `.notNull()` constraints
- Optional fields in base schemas automatically match nullable columns in Drizzle
- Timestamps (`createdAt`, `updatedAt`) are automatically excluded from insert schemas
- Enhanced schemas can add additional validation rules

### 5. Validation Coverage

Every Drizzle schema must have:

- Base Zod schemas (auto-generated using `drizzle-zod`)
- Enhanced Zod schemas (for API-specific validation)
- Zod-inferred types (exported for frontend use)

### 5. User Data Privacy

All user-scoped resources must:

- Include `userId` or `clerkId` foreign key in schema
- Filter queries by authenticated user's ID in API routes
- Require authentication middleware (Clerk) on all user-scoped endpoints
- Never expose other users' data in responses
- Validate user ownership before mutations

## File Locations

- **Drizzle Schemas**: `packages/db/src/schema/index.ts`
- **Base Zod Schemas**: `packages/shared/src/validation/base/` (auto-generated)
- **Enhanced Zod Schemas**: `packages/shared/src/validation/enhanced/` (API-specific)
- **Zod Schema Exports**: `packages/shared/src/validation/index.ts`
- **Drizzle Type Exports**: `packages/db/src/types.ts` (Drizzle-inferred types)
- **Zod Type Exports**: `packages/shared/src/types/index.ts` (Zod-inferred types)
- **API Routes**: `apps/api/src/routes/`
- **Frontend Hooks**: `apps/web/src/hooks/api/`

## When to Use This Skill

Trigger this skill when:

- Creating new database tables or modifying existing ones
- Adding new API endpoints
- Implementing user-scoped features
- Fixing type mismatches or validation errors
- Reviewing code for security vulnerabilities
- Ensuring schema alignment across layers
- Planning major architectural changes or migrations

## Documentation Requirements

**All architectural changes must be documented:**

1. **Create a Plan** - Before starting any major change:
   - Create a versioned folder in `docs/architecture/plans/` (e.g., `003-feature-name/`)
   - Create `SUMMARY.md` - Quick read (1-2 pages) describing what we aim to accomplish
   - Create `EXECUTION.md` - Detailed step-by-step implementation guide

2. **During Execution**:
   - Update `EXECUTION.md` as you work through phases
   - Document file changes and decisions
   - Track issues and deviations

3. **After Completion**:
   - Create `COMPLETION.md` - Summary of what was accomplished
   - Move plan folder to `docs/architecture/completed/`
   - Update status in all plan documents

See [planning-workflow.md](./planning-workflow.md) for detailed templates and workflow.

## Migration Status

✅ **Drizzle-Zod Migration Complete** - All schemas now use `drizzle-zod` as the single source of truth.

See `docs/architecture/completed/drizzle-zod-migration-complete.md` for details.

## Current Known Issues

1. Some deprecated schemas kept for backward compatibility (documented in `validation/index.ts`)
2. Pre-existing type errors in `data-transformers.ts` (unrelated to migration)
