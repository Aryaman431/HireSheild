'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useReducedMotion, useMotionValue, useSpring } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Shield, Terminal } from 'lucide-react'

// Word-level staggered reveal
const wordVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: i * 0.055,
    },
  }),
}

const reducedWordVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.3, delay: i * 0.04 },
  }),
}

const HEADLINE_LINE1 = ['Know', 'what', "you're"]
const HEADLINE_LINE2 = ['applying', 'to.']

interface HeroSectionProps {
  isSignedIn: boolean
}

export default function HeroSection({ isSignedIn }: HeroSectionProps) {
  const prefersReduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  // Cursor spotlight
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })
  const [spotlightStyle, setSpotlightStyle] = useState({})

  useEffect(() => {
    if (prefersReduced) return
    const unsub1 = springX.on('change', (x) =>
      setSpotlightStyle((s) => ({ ...s, '--sx': `${x}px` }))
    )
    const unsub2 = springY.on('change', (y) =>
      setSpotlightStyle((s) => ({ ...s, '--sy': `${y}px` }))
    )
    return () => { unsub1(); unsub2() }
  }, [springX, springY, prefersReduced])

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReduced) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const variants = prefersReduced ? reducedWordVariants : wordVariants

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16 border-b border-surface-elevated overflow-hidden"
    >
      {/* Cursor spotlight */}
      {!prefersReduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(600px circle at var(--sx, 50%) var(--sy, 50%), rgba(59,130,246,0.04) 0%, transparent 70%)`,
            ...spotlightStyle,
          } as React.CSSProperties}
        />
      )}

      <div className="flex flex-col items-start max-w-3xl relative">
        {/* Eyebrow */}
        <motion.div
          className="flex items-center gap-2 mb-6"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Shield size={11} className="text-slate-500" strokeWidth={2} />
          <span className="tech-label text-slate-400 mb-0">THREAT INTELLIGENCE PLATFORM</span>
          <span className="h-1 w-1 rounded-full bg-slate-600 animate-pulse" />
        </motion.div>

        {/* Headline – word stagger */}
        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-light tracking-wide text-white leading-[1.18] mb-5 uppercase">
          <div className="flex flex-wrap gap-x-[0.3em] gap-y-0 mb-1">
            {HEADLINE_LINE1.map((word, i) => (
              <motion.span
                key={word}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={variants}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-[0.3em]">
            {HEADLINE_LINE2.map((word, i) => (
              <motion.span
                key={word}
                custom={HEADLINE_LINE1.length + i}
                initial="hidden"
                animate="visible"
                variants={variants}
                className="inline-block text-slate-400"
              >
                {word}
              </motion.span>
            ))}
          </div>
        </h1>

        {/* Subhead */}
        <motion.p
          className="text-slate-400 text-base md:text-lg leading-relaxed mb-8 max-w-2xl font-mono"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
        >
          HireShield analyzes job opportunities and identifies suspicious signals, verification issues, and historical intelligence before you apply.
        </motion.p>

        {/* CTA row */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 items-start"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.55, ease: 'easeOut' }}
        >
          {/* Primary CTA – filled with shine sweep */}
          <Link
            href="/analyze"
            id="hero-cta-analyze"
            className="group relative overflow-hidden flex items-center gap-2 px-8 py-3 rounded-sm bg-slate-100 text-slate-900 font-mono text-xs font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            style={{ boxShadow: '0 0 0 0 rgba(148,163,184,0)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px 2px rgba(148,163,184,0.18)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 0 rgba(148,163,184,0)'
            }}
          >
            {/* Shine sweep */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
            <span className="relative z-10">ANALYZE A JOB</span>
            <ArrowRight size={13} className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          {/* Ghost CTA – HOW IT WORKS */}
          <a
            href="#how-it-works"
            className="group flex items-center gap-2 px-8 py-3 rounded-sm border border-surface-elevated font-mono text-xs font-bold tracking-widest uppercase text-slate-400 transition-all duration-200 hover:border-slate-500 hover:bg-surface/60 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <Terminal size={11} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            HOW IT WORKS
          </a>

          {/* Ghost CTA – SYSTEM LOGIN */}
          {!isSignedIn && (
            <Link
              href="/sign-in"
              id="hero-cta-login"
              className="group flex items-center gap-2 px-8 py-3 rounded-sm border border-surface-elevated font-mono text-xs font-bold tracking-widest uppercase text-slate-400 transition-all duration-200 hover:border-slate-500 hover:bg-surface/60 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              SYSTEM LOGIN
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  )
}
