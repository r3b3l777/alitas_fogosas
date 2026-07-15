import { useEffect, useId, useRef, useState } from 'react'
import Lenis from 'lenis'

/* ── Smooth momentum scroll (Ducati-style) + animated anchor jumps ─────── */
let _lenis = null
/** Pause/resume smooth scroll — use when a modal/drawer is open so the
    background doesn't scroll behind it (Lenis ignores body overflow:hidden). */
export function lockScroll() { _lenis?.stop() }
export function unlockScroll() { _lenis?.start() }

export function useSmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      smoothWheel: true,
      touchMultiplier: 1.7,
    })
    _lenis = lenis
    let raf = 0
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)

    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const id = a.getAttribute('href')
      if (!id || id.length < 2) return
      const el = document.querySelector(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: -60, duration: 1.5 })
    }
    document.addEventListener('click', onClick)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('click', onClick)
      lenis.destroy()
      _lenis = null
    }
  }, [])
}

/* ── Reveal-on-scroll wrapper ─────────────────────────────────────────── */
/* `bare`: only toggles the `.in` class (for custom clip/scale reveals),
   without applying the default opacity/blur/translate styles. */
export function Reveal({ as: Tag = 'div', className = '', delay = 0, bare = false, children, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { el.classList.add('in'); return }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            // entering view → play the reveal (with its stagger delay)
            if (!bare) el.style.transitionDelay = `${delay}ms`
            else el.style.setProperty('--rd', `${delay}ms`)
            el.classList.add('in')
          } else {
            // leaving view → reset immediately so it replays on re-entry
            if (!bare) el.style.transitionDelay = '0ms'
            else el.style.setProperty('--rd', '0ms')
            el.classList.remove('in')
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay, bare])
  return (
    <Tag ref={ref} className={`${bare ? '' : 'reveal '}${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/* ── Scroll progress bar (thin gold/fire line at very top) ────────────── */
export function ScrollProgress() {
  const ref = useRef(null)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      const p = max > 0 ? h.scrollTop / max : 0
      el.style.transform = `scaleX(${p})`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
      <div
        ref={ref}
        className="h-full origin-left bg-gradient-to-r from-gold via-fire to-crimson"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}

/* ── Count-up hook: animates 0 → value when the element enters view ────── */
export function useCountUp(value, duration = 1600) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') { setDisplay(value); return }
    let raf = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // entering view → count up from 0 again
          if (raf) cancelAnimationFrame(raf)
          const start = performance.now()
          const tick = (now) => {
            const t = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
            setDisplay(Math.round(eased * value))
            if (t < 1) raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
        } else {
          // leaving view → reset so it replays next time
          if (raf) cancelAnimationFrame(raf)
          setDisplay(0)
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf) }
  }, [value, duration])
  return [ref, display]
}

/* ── Parallax hook: translate an element as it scrolls through viewport ── */
export function useParallax(speed = 0.15) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // progress: -1 (below) → 1 (above), 0 when centered
      const progress = (r.top + r.height / 2 - vh / 2) / vh
      el.style.transform = `translate3d(0, ${(progress * speed * -100).toFixed(2)}px, 0)`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [speed])
  return ref
}

/* ── Floating embers layer ────────────────────────────────────────────── */
export function Embers({ count = 14 }) {
  const [seeds] = useState(() =>
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      dur: 5 + Math.random() * 6,
      delay: Math.random() * 6,
      drift: (Math.random() * 40 - 20).toFixed(0) + 'px',
      scale: 0.6 + Math.random() * 1.1,
    })),
  )
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {seeds.map((s, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: `${s.left}%`,
            '--dur': `${s.dur}s`,
            '--delay': `${s.delay}s`,
            '--drift': s.drift,
            transform: `scale(${s.scale})`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Heat meter: los fueguitos se PRENDEN en secuencia al entrar en vista ─
   (la tarjeta padre es un Reveal; `.reveal.in .flame.lit` dispara la
   animación de ignición con delay escalonado — y se repite en cada scroll) */
// Escala de fuego: 1º dorado → 2º naranja → 3º ROJO (más picoso = más rojo).
// Cada flama encendida se pinta con un degradado de fuego real (núcleo
// amarillo caliente → matiz propio → punta oscura), tiene un halo que pulsa
// y "baila" como llama. --fg = RGB del glow, --spd = ritmo del baile.
const FLAME_SCALE = {
  1: { g: '247, 183, 51', s: '2.6s', stops: ['#ffe9a8', '#f7b733', '#d98a12'] },
  2: { g: '255, 122, 26', s: '1.9s', stops: ['#ffd9a0', '#ff7a1a', '#e04a0e'] },
  3: { g: '255, 45, 45', s: '1.2s', stops: ['#ffcf7e', '#ff5a3c', '#d40f2b'] },
}

export function Heat({ level = 1, className = '' }) {
  const labels = { 1: 'Suave', 2: 'Picosa', 3: 'Para valientes' }
  const uid = useId()
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={labels[level]}
      aria-label={`Nivel de picor: ${labels[level]}`}
    >
      {/* Degradados de fuego (uno por posición de flama) */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          {[1, 2, 3].map((i) => (
            <linearGradient key={i} id={`${uid}-f${i}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={FLAME_SCALE[i].stops[0]} />
              <stop offset="48%" stopColor={FLAME_SCALE[i].stops[1]} />
              <stop offset="100%" stopColor={FLAME_SCALE[i].stops[2]} />
            </linearGradient>
          ))}
        </defs>
      </svg>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`flame ${i <= level ? 'lit' : ''}`}
          style={{ '--fd': `${0.3 + i * 0.24}s`, '--fg': FLAME_SCALE[i].g, '--spd': FLAME_SCALE[i].s }}
        >
          <Icon.Flame
            className={`h-[18px] w-[18px] ${i <= level ? '' : 'text-ash-dim/40'}`}
            filled={i <= level}
            gradient={i <= level ? `url(#${uid}-f${i})` : undefined}
          />
        </span>
      ))}
    </span>
  )
}

