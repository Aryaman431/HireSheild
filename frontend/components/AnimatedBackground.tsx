'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (prefersReduced) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let scanY = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Slow drifting scanline sweep
      const grad = ctx.createLinearGradient(0, scanY - 80, 0, scanY + 80)
      grad.addColorStop(0, 'rgba(59,130,246,0)')
      grad.addColorStop(0.5, 'rgba(59,130,246,0.025)')
      grad.addColorStop(1, 'rgba(59,130,246,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 80, canvas.width, 160)

      // Slow vignette corners
      const radial = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.9
      )
      radial.addColorStop(0, 'rgba(2,6,23,0)')
      radial.addColorStop(1, 'rgba(2,6,23,0.45)')
      ctx.fillStyle = radial
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      scanY += 0.4
      if (scanY > canvas.height + 80) scanY = -80

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [prefersReduced])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
