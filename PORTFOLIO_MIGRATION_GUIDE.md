# Portfolio System Migration Guide

This document outlines the portfolio system implementation that enables multi-user collaboration for property management.

## Overview

The portfolio system allows multiple users to collaborate on managing properties together. A portfolio is a container that groups properties and users with different access levels.

## Schema Changes

### New Tables

1. **`portfolios`** - Portfolio container
   - `id` (UUID, primary key)
   - `name` (text, required) - Portfolio name (e.g., "Family Real Estate LLC")
   - `description` (text, optional) - Portfolio description
   - `created_by` (UUID, foreign key to users) - User who created the portfolio
   - `created_at`, `updated_at` (timestamps)

2. **`user_portfolios`** - Many-to-many relationship between users and portfolios
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to users) - User in the portfolio
   - `portfolio_id` (UUID, foreign key to portfolios) - Portfolio the user belongs to
   - `role` (enum: "owner", "admin", "member", "viewer") - User's role in the portfolio
   - `created_at`, `updated_at` (timestamps)
   - Unique constraint on `(user_id, portfolio_id)` - User can only have one role per portfolio

### Updated Tables

1. **`properties`** - Updated to reference portfolios
   - Changed: `user_id` → `portfolio_id` (required, foreign key to portfolios)
   - Changed: Added `added_by` (UUID, foreign key to users) - Tracks who added the property
   - Removed: Direct `user_id` reference (properties now belong to portfolios, not directly to users)

### New Enum

- **`portfolio_role`** - Enum for user roles in portfolios
  - `owner` - Portfolio creator/owner - full access including deletion
  - `admin` - Administrative access - can manage properties and members
  - `member` - Standard member - can view and edit properties
  - `viewer` - Read-only access - can view but not edit

## Relationships

```
users ←→ user_portfolios ←→ portfolios ←→ properties
  ↓                              ↓
  └─── created_by ──────────────┘
```

- **Users** can belong to multiple portfolios (via `user_portfolios`)
- **Portfolios** can have multiple users with different roles
- **Properties** belong to a single portfolio
- **Properties** track who added them (`added_by`)

## Migration Steps

### 1. Generate Migration

```bash
pnpm --filter @axori/db db:generate
```

This will create a new migration file that:

- Creates `portfolios` table
- Creates `user_portfolios` table
- Creates `portfolio_role` enum
- Adds `portfolio_id` and `added_by` columns to `properties`
- Removes `user_id` column from `properties` (if it exists)
- Adds foreign key constraints
- Adds unique constraints

### 2. Review Generated Migration

**⚠️ Important**: Before running the migration, review it carefully. The migration should:

- Create new tables first
- Create enum type
- Add new columns to `properties` table
- Handle data migration if needed (see Data Migration section below)

### 3. Run Migration

**Development:**

```bash
pnpm --filter @axori/db db:push
```

**Production:**

```bash
pnpm --filter @axori/db db:migrate
```

## Data Migration Strategy

If you have existing properties with `user_id`, you'll need to migrate the data:

### Option 1: Create Portfolios for Existing Users

For each existing user with properties:

1. Create a portfolio named after the user (e.g., "{User Name}'s Portfolio")
2. Add the user to the portfolio with `owner` role
3. Move all their properties to the new portfolio
4. Set `added_by` to the original `user_id`

### SQL Example:

```sql
-- Create portfolios for existing users
INSERT INTO portfolios (id, name, created_by, created_at, updated_at)
SELECT
  gen_random_uuid() as id,
  u.first_name || '''s Portfolio' as name,
  u.id as created_by,
  NOW() as created_at,
  NOW() as updated_at
FROM users u
WHERE EXISTS (SELECT 1 FROM properties p WHERE p.user_id = u.id);

-- Add users to their portfolios as owners
INSERT INTO user_portfolios (id, user_id, portfolio_id, role, created_at, updated_at)
SELECT
  gen_random_uuid() as id,
  p.created_by as user_id,
  p.id as portfolio_id,
  'owner' as role,
  NOW() as created_at,
  NOW() as updated_at
FROM portfolios p;

-- Migrate properties to portfolios
UPDATE properties
SET
  portfolio_id = (
    SELECT p.id
    FROM portfolios p
    WHERE p.created_by = properties.user_id
    LIMIT 1
  ),
  added_by = properties.user_id
WHERE user_id IS NOT NULL;

-- Remove user_id column (after confirming migration worked)
-- ALTER TABLE properties DROP COLUMN user_id;
```

