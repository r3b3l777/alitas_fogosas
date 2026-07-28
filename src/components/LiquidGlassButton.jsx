/* ============================================================
   LIQUID GLASS BUTTON — Alitas Fogosas

   Adaptación del "Apple Tahoe Liquid Glass Button" (21st.dev,
   @easemize). El original refracta una imagen de fondo propia dentro
   de un <LiquidGlassViewport> a pantalla completa; aquí el botón
   flota sobre la página real, así que en vez de eso refractamos el
   backdrop con `backdrop-filter: url(#filtro)` y un feDisplacementMap.

   Se conserva el motor del original: mapa de desplazamiento convexo
   generado en canvas y análisis de ese mapa para derivar el rim
   especular. El vidrio va teñido de naranja de marca (fire/crimson).

   Safari/iOS no aplican feDisplacementMap dentro de backdrop-filter:
   ahí caemos a blur + saturate, que se ve bien igual.
   ============================================================ */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

const BINS = 24
const DISP_SCALE = 26
/** Fuente de luz de la escena, en coordenadas de viewport (arriba al centro). */
const LIGHT_SOURCE = { x: 0.5, y: 0 }

/** Cúpula convexa: R/G codifican el desplazamiento, alfa recorta la píldora. */
function generateConvexMap(width, height, radius) {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const imgData = ctx.createImageData(w, h)
  const data = imgData.data
  // El botón es una píldora, no un cuadrado: el borde se calcula con la
  // distancia al rectángulo interior redondeado, no con una superelipse.
  const r = Math.min(radius, w / 2, h / 2)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5
      const py = y + 0.5
      // Distancia con signo a la píldora.
      const qx = Math.abs(px - w / 2) - (w / 2 - r)
      const qy = Math.abs(py - h / 2) - (h / 2 - r)
      const sd =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r

      const index = (y * w + x) * 4
      if (sd > 0) {
        data[index] = 128
        data[index + 1] = 128
        data[index + 2] = 128
        data[index + 3] = 0
        continue
      }

      // t = 0 en el centro, 1 en el borde. El desplazamiento se concentra
      // en la orilla, como el bisel de un lente real.
      const t = Math.min(1, -sd / Math.max(r, 1))
      const curve = Math.sin(Math.pow(1 - t, 0.85) * Math.PI)
      const nx = (px - w / 2) / (w / 2)
      const ny = (py - h / 2) / (h / 2)
      const len = Math.hypot(nx, ny) || 1

      data[index] = Math.round(128 + (-nx / len) * curve * 127)
      data[index + 1] = Math.round(128 + (-ny / len) * curve * 127)
      data[index + 2] = 128
      data[index + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return { url: canvas.toDataURL('image/png'), width: w, height: h, data }
}

/** Del mapa saca el ángulo dominante y el perfil angular del brillo. */
function analyzeRefraction(map, lightAz) {
  const { width, height, data } = map
  const profile = new Array(BINS).fill(0)
  const counts = new Array(BINS).fill(0)
  let sumX = 0
  let sumY = 0
  let sumMag = 0

  const step = 2
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      if (data[i + 3] === 0) continue
      const bx = (data[i] - 128) / 127
      const by = (data[i + 1] - 128) / 127
      const mag = Math.hypot(bx, by)
      if (mag < 0.02) continue

      const ang = Math.atan2(by, bx)
      const facing = Math.max(0, Math.cos(ang - lightAz))
      const bright = mag * (0.35 + 0.65 * facing)

      sumX += Math.cos(ang) * bright
      sumY += Math.sin(ang) * bright
      sumMag += bright

      let bin = Math.floor(((ang + Math.PI) / (2 * Math.PI)) * BINS) % BINS
      if (bin < 0) bin += BINS
      profile[bin] += bright
      counts[bin]++
    }
  }

  let maxP = 0
  for (let b = 0; b < BINS; b++) {
    if (counts[b]) profile[b] /= counts[b]
    if (profile[b] > maxP) maxP = profile[b]
  }
  if (maxP > 0) for (let b = 0; b < BINS; b++) profile[b] /= maxP

  const samples = Math.max(1, (width * height) / (step * step))
  return {
    profile,
    domAngle: Math.atan2(sumY, sumX),
    magnitude: Math.min(1, (sumMag / samples) * 6),
  }
}

/** Rim cónico: el brillo del borde sigue el perfil, tibio hacia la luz. */
function buildConicGradient(profile, fromDeg) {
  const stops = []
  for (let b = 0; b <= BINS; b++) {
    const t = profile[b % BINS]
    const deg = (b / BINS) * 360
    // Mezcla de blanco a ámbar: el vidrio es naranja, el reflejo también.
    const warm = 0.35 + t * 0.65
    const g = Math.round(190 + 65 * warm)
    const bl = Math.round(140 + 115 * warm)
    stops.push(`rgba(255,${g},${bl},${(0.06 + t * 0.62).toFixed(3)}) ${deg.toFixed(1)}deg`)
  }
  return `conic-gradient(from ${fromDeg.toFixed(1)}deg at 50% 50%, ${stops.join(', ')})`
}

/** Safari/iOS ignoran los filtros SVG en backdrop-filter. */
function detectMode() {
  if (typeof navigator === 'undefined') return 'blur'
  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua)
  if (isIOS || isSafari) return 'blur'
  return 'svg'
}

