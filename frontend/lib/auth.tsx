'use client'

import React, { createContext } from 'react'
import Link from 'next/link'
import { isClerkConfigured } from './auth-config'
import {
  ClerkProvider as RealClerkProvider,
  useAuth as useClerkAuth,
  SignInButton as RealSignInButton,
  SignUpButton as RealSignUpButton,
  UserButton as RealUserButton,
  SignOutButton as RealSignOutButton,
} from '@clerk/nextjs'

interface DemoAuthContextType {
  isSignedIn: boolean
  userId: string | null
  getToken: () => Promise<string>
}

const DemoAuthContext = createContext<DemoAuthContextType>({
  isSignedIn: false,
  userId: null,
  getToken: async () => 'demo_token',
})

import { getClerkAppearance } from './clerk-appearance'
import { useTheme } from 'next-themes'



export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isClerkConfigured()) {
    return (
      <ClerkThemeWrapper>
        {children}
      </ClerkThemeWrapper>
    )
  }

  return (
    <DemoAuthContext.Provider
      value={{
        isSignedIn: false,
        userId: null,
        getToken: async () => 'demo_token',
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  )
}

export function useAuth() {
  if (isClerkConfigured()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useClerkAuth()
  }
  return {
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    actor: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    has: () => false,
    signOut: async () => {},
    getToken: async () => 'demo_token',
  }
}

export function SignInButton({ children, mode }: { children?: React.ReactNode; mode?: string }) {
  if (isClerkConfigured()) {
    return <RealSignInButton mode={mode as 'modal' | 'redirect'}>{children}</RealSignInButton>
  }
  return (
    <Link href="/sign-in" className="inline-flex">
      {children}
    </Link>
  )
}

export function SignUpButton({ children, mode }: { children?: React.ReactNode; mode?: string }) {
  if (isClerkConfigured()) {
    return <RealSignUpButton mode={mode as 'modal' | 'redirect'}>{children}</RealSignUpButton>
  }
  return (
    <Link href="/sign-in" className="inline-flex">
      {children}
    </Link>
  )
}

export function UserButton() {
  if (isClerkConfigured()) {
    return <RealUserButton />
  }
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-elevated text-xs font-mono text-slate-300 border border-slate-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <span>AUDITOR (DEMO)</span>
    </div>
  )
}

export function SignOutButton({ children }: { children?: React.ReactNode }) {
  if (isClerkConfigured()) {
    return <RealSignOutButton>{children}</RealSignOutButton>
  }
  return (
    <Link href="/" className="inline-flex">
      {children}
    </Link>
  )
}

function ClerkThemeWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <RealClerkProvider appearance={getClerkAppearance(theme)}>
      {children}
    </RealClerkProvider>
  )
}