### Option 2: Create a Single Portfolio for All

If you want to group all existing properties into one portfolio:

```sql
-- Create a single portfolio
INSERT INTO portfolios (id, name, description, created_by, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Legacy Properties',
  'Properties migrated from previous system',
  (SELECT id FROM users LIMIT 1),
  NOW(),
  NOW()
);

-- Add all users to the portfolio
INSERT INTO user_portfolios (id, user_id, portfolio_id, role, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  (SELECT id FROM portfolios WHERE name = 'Legacy Properties' LIMIT 1),
  'owner',
  NOW(),
  NOW()
FROM users u;

-- Update properties
UPDATE properties
SET
  portfolio_id = (SELECT id FROM portfolios WHERE name = 'Legacy Properties' LIMIT 1),
  added_by = properties.user_id
WHERE user_id IS NOT NULL;
```

## API Updates Required

### 1. Portfolio Endpoints

Create new API endpoints:

- `GET /api/portfolios` - List user's portfolios
- `GET /api/portfolios/:id` - Get portfolio details
- `POST /api/portfolios` - Create new portfolio
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio (owner only)
- `GET /api/portfolios/:id/users` - List users in portfolio
- `POST /api/portfolios/:id/users` - Add user to portfolio
- `PUT /api/portfolios/:id/users/:userId` - Update user role
- `DELETE /api/portfolios/:id/users/:userId` - Remove user from portfolio

### 2. Property Endpoints

Update property endpoints to use `portfolio_id`:

- Change `POST /api/properties` to require `portfolioId` instead of inferring from user
- Update authorization to check user's role in the portfolio
- Filter properties by portfolio in `GET /api/properties`

### 3. Authorization Logic

Implement role-based access control:

- **Owner**: Full access (create, read, update, delete portfolio, manage members)
- **Admin**: Can manage properties and members (except remove owner)
- **Member**: Can create, read, update properties (cannot delete portfolio/members)
- **Viewer**: Read-only access

## Frontend Updates Required

### 1. Portfolio Selection

- Add portfolio selector/switcher in navigation
- Store current portfolio in context/state
- Update all property queries to filter by current portfolio

### 2. Property Forms

- Update `AddPropertyWizard` to use `portfolioId` instead of `userId`
- Use `mapboxSuggestionToPropertyInsert()` with `portfolioId` and `addedBy`

### 3. User Management

- Add UI for managing portfolio members
- Show user roles in portfolio
- Allow owners/admins to invite users and assign roles

## Type Updates

All types have been updated:

- `Portfolio`, `PortfolioInsert` - Available from `@axori/db`
- `UserPortfolio`, `UserPortfolioInsert` - Available from `@axori/db`
- `Property`, `PropertyInsert` - Updated to use `portfolioId` and `addedBy`

## Validation Updates

All validation schemas have been updated:

- `portfolioInsertSchema`, `portfolioSelectSchema`, `portfolioUpdateSchema`
- `userPortfolioInsertSchema`, `userPortfolioSelectSchema`, `userPortfolioUpdateSchema`
- `propertyInsertSchema`, `propertySelectSchema`, `propertyUpdateSchema` - Updated for portfolio structure

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Existing data is migrated correctly
- [ ] New portfolios can be created
- [ ] Users can be added to portfolios
- [ ] Properties can be created with portfolio reference
- [ ] Authorization works for different roles
- [ ] Users can only see properties in portfolios they belong to
- [ ] Role-based permissions are enforced

## Breaking Changes

⚠️ **This is a breaking change** that requires:

1. Database migration
2. API updates
3. Frontend updates
4. Data migration for existing properties

All existing code referencing `properties.userId` needs to be updated to use `properties.portfolioId` and `properties.addedBy`.

## Benefits

✅ **Multi-user collaboration** - Multiple users can manage the same properties  
✅ **Role-based access control** - Fine-grained permissions per portfolio  
✅ **Better organization** - Properties grouped logically in portfolios  
✅ **Scalability** - Easy to add more users and properties  
✅ **Audit trail** - Track who added each property (`added_by`)