/* ── Logo (escudo real + wordmark) ────────────────────────────────────── */
export function Logo({ className = '', showText = true }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/img/logo-badge.png"
        alt="Alitas Fogosas"
        width="40"
        height="40"
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gold/60"
      />
      {showText && (
        <span className="font-display text-2xl leading-none tracking-wide text-cream">
          Alitas<span className="text-fire">Fogosas</span>
        </span>
      )}
    </span>
  )
}

/* ── SVG icon set (no emojis as UI) ───────────────────────────────────── */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Icon = {
  Flame: ({ className = '', filled = false, gradient }) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? gradient || 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? 0 : 1.9}
      strokeLinejoin="round"
    >
      <path d="M12 2c1.5 3.5 0 5.5-1.5 7C13 8 15 10 15 13.5A4.5 4.5 0 0 1 6 14c0-3 2.5-4.5 3.5-7 .5 1.5 1.5 2 2 2 .3-2-.2-4.5.5-7z" />
    </svg>
  ),
  Star: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.8l-5.8 3 1.1-6.4L2.6 9.8l6.5-.9L12 2.5z" />
    </svg>
  ),
  Whatsapp: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.1L2 22l5.05-1.32A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 0 1 6.86 12.42l-.2.32.78 2.85-2.92-.77-.31.18A8.1 8.1 0 1 1 12.04 3.8zm-3.2 3.9c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02s.87 2.34 1 2.5c.12.16 1.7 2.72 4.2 3.7 2.07.82 2.5.66 2.95.62.45-.04 1.45-.59 1.66-1.17.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.72-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.77.96-.14.16-.28.18-.52.06-.24-.12-1.03-.38-1.96-1.21-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.34-.76-1.83-.2-.48-.4-.41-.55-.42h-.47z" />
    </svg>
  ),
  Instagram: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5H17V4.6c-.29-.04-1.27-.12-2.42-.12-2.4 0-4.04 1.46-4.04 4.15v2.32H7.8V14h2.74v8h2.96z" />
    </svg>
  ),
  MapPin: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M20 10c0 5.2-8 12-8 12s-8-6.8-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  ),
  Clock: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </svg>
  ),
  Phone: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 6.2 2 2 0 0 1 5 4z" />
    </svg>
  ),
  Arrow: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Menu: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  Close: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Check: ({ className = '' }) => (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  ),
}
