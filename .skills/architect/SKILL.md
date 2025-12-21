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

1. **Schema Alignment**: Drizzle schemas, Zod schemas, and TypeScript types must be perfectly aligned
2. **Type Safety**: Always use Drizzle's type inference instead of manual type definitions
3. **Security First**: User data must be isolated and protected with proper authorization
4. **Consistency**: Follow established patterns across all layers of the application

## Quick Reference

- **Schema Alignment**: See [drizzle-zod-alignment.md](./drizzle-zod-alignment.md) for field mapping rules
- **Type Patterns**: See [type-inference-patterns.md](./type-inference-patterns.md) for type inference usage
- **Security**: See [security-guidelines.md](./security-guidelines.md) for user privacy and authorization patterns
- **Best Practices**: See [best-practices.md](./best-practices.md) for architectural patterns
- **Common Issues**: See [common-pitfalls.md](./common-pitfalls.md) for known problems and solutions
- **Feature Checklist**: See [full-stack-checklist.md](./full-stack-checklist.md) when adding new features

## Key Alignment Rules

### 1. Field Naming Convention

- **Drizzle**: Uses camelCase in code (`zipCode`) but maps to snake_case in DB (`zip_code`)
- **Zod**: Should use camelCase to match the code layer
- **API**: Accepts and returns camelCase

### 2. Type Inference

Always use Drizzle's type inference:

```typescript
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
export type UserProfile = InferSelectModel<typeof users>;
export type UserProfileInsert = InferInsertModel<typeof users>;
```

Never manually define types that duplicate Drizzle schemas.

### 3. Required vs Optional Fields

- Zod schemas for inserts must match Drizzle `.notNull()` constraints
- Optional fields in Zod must match nullable columns in Drizzle
- Timestamps (`createdAt`, `updatedAt`) are typically auto-generated and excluded from insert schemas

### 4. Validation Coverage

Every Drizzle schema must have a corresponding Zod schema for API validation.

### 5. User Data Privacy

All user-scoped resources must:

- Include `userId` or `clerkId` foreign key in schema
- Filter queries by authenticated user's ID in API routes
- Require authentication middleware (Clerk) on all user-scoped endpoints
- Never expose other users' data in responses
- Validate user ownership before mutations

## File Locations

- **Drizzle Schemas**: `packages/db/src/schema/index.ts`
- **Zod Schemas**: `packages/shared/src/validation/index.ts`
- **Type Exports**: `packages/db/src/types.ts`
- **API Routes**: `apps/api/src/routes/`
- **Shared Types**: `packages/shared/src/types/index.ts` (should use Drizzle inference)

## When to Use This Skill

Trigger this skill when:

- Creating new database tables or modifying existing ones
- Adding new API endpoints
- Implementing user-scoped features
- Fixing type mismatches or validation errors
- Reviewing code for security vulnerabilities
- Ensuring schema alignment across layers

## Current Known Issues

1. Type duplication in `packages/shared/src/types/index.ts` - should use Drizzle inference
2. Incomplete `userSchema` in validation - missing fields from Drizzle schema
3. Properties API doesn't filter by user - security issue
4. Clerk middleware commented out in API - needs authentication
5. Properties schema missing `userId` foreign key for user isolation
