/**
 * Centralized API client configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Get authorization header for API requests
 * @param clerkId - Clerk user ID
 */
export function getAuthHeaders(clerkId: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${clerkId}`,
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { clerkId?: string } = {},
): Promise<T> {
  const { clerkId, ...fetchOptions } = options
  const headers = clerkId
    ? { ...getAuthHeaders(clerkId), ...fetchOptions.headers }
    : fetchOptions.headers

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: response.statusText,
    }))
    // Include validation details if available
    const errorMessage = errorData.details
      ? `${errorData.error || 'Validation failed'}: ${JSON.stringify(errorData.details)}`
      : errorData.error || `API request failed: ${response.statusText}`
    const error = new Error(errorMessage)
    // Attach details for programmatic access
    if (errorData.details) {
      ;(error as { details?: unknown }).details = errorData.details
    }
    throw error
  }

  return response.json()
}

export { API_BASE_URL, apiFetch }
