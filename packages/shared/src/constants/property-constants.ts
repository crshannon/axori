/**
 * Property-related constants
 * 
 * Centralized constants for property types, currency options, and other
 * property-related select options used across the application.
 */

/**
 * Property type option for select dropdowns
 */
export interface PropertyTypeOption {
  value: string
  label: string
}

/**
 * Available property types for selection
 * These values match the database schema format (kebab-case)
 */
export const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = [
  { value: 'single-family', label: 'Single Family Residential' },
  { value: 'multi-family', label: 'Multi-Family Duplex' },
  { value: 'commercial-retail', label: 'Commercial - Retail' },
  { value: 'industrial-flex', label: 'Industrial Flex' },
]

/**
 * Property type value to display label mapping
 * Maps kebab-case values (used in forms/API) to display labels
 */
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  'single-family': 'Single Family Residential',
  'multi-family': 'Multi-Family Duplex',
  'commercial-retail': 'Commercial - Retail',
  'industrial-flex': 'Industrial Flex',
}

/**
 * Property type display label to value mapping
 * Maps display labels to kebab-case values (for reverse lookup)
 */
export const PROPERTY_TYPE_VALUES: Record<string, string> = {
  'Single Family Residential': 'single-family',
  'Multi-Family Duplex': 'multi-family',
  'Commercial - Retail': 'commercial-retail',
  'Industrial Flex': 'industrial-flex',
  // Also support database format (with spaces)
  'Single Family': 'single-family',
  'Multi-Family': 'multi-family',
}

/**
 * Currency option for select dropdowns
 */
export interface CurrencyOption {
  value: string
  label: string
}

/**
 * Available currency options for property settings
 */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: 'Portfolio Default (USD)', label: 'Portfolio Default (USD)' },
  { value: 'Local (CAD)', label: 'Local (CAD)' },
  { value: 'Local (EUR)', label: 'Local (EUR)' },
]

/**
 * Format property type value to display label
 * 
 * @param value - Property type value (kebab-case or display format)
 * @returns Display label for the property type
 */
export function formatPropertyType(value: string | null | undefined): string {
  if (!value) return '—'
  
  // If already a display label, return as-is
  if (PROPERTY_TYPE_LABELS[value]) {
    return PROPERTY_TYPE_LABELS[value]
  }
  
  // If it's a display label, try reverse lookup
  if (PROPERTY_TYPE_VALUES[value]) {
    return PROPERTY_TYPE_LABELS[PROPERTY_TYPE_VALUES[value]]
  }
  
  // Fallback: try to convert from database format (e.g., "Single Family" -> "Single Family Residential")
  const normalized = value.toLowerCase().replace(/\s+/g, '-')
  return PROPERTY_TYPE_LABELS[normalized] || value
}

/**
 * Convert property type display label to value (kebab-case)
 * 
 * @param label - Property type display label
 * @returns Kebab-case value for forms/API
 */
export function propertyTypeLabelToValue(label: string | null | undefined): string {
  if (!label) return 'single-family' // Default
  
  // Direct lookup
  if (PROPERTY_TYPE_VALUES[label]) {
    return PROPERTY_TYPE_VALUES[label]
  }
  
  // Try normalized lookup
  const normalized = label.toLowerCase().replace(/\s+/g, '-')
  return PROPERTY_TYPE_LABELS[normalized] ? normalized : 'single-family'
}

/**
 * Convert property type value to display label for database storage
 * Maps kebab-case form values to database format (e.g., "Single Family")
 * 
 * @param value - Property type value (kebab-case)
 * @returns Database format label
 */
export function propertyTypeValueToDatabaseFormat(value: string | null | undefined): string {
  if (!value) return 'Single Family' // Default
  
  const label = PROPERTY_TYPE_LABELS[value]
  if (!label) return value
  
  // Convert display label to database format (remove "Residential", "Duplex", etc.)
  const dbFormatMap: Record<string, string> = {
    'Single Family Residential': 'Single Family',
    'Multi-Family Duplex': 'Multi-Family',
    'Commercial - Retail': 'Commercial - Retail',
    'Industrial Flex': 'Industrial Flex',
  }
  
  return dbFormatMap[label] || label
}
