/**
 * Normalizes an API base URL:
 * 1. Trims whitespace
 * 2. Removes trailing slashes
 * 3. Strips duplicated '/api/v1' or '/api' suffixes so callers appending '/api/v1/...'
 *    never construct invalid paths like '/api/v1/api/v1/...'.
 */
export function sanitizeApiUrl(rawUrl?: string | null): string {
  if (!rawUrl) return ''
  let url = rawUrl.trim()
  // Remove trailing slashes
  url = url.replace(/\/+$/, '')
  // Strip duplicate /api/v1 or /api
  if (url.endsWith('/api/v1')) {
    url = url.slice(0, -'/api/v1'.length)
  } else if (url.endsWith('/api')) {
    url = url.slice(0, -'/api'.length)
  }
  return url.replace(/\/+$/, '')
}

export function getBrowserApiUrl(): string {
  const configured = sanitizeApiUrl(process.env.NEXT_PUBLIC_API_URL)
  if (configured) {
    return configured
  }

  // In development mode, safely fall back to localhost:8000
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000'
  }

  // In production, do NOT silently fall back to localhost:8000.
  // Returning empty string allows callers to detect missing NEXT_PUBLIC_API_URL
  // rather than making impossible browser requests to localhost:8000.
  return ''
}

export function getServerApiUrl(): string {
  const serverConfigured = sanitizeApiUrl(process.env.INTERNAL_API_URL)
  if (serverConfigured) {
    return serverConfigured
  }

  const publicConfigured = sanitizeApiUrl(process.env.NEXT_PUBLIC_API_URL)
  if (publicConfigured) {
    return publicConfigured
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000'
  }

  return ''
}