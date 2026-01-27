export type FieldErrors = Record<string, string>

/**
 * Interface for Zod-like errors with issues array.
 * This allows compatibility with different Zod versions.
 */
interface ZodLikeError {
  issues: Array<{
    path: Array<string | number>
    message: string
  }>
}

/**
 * Converts Zod validation errors to a field-keyed error object.
 * Compatible with the existing drawer error state pattern: Record<string, string>
 *
 * @param error - ZodError from schema.safeParse()
 * @returns Object with field names as keys and error messages as values
 *
 * @example
 * const result = schema.safeParse(data)
 * if (!result.success) {
 *   const errors = formatZodErrors(result.error)
 *   // { amount: "Amount must be greater than 0", vendor: "Vendor is required" }
 * }
 */
export function formatZodErrors(error: ZodLikeError): FieldErrors {
  const fieldErrors: FieldErrors = {}

  for (const issue of error.issues) {
    const path = issue.path.join('.')
    // Only keep the first error per field for cleaner UX
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message
    }
  }

  return fieldErrors
}

/**
 * Extracts the first error message from Zod errors.
 * Useful for form-level error display.
 *
 * @param error - ZodError from schema.safeParse()
 * @returns First error message or generic fallback
 */
export function getFirstError(error: ZodLikeError): string {
  return error.issues[0]?.message || 'Validation error'
}

/**
 * Checks if a specific field has an error.
 *
 * @param errors - Field errors object
 * @param field - Field name to check
 */
export function hasFieldError(errors: FieldErrors, field: string): boolean {
  return field in errors
}

/**
 * Clears a specific field error from the errors object.
 * Returns a new object without the specified field.
 *
 * @param errors - Current field errors object
 * @param field - Field name to clear
 */
export function clearFieldError(
  errors: FieldErrors,
  field: string,
): FieldErrors {
  const newErrors = { ...errors }
  delete newErrors[field]
  return newErrors
}
