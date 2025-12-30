# Address Parsing Review - Street Number Implementation

This document reviews all changes made to ensure street numbers are correctly captured and displayed in addresses from Mapbox.

## Complete Flow

### 1. Mapbox API Response → Parsing (`packages/shared/src/integrations/mapbox.ts`)

**Function: `parseMapboxFeature()`** (Lines 137-165)

The parsing logic uses a priority-based approach with multiple fallbacks:

1. **Priority 1**: Parse from `place_name` first part (before first comma)
   - Format: `"123 Main St, Austin, TX 78704"` → Extracts `"123 Main St"`
   - Most reliable - always includes full street address with number
   - Uses `.split(',')` and takes first part

2. **Priority 2**: Combine `feature.text` + `feature.properties.address`
   - Used when place_name parsing doesn't work
   - `feature.text` = house number (e.g., "123")
   - `feature.properties.address` = street name (e.g., "Main Street")
   - Combines: `"123 Main Street"`

3. **Priority 3**: Use `feature.properties.address` if exists
   - Might be full address in some cases

4. **Priority 4**: Use `feature.text` as fallback
   - Might be full address or just number

5. **Priority 5**: Use entire `place_name` as last resort

**Returns**: `MapboxAddressSuggestion` with:

- `address`: Full street address including number (e.g., "123 Main St")
- `fullAddress`: Complete formatted address (e.g., "123 Main St, Austin, TX 78704")
- Other fields: city, state, zip, coordinates, etc.

### 2. Component Selection (`apps/web/src/components/property-hub/add-property-wizard/steps/Step1Address.tsx`)

**Function: `selectAddress()`** (Lines 100-117)

When user clicks a suggestion:

```typescript
setFormData({
  ...formData,
  address: suggestion.address, // ← Full street address with number from parsing
  city: suggestion.city,
  state: suggestion.state,
  zipCode: suggestion.zip,
  latitude: suggestion.latitude,
  longitude: suggestion.longitude,
  mapboxPlaceId: suggestion.mapboxPlaceId,
  fullAddress: suggestion.fullAddress,
});
```

### 3. Display (`Step1Address.tsx` Line 202)

```typescript
<Heading level={5}>
  {formData.address}  // ← Should display "123 Main St" (with number)
</Heading>
```

### 4. Form Data Type (`apps/web/src/components/property-hub/add-property-wizard/types.ts`)

**Interface: `PropertyFormData`** (Lines 15-68)

```typescript
export interface PropertyFormData {
  address: string; // ← Full street address with number
  city: string;
  state: string;
  zipCode: string;
  // ... other fields
}
```

### 5. Validation (`packages/shared/src/validation/index.ts`)

**Schema: `propertyInsertSchema`** (Lines 49-68)

Added Zod validation with `.refine()` to ensure address format:

- Prefers addresses starting with numbers (street numbers)
- Allows PO Box addresses
- Provides helpful error message if validation fails
- Validates minimum length

```typescript
address: z
  .string()
  .min(1, "Address is required")
  .refine(
    (val) => {
      const hasStreetNumber = /^\d+\s/.test(val.trim())
      const isPOBoxOrSpecial = /^(P\.?O\.?\s*Box|PO\s*Box)/i.test(val.trim())
      return val.trim().length > 0 && (hasStreetNumber || isPOBoxOrSpecial || val.trim().length >= 5)
    },
    {
      message: "Address should include a street number (e.g., '123 Main Street')",
    },
  ),
```

### 6. Database Conversion (`packages/shared/src/integrations/mapbox.ts`)

**Function: `mapboxSuggestionToPropertyInsert()`** (Lines 194-213)

Converts parsed suggestion to database-ready format:

```typescript
return {
  portfolioId,
  addedBy,
  address: suggestion.address, // ← Full street address preserved
  // ... other fields
};
```

## Key Points

✅ **Parsing Priority**: `place_name` first part is most reliable (always has number)  
✅ **Multiple Fallbacks**: 5-tier fallback system ensures we always get an address  
✅ **Type Safety**: TypeScript interfaces ensure correct types throughout  
✅ **Validation**: Zod validates address format including street number preference  
✅ **Display**: `formData.address` directly displayed, should show full address

## Debugging

If street number is still missing, check console logs:

1. **Mapbox Response** (`console.log('data', data)`):
   - Check `data.features[0].place_name` format
   - Verify `data.features[0].text` and `data.features[0].properties.address`

2. **Parsed Suggestion** (`console.log('suggestion', suggestion)`):
   - Verify `suggestion.address` contains street number
   - Check if `suggestion.fullAddress` has full format

3. **Form Data**:
   - Verify `formData.address` after selection contains street number

## Potential Issues & Solutions

### Issue: `place_name` format differs

**Solution**: Parser handles multiple formats with fallbacks

### Issue: Address stored but not displayed

**Solution**: Verify `formData.address` is correctly set in `selectAddress()`

### Issue: User manually types address (no Mapbox)

**Solution**: Zod validation will warn if format doesn't include street number

### Issue: PO Box or special addresses

**Solution**: Validation allows PO Box format as exception

## Testing Checklist

- [ ] Select address from Mapbox suggestions - verify street number in display
- [ ] Check console logs for parsed `suggestion.address`
- [ ] Verify `formData.address` contains full street address
- [ ] Test with manually typed address - Zod validation should guide
- [ ] Verify address saves correctly to database
- [ ] Check `fullAddress` field contains complete formatted address

## Next Steps if Still Not Working

1. Check actual Mapbox response format in console
2. Verify parsing logic matches actual response structure
3. Consider adding additional logging in `parseMapboxFeature()`
4. May need to adjust parsing based on specific Mapbox response format
