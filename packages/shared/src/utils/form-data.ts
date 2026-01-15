/**
 * Utility functions for transforming form data before submission
 */

export type FieldConverter = 'number' | 'currency' | 'date' | 'boolean' | 'string'

export interface FormDataTransformOptions {
  /** Fields that should be converted to numbers */
  numericFields?: string[]
  /** Fields that should be converted to currency (number with 2 decimal places) */
  currencyFields?: string[]
  /** Fields that should be converted to dates */
  dateFields?: string[]
  /** Fields that should be converted to booleans */
  booleanFields?: string[]
  /** Whether to exclude empty strings (default: true) */
  excludeEmpty?: boolean
  /** Custom field converters: field name -> converter type */
  customConverters?: Record<string, FieldConverter>
}

/**
 * Transforms form data by:
 * - Filtering out empty values (optional)
 * - Converting fields to appropriate types (number, currency, date, boolean)
 *
 * @example
 * ```ts
 * const transformed = transformFormData(
 *   { price: '100.50', date: '2024-01-01', name: '' },
 *   { numericFields: ['price'], dateFields: ['date'], excludeEmpty: true }
 * )
 * // Result: { price: 100.50, date: '2024-01-01' }
 * ```
 */
export function transformFormData<T extends Record<string, unknown>>(
  data: T,
  options: FormDataTransformOptions = {},
): Record<string, unknown> {
  const {
    numericFields = [],
    currencyFields = [],
    dateFields = [],
    booleanFields = [],
    excludeEmpty = true,
    customConverters = {},
  } = options

  // Build a map of field -> converter type
  const fieldConverters = new Map<string, FieldConverter>()

  numericFields.forEach((field) => fieldConverters.set(field, 'number'))
  currencyFields.forEach((field) => fieldConverters.set(field, 'currency'))
  dateFields.forEach((field) => fieldConverters.set(field, 'date'))
  booleanFields.forEach((field) => fieldConverters.set(field, 'boolean'))

  // Custom converters override defaults
  Object.entries(customConverters).forEach(([field, converter]) => {
    fieldConverters.set(field, converter)
  })

  return Object.entries(data)
    .filter(([_, value]) => {
      if (!excludeEmpty) return true
      // Filter out empty strings, null, undefined
      return value !== '' && value !== null && value !== undefined
    })
    .reduce((acc, [key, value]) => {
      const converter = fieldConverters.get(key)

      switch (converter) {
        case 'number':
          acc[key] = Number(value)
          break
        case 'currency':
          // Currency: convert to number, preserving decimals
          acc[key] = Number(value)
          break
        case 'date':
          // Date: keep as string (ISO format expected)
          acc[key] = value
          break
        case 'boolean':
          // Boolean: convert string 'true'/'false' or truthy/falsy
          acc[key] =
            typeof value === 'string'
              ? value.toLowerCase() === 'true'
              : Boolean(value)
          break
        default:
          // String or no conversion needed
          acc[key] = value
      }

      return acc
    }, {} as Record<string, unknown>)
}

/**
 * Formats a number as currency string (for display)
 * Enhanced version with more options than the base formatCurrency
 *
 * @example
 * ```ts
 * formatCurrencyValue(1234.56) // "$1,234.56"
 * formatCurrencyValue(1234.56, { locale: 'en-US', currency: 'USD' })
 * ```
 */
export function formatCurrencyValue(
  value: number | string | null | undefined,
  options: {
    locale?: string
    currency?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {},
): string {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? Number(value) : value
  if (isNaN(num)) return ''

  const {
    locale = 'en-US',
    currency = 'USD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num)
}

/**
 * Parses a currency string to a number
 *
 * @example
 * ```ts
 * parseCurrency("$1,234.56") // 1234.56
 * parseCurrency("1,234.56") // 1234.56
 * ```
 */
export function parseCurrency(value: string | null | undefined): number | null {
  if (!value || value === '') return null
  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, '')
  const parsed = Number(cleaned)
  return isNaN(parsed) ? null : parsed
}

