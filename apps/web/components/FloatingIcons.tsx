'use client'

import { useEffect, useRef } from 'react'

const ICONS = ['📄', '🖼', '🎵', '📦', '📝', '📊', '▶', '📃', '💻', '🗂']
const CX = 130
const CY = 130

// Purely decorative — spawns short-lived emoji that drift toward the center
// diamond using the Web Animations API, matching the original vanilla build.
export function FloatingIcons() {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let timeoutId: ReturnType<typeof setTimeout>
    let cancelled = false

    function spawn() {
      const wrap = wrapRef.current
      if (!wrap) return
      const el = document.createElement('div')
      el.className = 'float-icon'
      el.textContent = ICONS[Math.floor(Math.random() * ICONS.length)]

      const angle = Math.random() * Math.PI * 2
      const spawnR = 115 + Math.random() * 25
      const startX = CX + Math.cos(angle) * spawnR
      const startY = CY + Math.sin(angle) * spawnR
      const endX = CX + (Math.random() - 0.5) * 18
      const endY = CY + (Math.random() - 0.5) * 18

      el.style.left = startX + 'px'
      el.style.top = startY + 'px'
      el.style.transform = 'translate(-50%,-50%) scale(0.6)'
      wrap.appendChild(el)

      const dur = 2200 + Math.random() * 1400
      el.animate(
        [
          { opacity: 0, transform: 'translate(-50%,-50%) scale(0.5)', left: startX + 'px', top: startY + 'px' },
          {
            opacity: 0.85,
            transform: 'translate(-50%,-50%) scale(1)',
            left: startX + 'px',
            top: startY + 'px',
            offset: 0.15,
          },
          {
            opacity: 0.7,
            transform: 'translate(-50%,-50%) scale(0.85)',
            left: startX * 0.4 + endX * 0.6 + 'px',
            top: startY * 0.4 + endY * 0.6 + 'px',
            offset: 0.75,
          },
          { opacity: 0, transform: 'translate(-50%,-50%) scale(0.3)', left: endX + 'px', top: endY + 'px' },
        ],
        { duration: dur, easing: 'ease-in', fill: 'forwards' },
      ).finished.then(() => el.remove()).catch(() => {})
    }

    function scheduleNext() {
      if (cancelled) return
      spawn()
      timeoutId = setTimeout(scheduleNext, 500 + Math.random() * 600)
    }
    timeoutId = setTimeout(scheduleNext, 800)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [])

  return <div ref={wrapRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
}
