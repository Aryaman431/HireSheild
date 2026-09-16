export function getBrowserApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

export function getServerApiUrl() {
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}