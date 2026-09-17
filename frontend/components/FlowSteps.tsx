'use client'

import { motion, useReducedMotion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface FlowStep {
  num: string
  label: string
  desc: string
}

interface FlowStepsProps {
  steps: FlowStep[]
}

export default function FlowSteps({ steps }: FlowStepsProps) {
  const prefersReduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, margin: '-80px' })

  // SVG connecting line — full width approximation between step centers
  const lineInitial = { pathLength: 0, opacity: 0 }
  const lineAnimate = inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
  const lineTransition = { duration: 1.6, ease: 'easeInOut' as const, delay: 0.3 }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* SVG connector line (desktop only) */}
      <div className="hidden md:block relative h-0 overflow-visible" aria-hidden="true">
        <svg
          className="absolute -top-5 left-0 w-full"
          height="10"
          viewBox="0 0 1000 10"
          preserveAspectRatio="none"
          fill="none"
        >
          <motion.line
            x1="100" y1="5" x2="900" y2="5"
            stroke="rgba(51,65,85,0.7)"
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={lineInitial}
            animate={lineAnimate}
            transition={lineTransition}
          />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.45,
              delay: prefersReduced ? 0 : i * 0.12 + 0.2,
              ease: 'easeOut',
            }}
            className="group relative bg-surface border border-surface-elevated p-4 rounded-sm flex flex-col h-full"
          >
            {/* Active glow on lit-up state */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 rounded-sm opacity-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)',
                borderTop: '1px solid rgba(59,130,246,0.2)',
              }}
              animate={inView && !prefersReduced ? {
                opacity: [0, 1],
                transition: { delay: i * 0.12 + 0.4, duration: 0.4 }
              } : {}}
            />

            <motion.span
              className="text-xl font-light font-mono mb-2"
              style={{ color: 'rgba(148,163,184,0.4)' }}
              animate={inView && !prefersReduced ? {
                color: 'rgba(148,163,184,1)',
                transition: { delay: i * 0.12 + 0.25, duration: 0.35 }
              } : {}}
            >
              {step.num}
            </motion.span>
            <span className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider mb-2">
              {step.label}
            </span>
            <p className="text-xs text-slate-400 font-mono leading-relaxed mt-auto">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
