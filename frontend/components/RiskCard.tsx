'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface RiskCardProps {
  score: number
  level: string
  confidence: number
}

// Animated count-up hook
function useCountUp(target: number, duration = 1400, startDelay = 400, active = false) {
  const [value, setValue] = useState(0)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (!active) return
    if (prefersReduced) { setValue(target); return }
    let start: number | null = null
    const timeout = setTimeout(() => {
      const animate = (ts: number) => {
        if (!start) start = ts
        const elapsed = ts - start
        const progress = Math.min(elapsed / duration, 1)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, startDelay)
    return () => clearTimeout(timeout)
  }, [active, target, duration, startDelay, prefersReduced])

  return value
}

// SVG ring
const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function scoreColor(score: number) {
  if (score >= 70) return '#ff2a2a'
  if (score >= 40) return '#ffb703'
  return '#10b981'
}

export default function RiskCard({ score, level, confidence }: RiskCardProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect() } },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const displayed = useCountUp(score, 1400, 350, active)
  const color = scoreColor(score)
  const fraction = score / 100
  const dashoffset = CIRCUMFERENCE * (1 - fraction)

  return (
    <div ref={ref} className="bg-surface border border-surface-elevated rounded-sm p-4 text-center relative overflow-hidden">
      {/* Scan-line sweep on mount */}
      {!prefersReduced && active && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-slate-400/25 to-transparent"
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeIn', delay: 0.15 }}
        />
      )}

      <span className="tech-label text-slate-500 mb-3">RISK ASSESSMENT</span>

      {/* SVG ring */}
      <div className="relative flex items-center justify-center mx-auto w-32 h-32 my-2">
        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
          {/* Track */}
          <circle
            cx="64" cy="64" r={RADIUS}
            fill="none"
            stroke="rgba(51,65,85,0.5)"
            strokeWidth="8"
          />
          {/* Fill */}
          <motion.circle
            cx="64" cy="64" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={active ? { strokeDashoffset: prefersReduced ? dashoffset : dashoffset } : {}}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
          />
        </svg>
        {/* Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-light leading-none" style={{ color }}>
            {displayed}
          </span>
          <span className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase tracking-widest">
            RISK SCORE
          </span>
        </div>
      </div>

      {/* HIGH RISK badge – pulse once on mount */}
      <motion.div
        className="inline-flex items-center px-3 py-1 rounded-sm font-mono text-sm font-bold uppercase tracking-wider mb-2"
        style={{
          backgroundColor: `${color}15`,
          color,
          borderWidth: 1,
          borderColor: `${color}50`,
        }}
        animate={active && !prefersReduced ? {
          boxShadow: [
            `0 0 0px ${color}00`,
            `0 0 18px ${color}60`,
            `0 0 8px ${color}30`,
            `0 0 0px ${color}00`,
          ],
        } : {}}
        transition={{ duration: 1.6, delay: 0.9, times: [0, 0.4, 0.7, 1] }}
      >
        {level}
      </motion.div>

      <span className="text-xs font-mono text-slate-400 block uppercase">
        CONFIDENCE: {confidence}%
      </span>
    </div>
  )
}
