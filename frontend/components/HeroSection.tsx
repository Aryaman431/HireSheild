'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useReducedMotion, useMotionValue, useSpring } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Shield, Terminal, Globe, Zap, ShieldAlert, Search } from 'lucide-react'
import RiskCard from './RiskCard'

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

const HEADLINE_LINE1 = ['Know', 'what', "you’re"]
const HEADLINE_LINE2 = ['applying', 'to.']


export default function HeroSection() {
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
      className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16 border-b border-border overflow-hidden"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full relative">
        <div className="flex flex-col items-start max-w-3xl relative">
        {/* Eyebrow & Status */}
        <motion.div
          className="flex flex-wrap items-center gap-2.5 mb-6"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-surface border border-border text-[11px] font-mono">
            <Shield size={12} className="text-brand-400" strokeWidth={2} />
            <span className="text-text font-bold uppercase tracking-wider">EMPLOYMENT THREAT INTELLIGENCE</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest hidden sm:inline-block">
            DEFENSIVE RECRUITMENT AUDITING
          </span>
        </motion.div>

        {/* Headline – word stagger */}
        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-light tracking-wide text-text leading-[1.15] mb-5 uppercase">
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
                className="inline-block text-text-muted"
              >
                {word}
              </motion.span>
            ))}
          </div>
        </h1>

        {/* Subhead with crisp 10-second value prop */}
        <motion.p
          className="text-text-muted text-base md:text-lg leading-relaxed mb-6 max-w-2xl font-mono"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
        >
          HireShield protects job seekers from recruitment fraud. We cross-verify employer domains, detect phantom fee requests, match against historical threat databases, and score job legitimacy before you apply or send sensitive data.
        </motion.p>

        {/* Core capability pills */}
        <motion.div
          className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.5, ease: 'easeOut' }}
        >
          {[
            { icon: <Globe size={13} />, label: 'Domain & DNS Checks' },
            { icon: <Zap size={13} />, label: 'Algorithmic Risk Scoring' },
            { icon: <ShieldAlert size={13} />, label: 'Phantom Fee Detection' },
            { icon: <Search size={13} />, label: 'Historical Threat Intel' },
          ].map((pill) => (
            <div
              key={pill.label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-surface-raised/40 border border-border text-[11px] font-mono text-text-muted hover:text-text transition-colors"
            >
              <span className="flex items-center justify-center text-brand-400">{pill.icon}</span>
              <span>{pill.label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA row */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 items-start w-full sm:w-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.6, ease: 'easeOut' }}
        >
          {/* Primary CTA – filled with shine sweep */}
          <Link
            href="/analyze"
            id="hero-cta-analyze"
            className="group relative overflow-hidden flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-sm bg-primary text-primary-foreground font-mono text-xs font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background shadow-md"
          >
            {/* Shine sweep */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />
            <span className="relative z-10">ANALYZE A JOB POST</span>
            <ArrowRight size={13} className="relative z-10 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          {/* Ghost CTA – HOW IT WORKS */}
          <a
            href="#how-it-works"
            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-sm border border-border font-mono text-xs font-bold tracking-widest uppercase text-text-muted transition-all duration-200 hover:border-border hover:bg-surface-raised/60 hover:text-text focus:outline-none focus:ring-1 focus:ring-border"
          >
            <Terminal size={12} className="text-text-muted group-hover:text-text transition-colors" />
            HOW IT WORKS
          </a>

        </motion.div>
        </div>
        <div className="w-full lg:max-w-md mx-auto mt-8 lg:mt-0">
          <RiskCard score={72} level="HIGH RISK" confidence={87} />
        </div>
      </div>
    </section>
  )
}
