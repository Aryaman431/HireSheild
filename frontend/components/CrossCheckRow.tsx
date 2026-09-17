'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface CrossCheckItem {
  label: string
  status: string
  color: string // tailwind text-* class
  dotColor: string // hex for the dot glow
}

interface CrossCheckRowProps {
  item: CrossCheckItem
  index: number
}

export default function CrossCheckRow({ item, index }: CrossCheckRowProps) {
  const prefersReduced = useReducedMotion()
  const delay = index * 0.18 + 0.3

  return (
    <motion.div
      initial={{ opacity: 0, x: prefersReduced ? 0 : -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.42, delay, ease: 'easeOut' }}
      className="flex items-center justify-between py-2.5 px-3 bg-surface border border-surface-elevated rounded-sm text-xs font-mono"
    >
      <div className="flex items-center gap-2.5">
        {/* Activating dot */}
        <motion.span
          aria-hidden="true"
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: item.dotColor }}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={prefersReduced ? { scale: 1, opacity: 1 } : {
            scale: [0, 1.5, 1],
            opacity: [0, 1, 1],
            boxShadow: [
              `0 0 0px ${item.dotColor}00`,
              `0 0 8px ${item.dotColor}cc`,
              `0 0 4px ${item.dotColor}66`,
            ],
          }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: delay + 0.25, ease: 'easeOut' }}
        />
        <span className="text-slate-400 uppercase tracking-wider">{item.label}</span>
      </div>
      <motion.span
        className={`${item.color} font-bold`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: delay + 0.35 }}
      >
        {item.status}
      </motion.span>
    </motion.div>
  )
}
