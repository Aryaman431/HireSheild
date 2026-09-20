'use client'

import { motion, useReducedMotion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import React from 'react'

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

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <motion.div
              initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.45,
                delay: prefersReduced ? 0 : i * 0.12 + 0.2,
                ease: 'easeOut',
              }}
              className="group relative bg-surface border border-border p-4 rounded-sm flex flex-col flex-1"
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
                className="text-xl font-light font-mono mb-2 text-text-muted/40"
                animate={inView && !prefersReduced ? {
                  color: 'var(--color-text)',
                  transition: { delay: i * 0.12 + 0.25, duration: 0.35 }
                } : {}}
              >
                {step.num}
              </motion.span>
              <span className="text-sm font-bold font-mono text-text uppercase tracking-wider mb-2">
                {step.label}
              </span>
              <p className="text-xs text-text-muted font-mono leading-relaxed mt-2">
                {step.desc}
              </p>
            </motion.div>
            
            {/* Connector */}
            {i < steps.length - 1 && (
              <div className="hidden md:flex items-center justify-center text-border">
                <ArrowRight size={16} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
