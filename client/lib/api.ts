/**
 * API Client Configuration
 * 
 * In development: Uses relative URLs (/api/...) which proxy to the local server
 * In production: Uses VITE_API_URL environment variable to connect to the backend
 */

// Get the API base URL from environment variable (for production)
// Falls back to empty string for relative URLs in development
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Constructs the full API URL
 * @param path - API path starting with /api/...
 * @returns Full URL in production, relative path in development
 */
export function getApiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Enhanced fetch wrapper that automatically uses the correct API URL
 * and includes common options like credentials
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; response: Response }> {
  const url = getApiUrl(path);
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete (defaultOptions.headers as Record<string, string>)['Content-Type'];
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // Try to parse JSON response
    let data: T | null = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorMessage = (data as { message?: string } | null)?.message || response.statusText;
      return { data: null, error: errorMessage, response };
    }

    return { data, error: null, response };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Network error';
    return { data: null, error, response: new Response(null, { status: 0 }) };
  }
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Create headers with auth token
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
