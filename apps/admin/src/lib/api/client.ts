/**
 * Centralized API client for Forge admin
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Get authorization header for API requests
 */
export function getAuthHeaders(clerkId: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${clerkId}`,
  };
}

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { clerkId?: string } = {}
): Promise<T> {
  const { clerkId, ...fetchOptions } = options;
  const headers = clerkId
    ? { ...getAuthHeaders(clerkId), ...fetchOptions.headers }
    : fetchOptions.headers;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: response.statusText,
    }));
    const errorMessage = errorData.details
      ? `${errorData.error || "Validation failed"}: ${JSON.stringify(errorData.details)}`
      : errorData.error || `API request failed: ${response.statusText}`;
    const error = new Error(errorMessage);
    if (errorData.details) {
      (error as { details?: unknown }).details = errorData.details;
    }
    throw error;
  }

  return response.json();
}

/**
 * API client with convenience methods
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),
}

export { API_BASE_URL, apiFetch };
