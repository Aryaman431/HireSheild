'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

interface TypewriterTextProps {
  text: string
  className?: string
  speed?: number // ms per character
  startDelay?: number
}

export default function TypewriterText({
  text,
  className = '',
  speed = 28,
  startDelay = 300,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (!inView) return
    if (prefersReduced) {
      setDisplayed(text)
      setDone(true)
      return
    }
    let i = 0
    setDisplayed('')
    setDone(false)
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(interval)
          setDone(true)
        }
      }, speed)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(timeout)
  }, [inView, text, speed, startDelay, prefersReduced])

  return (
    <span ref={ref} className={className}>
      {displayed}
      {!done && (
        <span
          aria-hidden="true"
          className="inline-block w-[2px] h-[1em] bg-current align-middle ml-0.5 animate-[blink_1s_step-end_infinite]"
        />
      )}
    </span>
  )
}
