'use client'

import Link from 'next/link'
import { UserButton, SignInButton, SignUpButton } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Shield } from 'lucide-react'

export default function Navigation({ userId }: { userId: string | null }) {
  const [scrolled, setScrolled] = useState(false)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 border-b transition-all duration-300"
      style={{
        borderColor: scrolled ? 'rgba(51,65,85,0.8)' : 'rgba(51,65,85,0.4)',
        backgroundColor: scrolled ? 'rgba(2,6,23,0.85)' : 'rgba(2,6,23,0.0)',
        backdropFilter: scrolled ? 'blur(18px) saturate(140%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(140%)' : 'none',
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-surface-elevated bg-surface"
            animate={prefersReduced ? {} : {
              boxShadow: [
                '0 0 0px rgba(148,163,184,0)',
                '0 0 8px rgba(148,163,184,0.12)',
                '0 0 0px rgba(148,163,184,0)',
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield size={14} className="text-slate-400" strokeWidth={1.5} />
          </motion.div>
          <Link
            href="/"
            className="font-mono text-sm font-bold uppercase tracking-[0.16em] text-slate-100 transition-colors hover:text-slate-300"
          >
            HireShield
          </Link>
        </div>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 rounded-sm border border-surface-elevated bg-surface p-1 md:flex">
          {[
            { href: '/analyze', label: 'Analyze' },
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/community', label: 'Community' },
          ].map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-4">
          {userId ? (
            <UserButton />
          ) : (
            <div className="flex items-center gap-4">
              <SignInButton mode="modal">
                <button className="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors">
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-sm bg-surface-elevated px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-300 transition-colors hover:bg-slate-800">
                  Get Started
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group relative rounded-sm px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 transition-colors hover:bg-surface-raised hover:text-slate-200"
    >
      {label}
      {/* Underline draw-in */}
      <span
        aria-hidden="true"
        className="absolute bottom-0.5 left-3 right-3 h-px bg-slate-400 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100"
      />
    </Link>
  )
}
