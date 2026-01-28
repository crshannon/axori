# Run Migrations

Runs database migrations using the proper Drizzle migration workflow.

## Usage

```
/run-migrations
```

Or with options:
```
/run-migrations generate=true
/run-migrations check-only=true
```

## Behavior

1. **Checks for pending migrations** - Verifies if there are unapplied migration files
2. **Generates migrations** (optional) - Runs `drizzle-kit generate` if schema changes exist
3. **Applies migrations** - Runs `migrate.ts` to apply all pending migrations
4. **Verifies database state** - Runs verification checks after migrations
5. **Reports status** - Shows which migrations were applied and any warnings

## Inputs

- **generate** (optional, default: `false`) - Generate new migrations from schema changes before applying
- **check-only** (optional, default: `false`) - Only check migration status without applying
- **skip-verify** (optional, default: `false`) - Skip database state verification after migrations

## Migration Workflow

### Standard Workflow

1. **Update schema** in `packages/db/src/schema/index.ts`
2. **Generate migrations**: `/run-migrations generate=true`
3. **Review generated SQL files** in `packages/db/drizzle/`
4. **Apply migrations**: `/run-migrations`

### Quick Apply (if migrations already generated)

```
/run-migrations
```

This will:
- Check for pending migrations
- Apply any unapplied migration files
- Verify database state

## Examples

**Check migration status only:**
```
/run-migrations check-only=true
```

**Generate and apply migrations:**
```
/run-migrations generate=true
```

**Apply existing migrations:**
```
/run-migrations
```

**Apply without verification:**
```
/run-migrations skip-verify=true
```

## Implementation

Runs: `.cursor/scripts/run-migrations.ts`

Which executes:
- `pnpm db:generate` (if `generate=true`)
- `npx tsx packages/db/migrate.ts` (to apply migrations)

Requires:
- `DATABASE_URL` in `.env.local`
- Database connection access
- Drizzle schema files in `packages/db/src/schema/`

## Output

Returns:
- List of migration files found
- Number of applied migrations
- Newly applied migrations count
- Verification check results
- Any warnings or errors

## Migration Files

Migrations are stored in:
- **SQL files**: `packages/db/drizzle/*.sql`
- **Metadata**: `packages/db/drizzle/meta/_journal.json`
- **Tracking**: `drizzle.__drizzle_migrations` table in database

## Notes

- Migrations are tracked in the `drizzle.__drizzle_migrations` table
- The script uses `migrate.ts` which includes verification checks
- Custom TypeScript migration files in `packages/db/src/migrations/` are for one-off operations only
- Always review generated SQL files before applying in production
