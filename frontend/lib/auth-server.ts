import { isClerkConfigured } from './auth-config'

export async function getAuth() {
  if (!isClerkConfigured()) {
    return {
      userId: null,
      sessionId: null,
      getToken: async () => 'demo_token',
    }
  }

  try {
    const { auth } = await import('@clerk/nextjs/server')
    return await auth()
  } catch {
    return {
      userId: null,
      sessionId: null,
      getToken: async () => 'demo_token',
    }
  }
}

export async function getCurrentUser() {
  if (!isClerkConfigured()) {
    return {
      id: 'demo_user',
      primaryEmailAddress: { emailAddress: 'auditor@hireshield.demo' },
      firstName: 'Demo',
      lastName: 'Auditor',
      fullName: 'Demo Auditor',
    }
  }

  try {
    const { currentUser } = await import('@clerk/nextjs/server')
    return await currentUser()
  } catch {
    return {
      id: 'demo_user',
      primaryEmailAddress: { emailAddress: 'auditor@hireshield.demo' },
      firstName: 'Demo',
      lastName: 'Auditor',
      fullName: 'Demo Auditor',
    }
  }
}
