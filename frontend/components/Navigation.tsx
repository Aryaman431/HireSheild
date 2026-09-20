'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton, SignInButton, SignUpButton } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Shield, Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Navigation({ userId }: { userId: string | null }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${scrolled ? 'border-border bg-background/85 backdrop-blur-[18px] saturate-[140%]' : 'border-transparent bg-transparent'}`}
    >
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface"
            animate={prefersReduced ? {} : {
              boxShadow: [
                '0 0 0px rgba(148,163,184,0)',
                '0 0 8px rgba(148,163,184,0.12)',
                '0 0 0px rgba(148,163,184,0)',
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield size={14} className="text-text-muted" strokeWidth={1.5} />
          </motion.div>
          <Link
            href="/"
            className="font-mono text-sm font-bold uppercase tracking-[0.16em] text-text transition-colors hover:opacity-80"
          >
            HireShield
          </Link>
        </div>

        {/* Nav links (Desktop) */}
        <nav className="hidden items-center gap-1 rounded-sm border border-border bg-surface p-1 md:flex justify-self-center">
          {[
            { href: '/analyze', label: 'Analyze' },
            ...(userId ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
            { href: '/community', label: 'Community' },
          ].map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Auth & Mobile Toggle */}
        <div className="flex items-center gap-3 justify-self-end">
          <ThemeToggle />
          
          {userId ? (
            <UserButton />
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="text-xs font-mono uppercase tracking-widest text-text-muted hover:text-text transition-colors">
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-sm bg-surface-elevated px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted transition-colors hover:bg-surface-raised hover:text-text">
                  Get Started
                </button>
              </SignUpButton>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface text-text-muted hover:text-text md:hidden transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-b border-border bg-background/95 backdrop-blur-md px-5 py-3 md:hidden font-mono text-xs space-y-1">
          {[
            { href: '/analyze', label: 'Analyze Opportunity' },
            ...(userId ? [{ href: '/dashboard', label: 'Intelligence Dashboard' }] : []),
            { href: '/community', label: 'Community Reports' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-sm px-3 py-2 text-text-muted hover:bg-surface-raised hover:text-text uppercase tracking-wider transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {!userId && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
              <SignInButton mode="modal">
                <button className="block w-full text-left rounded-sm px-3 py-2 text-text-muted hover:bg-surface-raised hover:text-text uppercase tracking-wider transition-colors">
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="block w-full text-left rounded-sm px-3 py-2 bg-surface-elevated text-text-muted hover:bg-surface-raised hover:text-text uppercase tracking-wider transition-colors">
                  Get Started
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname?.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`group relative rounded-sm px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors ${
        isActive
          ? 'bg-surface-raised text-text'
          : 'text-text-muted hover:bg-surface-raised/50 hover:text-text'
      }`}
    >
      {label}
      {/* Underline draw-in */}
      <span
        aria-hidden="true"
        className={`absolute bottom-0.5 left-3 right-3 h-px origin-left transition-transform duration-200 ${
          isActive ? 'bg-text scale-x-100' : 'bg-text-muted scale-x-0 group-hover:scale-x-100'
        }`}
      />
    </Link>
  )
}