export default function LiquidGlassButton({ className = '', style, children, ...props }) {
  const btnRef = useRef(null)
  const feImageRef = useRef(null)
  const rawId = useId().replace(/:/g, '-')
  const filterId = `lg-${rawId}`

  const [mode, setMode] = useState('blur')

  useEffect(() => {
    setMode(detectMode())
  }, [])

  useLayoutEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    let frame = 0

    const apply = () => {
      const rect = btn.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const map = generateConvexMap(rect.width, rect.height, rect.height / 2)
      if (!map) return

      if (mode === 'svg' && feImageRef.current) {
        const fe = feImageRef.current
        fe.setAttribute('href', map.url)
        fe.setAttribute('width', String(map.width))
        fe.setAttribute('height', String(map.height))
      }

      // La luz es fija en la escena, así que el rim sólo cambia cuando el
      // botón se mueve o la ventana cambia de tamaño: nada de rAF continuo.
      const cx = (rect.left + rect.width / 2) / window.innerWidth
      const cy = (rect.top + rect.height / 2) / window.innerHeight
      const lightAz = Math.atan2(LIGHT_SOURCE.y - cy, LIGHT_SOURCE.x - cx)

      const a = analyzeRefraction(map, lightAz)
      const intensity = 0.4 + a.magnitude * 0.6
      btn.style.setProperty('--cos', String(-Math.cos(a.domAngle) * intensity))
      btn.style.setProperty('--sin', String(-Math.sin(a.domAngle) * intensity))
      btn.style.setProperty('--rim-intensity', String(a.magnitude))
      btn.style.setProperty('--rim-gradient', buildConicGradient(a.profile, (a.domAngle * 180) / Math.PI + 90))
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(apply)
    }

    // Directo, no en rAF: si el padre re-renderiza seguido, el cleanup
    // cancelaría el frame antes de que alcance a dibujar.
    apply()
    const ro = new ResizeObserver(schedule)
    ro.observe(btn)
    window.addEventListener('resize', schedule)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [mode])

  const lensFilter =
    mode === 'svg'
      ? `url(#${filterId}) saturate(150%) brightness(1.06)`
      : 'blur(7px) saturate(170%) brightness(1.06)'

  // Sólo ponemos `relative` si quien nos usa no trajo su propia posición:
  // con las dos clases juntas gana la que Tailwind emita al final, no la nuestra.
  const hasPosition = /(^|\s)(fixed|absolute|sticky|relative)(\s|$)/.test(className)

  return (
    <button
      ref={btnRef}
      className={`group isolate inline-flex items-center justify-center overflow-hidden rounded-full border-0 bg-transparent outline-none transition-transform duration-300 ease-[cubic-bezier(0.4,1.5,0.3,1)] hover:scale-[1.04] active:scale-[0.96] ${hasPosition ? '' : 'relative'} ${className}`}
      style={{
        '--cos': '0',
        '--sin': '-1',
        '--rim-intensity': '0.6',
        '--rim-gradient': 'none',
        ...style,
      }}
      {...props}
    >
      {mode === 'svg' && (
        <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
          <defs>
            <filter
              id={filterId}
              x="0"
              y="0"
              width="100%"
              height="100%"
              filterUnits="objectBoundingBox"
              primitiveUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feImage ref={feImageRef} x="0" y="0" result="lens" preserveAspectRatio="none" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="lens"
                scale={DISP_SCALE}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* Lente: refracta lo que haya detrás del botón */}
      <span
        aria-hidden="true"
        className="absolute inset-0 z-0 rounded-[inherit]"
        style={{ backdropFilter: lensFilter, WebkitBackdropFilter: lensFilter }}
      />

      {/* Tinte naranja de marca — el vidrio no es neutro, es fuego */}
      <span
        aria-hidden="true"
        className="absolute inset-0 z-[1] rounded-[inherit]"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,106,26,0.46) 0%, rgba(225,29,42,0.38) 55%, rgba(247,183,51,0.30) 100%)',
        }}
      />

      {/* Especular + bisel: la pila de sombras del componente original */}
      <span
        aria-hidden="true"
        className="absolute inset-0 z-[2] rounded-[inherit]"
        style={{
          backgroundImage:
            'radial-gradient(circle at calc(50% - var(--cos) * 50%) calc(50% - var(--sin) * 50%), rgba(255,235,200,0.30) 0%, transparent 62%)',
          boxShadow: `
            inset 0 0 0 1px color-mix(in srgb, white calc(var(--rim-intensity) * 22%), transparent),
            inset calc(var(--cos) * 1.8px) calc(var(--sin) * 3px) 0px -2px color-mix(in srgb, #ffe9c8 calc(var(--rim-intensity) * 90%), transparent),
            inset calc(var(--cos) * -2px) calc(var(--sin) * -2px) 0px -2px color-mix(in srgb, #ffd9a8 calc(var(--rim-intensity) * 80%), transparent),
            inset calc(var(--cos) * -3px) calc(var(--sin) * -8px) 1px -6px color-mix(in srgb, white calc(var(--rim-intensity) * 55%), transparent),
            inset calc(var(--cos) * -0.3px) calc(var(--sin) * -1px) 4px 0px color-mix(in srgb, #4a0f05 18%, transparent),
            inset calc(var(--cos) * -1.5px) calc(var(--sin) * 2.5px) 0px -2px color-mix(in srgb, #4a0f05 24%, transparent),
            inset calc(var(--cos) * 0px) calc(var(--sin) * 3px) 4px -2px color-mix(in srgb, #4a0f05 22%, transparent)
          `,
        }}
      />

      {/* Rim exterior: anillo de 1px con el perfil de brillo */}
      <span
        aria-hidden="true"
        className="absolute inset-0 z-[3] rounded-[inherit] p-px"
        style={{
          background: 'var(--rim-gradient)',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          maskComposite: 'exclude',
          opacity: 'calc(0.62 + var(--rim-intensity) * 0.24)',
        }}
      />

      <span className="relative z-10 inline-flex items-center gap-3 [text-shadow:0_1px_2px_rgba(74,15,5,0.55)]">
        {children}
      </span>
    </button>
  )
}
