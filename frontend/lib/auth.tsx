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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isClerkConfigured()) {
    return (
      <RealClerkProvider
        appearance={{
          variables: {
            colorPrimary: '#64748b',
            colorBackground: '#020617',
            borderRadius: '2px',
          },
          elements: {
            card: 'border border-[#1e293b]',
            headerTitle: 'font-mono uppercase tracking-widest text-lg',
            headerSubtitle: 'font-mono text-xs text-slate-400',
            formButtonPrimary: 'font-mono font-bold uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-300',
            socialButtonsBlockButton: 'font-mono text-xs border border-slate-800 hover:bg-slate-900',
            formFieldLabel: 'font-mono text-xs uppercase tracking-widest text-slate-500',
            formFieldInput: 'font-mono text-sm border-slate-800 focus:border-slate-500',
            footerActionLink: 'font-mono text-slate-400 hover:text-slate-300',
          }
        }}
      >
        {children}
      </RealClerkProvider>
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
