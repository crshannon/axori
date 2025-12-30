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
    const error = await response.json().catch(() => ({
      error: response.statusText,
    }))
    throw new Error(error.error || `API request failed: ${response.statusText}`)
  }

  return response.json()
}

export { API_BASE_URL, apiFetch }

