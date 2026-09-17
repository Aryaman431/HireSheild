export function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!key) return false
  if (key.includes('your_clerk') || key === 'pk_test_your_clerk_publishable_key') {
    return false
  }
  // Check for dummy example.clerk.accounts.dev
  if (key.startsWith('pk_test_ZXhhbXBsZS')) {
    return false
  }
  try {
    const raw = key.replace(/^pk_(test|live)_/, '').replace(/\$$/, '')
    const decoded = typeof Buffer !== 'undefined'
      ? Buffer.from(raw, 'base64').toString('utf-8')
      : atob(raw)
    if (decoded.includes('example.clerk.accounts.dev') || decoded.includes('placeholder')) {
      return false
    }
  } catch {
    return false
  }
  return true
}
