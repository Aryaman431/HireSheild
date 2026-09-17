'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface Signal {
  severity: 'HIGH' | 'MED' | 'LOW'
  label: string
  detail: string
}

const severityConfig = {
  HIGH: {
    badgeClass: 'badge-critical',
    glowColor: 'rgba(255,42,42,0.35)',
    borderHover: 'rgba(255,42,42,0.4)',
  },
  MED: {
    badgeClass: 'badge-suspicious',
    glowColor: 'rgba(255,183,3,0.3)',
    borderHover: 'rgba(255,183,3,0.4)',
  },
  LOW: {
    badgeClass: 'badge-low',
    glowColor: 'rgba(16,185,129,0.25)',
    borderHover: 'rgba(16,185,129,0.35)',
  },
}

interface SignalCardProps {
  signal: Signal
  index: number
}

export default function SignalCard({ signal, index }: SignalCardProps) {
  const prefersReduced = useReducedMotion()
  const cfg = severityConfig[signal.severity]

  return (
    <motion.div
      key={signal.label}
      initial={{ opacity: 0, y: prefersReduced ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={prefersReduced ? {} : {
        y: -2,
        boxShadow: `0 4px 20px ${cfg.glowColor}, 0 0 0 1px ${cfg.borderHover}`,
        borderColor: cfg.borderHover,
        transition: { duration: 0.18 },
      }}
      className="flex items-start gap-3 p-3 bg-surface border border-surface-elevated rounded-sm cursor-default"
      style={{ willChange: 'transform, box-shadow' }}
    >
      <span className={`badge ${cfg.badgeClass} shrink-0 mt-0.5`}>
        {signal.severity}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-200 uppercase">{signal.label}</div>
        <div className="text-xs font-mono text-slate-400 mt-1">{signal.detail}</div>
      </div>
    </motion.div>
  )
}
