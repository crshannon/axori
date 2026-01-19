# Address Schema Alignment with Mapbox

This document outlines the changes made to align the database schema with Mapbox Geocoding API responses for property addresses.

## Summary of Changes

### 1. Database Schema Updates (`packages/db/src/schema/index.ts`)

**Added fields to `properties` table:**

- `userId` (uuid, foreign key to users) - **Required** - Associates properties with users
- `latitude` (numeric, precision 10, scale 7) - **Optional** - From Mapbox coordinates
- `longitude` (numeric, precision 10, scale 7) - **Optional** - From Mapbox coordinates
- `mapboxPlaceId` (text) - **Optional** - Mapbox place ID for reference
- `fullAddress` (text) - **Optional** - Full formatted address from Mapbox

**Existing fields** (already aligned with Mapbox):

- `address` - Street address (e.g., "123 Main St")
- `city` - City name
- `state` - 2-letter state code (e.g., "TX")
- `zipCode` - ZIP code (5 or 9 digits)
- `propertyType` - Property type

**Relations:**

- Added `propertiesRelations` to establish user ↔ property relationship

### 2. Type Definitions (`packages/db/src/types.ts`)

**Added:**

- `Property` - Inferred from Drizzle schema (for read operations)
- `PropertyInsert` - Inferred from Drizzle schema (for insert operations)

These types are automatically generated from the schema using `InferSelectModel` and `InferInsertModel`.

### 3. Shared Types (`packages/shared/src/types/index.ts`)

**Updated:**

- Removed manual `Property` type definition
- Now re-exports `Property` and `PropertyInsert` from `@axori/db`

This ensures a single source of truth (the Drizzle schema).

### 4. Validation Schemas (`packages/shared/src/validation/index.ts`)

**Updated `propertyInsertSchema`:**

- Added `userId` field (required, from auth context)
- Added optional Mapbox fields: `latitude`, `longitude`, `mapboxPlaceId`, `fullAddress`
- Proper validation for state (2 characters) and ZIP code (5 or 9 digits)

**Added:**

- `propertySelectSchema` - Includes all fields including auto-generated ones
- `propertyUpdateSchema` - All fields optional except ID

**Deprecated:**

- `propertySchema` - Use `propertyInsertSchema` instead

### 5. Mapbox Integration Types (`packages/shared/src/integrations/mapbox.ts`)

**New file with:**

- `MapboxContext` - Mapbox context item type
- `MapboxFeatureProperties` - Mapbox feature properties
- `MapboxFeature` - Complete Mapbox feature type
- `MapboxGeocodingResponse` - Complete API response type
- `MapboxAddressSuggestion` - Parsed address aligned with our schema
- `parseMapboxFeature()` - Utility to parse Mapbox features
- `mapboxSuggestionToPropertyInsert()` - Convert to database format

**Exports:**

- All types and utilities are exported through `packages/shared/src/integrations/index.ts`
- Available via `@axori/shared` package

### 6. Component Updates (`apps/web/src/components/property-hub/add-property-wizard/steps/Step1Address.tsx`)

**Updated:**

- Removed local type definitions
- Now uses shared Mapbox types from `@axori/shared`
- Uses `parseMapboxFeature()` utility for parsing
- Component now properly extracts coordinates and Mapbox place ID

## Database Migration Required

⚠️ **You need to generate and run a migration** to add the new fields:

```bash
pnpm --filter @axori/db db:generate
pnpm --filter @axori/db db:push
```

Or for production:

```bash
pnpm --filter @axori/db db:migrate
```

The migration will add:

- `user_id` column (NOT NULL, foreign key)
- `latitude` column (nullable)
- `longitude` column (nullable)
- `mapbox_place_id` column (nullable)
- `full_address` column (nullable)

## Next Steps

1. **Add @axori/shared dependency** to `apps/web/package.json` if importing directly:

   ```json
   {
     "dependencies": {
       "@axori/shared": "workspace:*"
     }
   }
   ```

2. **Run database migration** to add new fields

3. **Update form data structure** in `PropertyFormData` to optionally include:
   - `latitude` and `longitude` for coordinates
   - `mapboxPlaceId` for reference
   - `fullAddress` for display

4. **Update API routes** to handle new fields when saving properties

## Type Alignment

All types now follow the architectural patterns:

✅ **Drizzle schema** → Single source of truth  
✅ **Type inference** → No manual type definitions  
✅ **Zod validation** → Aligned with schema  
✅ **Mapbox types** → Properly typed API responses  
✅ **Shared utilities** → Reusable parsing functions

## Benefits

1. **Type Safety** - Full type safety from Mapbox API → Database
2. **Single Source of Truth** - Schema drives types, not manual definitions
3. **Coordinate Storage** - Can now map properties on maps
4. **Mapbox Integration** - Can reference Mapbox place IDs for future lookups
5. **Validation** - Proper Zod schemas aligned with database constraints
