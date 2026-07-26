import { useEffect, useRef } from 'react'

/* ============================================================================
   FALLING FEAST — capa de fondo con alitas, boneless y pizzas que caen
   desde el inicio de la página y se apilan hasta abajo.

   Cómo funciona
   -------------
   · Un solo <canvas> fijo al viewport, detrás del contenido (z-0).
   · La física vive en coordenadas del DOCUMENTO; al dibujar se resta el
     scroll, así que el canvas fijo se comporta como una cámara.
   · Tres planos de profundidad (lejos/medio/cerca) con escala, opacidad,
     desenfoque y parallax distintos. Cada plano choca sólo consigo mismo,
     así que forma su propia pila y se lee la profundidad.
   · Los sprites se pre-renderizan UNA vez (escala + blur + halo cálido
     horneados) para que cada frame sea sólo transform + drawImage.
   · LOOP INFINITO: el número de cuerpos es fijo (maxBodies). Cuando la pila
     ya está formada, se reciclan piezas dormidas que estén FUERA de la
     pantalla — siempre las de más arriba de la pila y nunca por debajo de
     `minPile` — y se sueltan de nuevo justo encima de la cámara. Así la
     lluvia nunca se detiene, la pila del footer no se vacía de golpe y el
     salto no se ve porque ocurre fuera del viewport.
   · Respeta prefers-reduced-motion: simula la pila en silencio y la pinta
     estática, sin animación.
   ========================================================================== */

// Protagonistas: alitas y boneless. Las pizzas caen rarísimo, de easter egg.
const SPRITES = [
  { src: '/img/sprites/wing2.png',     w: 62, rf: 0.34, spin: 1.0,  weight: 26 },
  { src: '/img/sprites/wing3.png',     w: 62, rf: 0.34, spin: 1.0,  weight: 26 },
  { src: '/img/sprites/wing.png',      w: 68, rf: 0.36, spin: 1.0,  weight: 12 },
  { src: '/img/sprites/boneless1.png', w: 38, rf: 0.50, spin: 1.45, weight: 16 },
  { src: '/img/sprites/boneless2.png', w: 40, rf: 0.50, spin: 1.45, weight: 16 },
  { src: '/img/sprites/pizza1.png',    w: 92, rf: 0.30, spin: 0.4,  weight: 1 },
  { src: '/img/sprites/pizza2.png',    w: 92, rf: 0.30, spin: 0.4,  weight: 1 },
  { src: '/img/sprites/pizza3.png',    w: 94, rf: 0.30, spin: 0.4,  weight: 1 },
  { src: '/img/sprites/pizza4.png',    w: 96, rf: 0.30, spin: 0.4,  weight: 1 },
]

// lejos → cerca. `par` = factor de parallax sobre el scroll.
const LAYERS = [
  { s: 0.56, a: 0.30, blur: 3.0, par: 0.86 },
  { s: 0.78, a: 0.56, blur: 1.2, par: 0.93 },
  { s: 1.0,  a: 0.88, blur: 0,   par: 1.0 },
]

// Caída lenta y flotante: la gracia es que se vaya llenando el final de la
// página poco a poco, no que llueva comida.
const GRAVITY = 380    // px/s²
const V_MAX = 190      // velocidad terminal
const RESTITUTION = 0.08
const FLOOR_FRICTION = 0.8
const WALL_RESTITUTION = 0.25
const AIR_DRAG = 0.5

// Reciclado (loop infinito)
const STILL_SPEED = 6      // px/s: por debajo de esto la pieza cuenta como quieta
const STILL_TIME = 1.4     // s quieta antes de ser candidata a reciclarse
const OFFSCREEN_PAD = 320  // px fuera del viewport para que el salto no se vea

const rand = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[(Math.random() * arr.length) | 0]

/** Índices de sprite repetidos según su peso, para elegir con probabilidad. */
const BAG = SPRITES.flatMap((s, i) => Array(s.weight).fill(i))

/**
 * Dibuja el sprite al tamaño de destino, con blur y halo cálido ya horneados.
 * `targetW` es el ancho en CSS px que debe tener la pieza en el plano cercano;
 * OJO: usar el ancho natural del PNG aquí ignora la config de SPRITES.
 */
function prerender(img, layer, alpha, targetW) {
  const w = Math.round(targetW * layer.s)
  const h = Math.round(w * (img.height / img.width))
  const glow = Math.round(26 * layer.s)
  const pad = glow + Math.ceil(layer.blur * 3) + 4
  const c = document.createElement('canvas')
  c.width = w + pad * 2
  c.height = h + pad * 2
  const x = c.getContext('2d')
  x.globalAlpha = alpha
  const filters = []
  if (layer.blur) filters.push(`blur(${layer.blur}px)`)
  if (filters.length) x.filter = filters.join(' ')
  // halo cálido: separa la pieza del fondo oscuro sin ensuciarla
  x.shadowColor = 'rgba(255, 106, 26, 0.34)'
  x.shadowBlur = glow
  x.drawImage(img, pad, pad, w, h)
  // segunda pasada: sombra profunda para asentarla sobre las tarjetas claras
  x.shadowColor = 'rgba(0, 0, 0, 0.5)'
  x.shadowBlur = Math.round(14 * layer.s)
  x.shadowOffsetY = Math.round(6 * layer.s)
  x.drawImage(img, pad, pad, w, h)
  return c
}

export default function FallingFeast() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches

    let W = 0, H = 0, dpr = 1
    let docH = 0, floorY = 0
    let bodies = []
    let sheets = []          // sheets[layer][spriteIndex] = canvas pre-renderizado
    let raf = 0
    let scrollRaf = 0
    let last = 0
    let spawnAt = 0
    let recycleAt = 0
    let maxBodies = 0
    let minPile = 0
    let alive = true

    // ── medidas ──────────────────────────────────────────────────────────
    function measure() {
      W = window.innerWidth
      H = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      docH = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        H,
      )
      floorY = docH - 28 // el suelo queda dentro del footer
      // suficientes piezas para que la pila del final llegue a llenarse
      const density = coarse ? 300 : 170
      maxBodies = Math.max(24, Math.min(coarse ? 48 : 120, Math.round(docH / density)))
      // nunca reciclamos por debajo de esto: la pila del footer se queda llena
      minPile = Math.round(maxBodies * 0.55)
    }

    // ── cuerpos ──────────────────────────────────────────────────────────
    /** (Re)inicializa un cuerpo en sitio: se usa al crear y al reciclar. */
    function initBody(b, layerIndex, y, settled = false) {
      const si = pick(BAG)
      const sp = SPRITES[si]
      const L = LAYERS[layerIndex]
      const size = sp.w * L.s
      b.si = si
      b.layer = layerIndex
      b.r = size * sp.rf
      b.x = rand(b.r + 8, Math.max(b.r + 9, W - b.r - 8))
      b.y = y
      b.vx = rand(-40, 40)
      b.vy = settled ? 0 : rand(20, 70)
      b.angle = rand(0, Math.PI * 2)
      b.av = rand(-1, 1) * sp.spin
      b.spin = sp.spin
      b.flip = Math.random() < 0.5 ? -1 : 1
      b.age = settled ? 1 : 0
      b.sway = rand(0, Math.PI * 2)
      b.swayAmp = sp.spin * rand(6, 16) // las piezas ligeras planean más
      b.still = 0
      b.retire = false
      return b
    }

    function makeBody(layerIndex, y, settled = false) {
      return initBody({}, layerIndex, y, settled)
    }

    function layerFor() {
      // más piezas al fondo que al frente: da profundidad sin saturar la lectura
      const r = Math.random()
      return r < 0.42 ? 0 : r < 0.76 ? 1 : 2
    }

    function spawn(y, settled) {
      if (bodies.length >= maxBodies) return
      bodies.push(makeBody(layerFor(), y, settled))
    }

    /** Punto del documento justo encima de la cámara para ese plano. */
    function skyFor(li) {
      const scroll = window.scrollY || window.pageYOffset || 0
      return scroll * LAYERS[li].par - rand(90, 420)
    }

    /** Suelta una pieza nueva encima de donde el usuario esté mirando. */
    function spawnFromSky() {
      if (bodies.length >= maxBodies) return
      const li = layerFor()
      bodies.push(makeBody(li, skyFor(li), false))
    }

    // ── reciclado: la lluvia nunca se acaba ───────────────────────────────
    function sleepingCount() {
      let n = 0
      for (const b of bodies) if (!b.retire && b.still >= STILL_TIME) n++
      return n
    }

    /**
     * Devuelve al cielo una pieza ya asentada. Prefiere las que están fuera de
     * pantalla (salto invisible); si la pila se está viendo —típico en el
     * footer— disuelve la de más arriba con un fundido en vez de teletransporte.
     * Nunca baja de `minPile` piezas dormidas, así la pila no se desinfla.
     */
    function recycle() {
      if (sleepingCount() <= minPile) return false
      const scroll = window.scrollY || window.pageYOffset || 0
      let hidden = null
      let visible = null
      for (const b of bodies) {
        if (b.retire || b.still < STILL_TIME) continue
        const sy = b.y - scroll * LAYERS[b.layer].par
        if (sy < -OFFSCREEN_PAD || sy > H + OFFSCREEN_PAD) {
          // la de más arriba de la pila: al quitarla nada se desmorona
          if (!hidden || b.y < hidden.y) hidden = b
        } else if (!visible || b.y < visible.y) visible = b
      }
      if (hidden) {
        const li = layerFor()
        initBody(hidden, li, skyFor(li), false)
        return true
      }
      if (visible) {
        visible.retire = true // se apaga y reaparece arriba (ver step)
        return true
      }
      return false
    }

    // ── física ───────────────────────────────────────────────────────────
    function step(dt) {
      const n = bodies.length
      for (let i = 0; i < n; i++) {
        const b = bodies[i]
        if (b.retire) {
          // fundido de salida; al desaparecer del todo vuelve arriba
          b.age -= dt * 2
          if (b.age <= 0) {
            const li = layerFor()
            initBody(b, li, skyFor(li), false)
          }
        } else {
          b.age = Math.min(1, b.age + dt * 2.2)
        }
        b.sway += dt * 1.6
        b.vy += GRAVITY * dt
        b.vy -= b.vy * AIR_DRAG * dt
        if (b.vy > V_MAX) b.vy = V_MAX
        // planeo lateral mientras cae libre
        const airborne = b.y < floorY - b.r - 2
        if (airborne) b.vx += Math.cos(b.sway) * b.swayAmp * dt
        b.vx -= b.vx * AIR_DRAG * dt
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.angle += b.av * dt
        b.av -= b.av * 0.5 * dt

        // paredes
        if (b.x < b.r) {
          b.x = b.r
          b.vx = Math.abs(b.vx) * WALL_RESTITUTION
          b.av *= 0.7
        } else if (b.x > W - b.r) {
          b.x = W - b.r
          b.vx = -Math.abs(b.vx) * WALL_RESTITUTION
          b.av *= 0.7
        }

        // suelo
        if (b.y > floorY - b.r) {
          b.y = floorY - b.r
          if (b.vy > 0) b.vy = -b.vy * RESTITUTION
          b.vx *= FLOOR_FRICTION
          b.av = b.av * 0.7 + b.vx * 0.006 // rueda un poco al frenar
          if (Math.abs(b.vy) < 24) b.vy = 0
          if (Math.abs(b.vx) < 3) b.vx = 0
          if (Math.abs(b.av) < 0.05) b.av = 0
        }

        // ¿lleva rato quieta? → candidata a reciclarse
        const sp2 = b.vx * b.vx + b.vy * b.vy
        b.still = sp2 < STILL_SPEED * STILL_SPEED ? b.still + dt : 0
      }

      // colisiones — sólo dentro del mismo plano de profundidad
      for (let i = 0; i < n; i++) {
        const a = bodies[i]
        for (let j = i + 1; j < n; j++) {
          const b = bodies[j]
          if (a.layer !== b.layer) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const rs = a.r + b.r
          const d2 = dx * dx + dy * dy
          if (d2 >= rs * rs || d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const nx = dx / d
          const ny = dy / d
          const overlap = rs - d
          // masa ∝ área
          const ma = a.r * a.r
          const mb = b.r * b.r
          const inv = 1 / (ma + mb)
          const push = overlap * 0.62
          a.x -= nx * push * (mb * inv)
          a.y -= ny * push * (mb * inv)
          b.x += nx * push * (ma * inv)
          b.y += ny * push * (ma * inv)
          const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
          if (rvn < 0) {
            const jimp = (-(1 + RESTITUTION) * rvn) * inv
            a.vx -= jimp * mb * nx
            a.vy -= jimp * mb * ny
            b.vx += jimp * ma * nx
            b.vy += jimp * ma * ny
            // roce tangencial → giro
            const tv = -(b.vx - a.vx) * ny + (b.vy - a.vy) * nx
            a.av -= tv * 0.0016
            b.av += tv * 0.0016
          }
        }
      }
    }

    // ── dibujo ───────────────────────────────────────────────────────────
    function draw() {
      const scroll = window.scrollY || window.pageYOffset || 0
      ctx.clearRect(0, 0, W, H)

      for (let li = 0; li < LAYERS.length; li++) {
        const L = LAYERS[li]
        const camY = scroll * L.par

        // resplandor cálido donde se acumula la pila
        const gy = floorY - camY
        if (gy > -160 && gy < H + 160) {
          const g = ctx.createRadialGradient(W / 2, gy, 0, W / 2, gy, Math.max(W * 0.75, 460))
          g.addColorStop(0, `rgba(255, 106, 26, ${0.05 * (li + 1)})`)
          g.addColorStop(1, 'rgba(255, 106, 26, 0)')
          ctx.globalCompositeOperation = 'lighter'
          ctx.fillStyle = g
          ctx.fillRect(0, Math.max(0, gy - 460), W, 920)
          ctx.globalCompositeOperation = 'source-over'
        }

        const sheet = sheets[li]
        if (!sheet) continue
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i]
          if (b.layer !== li) continue
          const sy = b.y - camY
          if (sy < -260 || sy > H + 260) continue
          const img = sheet[b.si]
          if (!img) continue
          if (b.age <= 0) continue
          ctx.globalAlpha = b.age
          ctx.translate(b.x, sy)
          ctx.rotate(b.angle)
          ctx.scale(b.flip, 1)
          ctx.drawImage(img, -img.width / 2, -img.height / 2)
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        ctx.globalAlpha = 1
      }
    }

    // ── bucle ────────────────────────────────────────────────────────────
    function frame(t) {
      if (!alive) return
      if (!last) last = t
      let dt = (t - last) / 1000
      last = t
      if (dt > 0.05) dt = 0.05 // tras pestaña oculta / jank, no explota

      if (t > spawnAt && bodies.length < maxBodies) {
        spawnFromSky()
        spawnAt = t + rand(260, 780)
      } else if (t > recycleAt && bodies.length >= maxBodies) {
        // ya está llena la escena: mantenemos el goteo reciclando la pila
        recycleAt = t + (recycle() ? rand(420, 1100) : 500)
      }

      // dos subpasos: apilado estable sin jitter
      step(dt * 0.5)
      step(dt * 0.5)
      draw()
      raf = requestAnimationFrame(frame)
    }

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!reduced && !raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }

    function onScrollStatic() {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        draw()
      })
    }

    // ── arranque ─────────────────────────────────────────────────────────
    let ro = null
    Promise.all(
      SPRITES.map(
        (s) =>
          new Promise((res) => {
            const im = new Image()
            im.decoding = 'async'
            im.onload = () => res(im)
            im.onerror = () => res(null)
            im.src = s.src
          }),
      ),
    ).then((imgs) => {
      if (!alive) return
      if (imgs.every((i) => !i)) return // sin sprites, sin capa

      measure()
      sheets = LAYERS.map((L) => imgs.map((im, i) => (im ? prerender(im, L, L.a, SPRITES[i].w) : null)))

      // pila inicial: la página nunca se ve vacía al llegar abajo
      const seed = Math.round(maxBodies * 0.5)
      for (let i = 0; i < seed; i++) spawn(floorY - rand(40, 520), true)
      for (let i = 0; i < 700; i++) step(1 / 60)

      // piezas ya en el aire, repartidas a lo largo de la página
      const inFlight = Math.round(maxBodies * 0.3)
      for (let i = 0; i < inFlight; i++) spawn(rand(-200, docH * 0.75), false)

      if (reduced) {
        // sin animación: sólo asienta y pinta, y sigue el scroll
        for (let i = 0; i < 600; i++) step(1 / 60)
        for (const b of bodies) b.age = 1
        draw()
        window.addEventListener('scroll', onScrollStatic, { passive: true })
        return
      }
      raf = requestAnimationFrame(frame)
    })

    function onResize() {
      const prevFloor = floorY
      measure()
      const shift = floorY - prevFloor
      for (const b of bodies) {
        if (shift) b.y += shift
        b.x = Math.min(Math.max(b.x, b.r), Math.max(b.r, W - b.r))
      }
      sheets = [] // se re-hornean sólo si cambia el DPR; barato de reconstruir
      if (canvasRef.current) {
        Promise.all(
          SPRITES.map(
            (s) =>
              new Promise((res) => {
                const im = new Image()
                im.onload = () => res(im)
                im.onerror = () => res(null)
                im.src = s.src
              }),
          ),
        ).then((imgs) => {
          if (!alive) return
          sheets = LAYERS.map((L) => imgs.map((im, i) => (im ? prerender(im, L, L.a, SPRITES[i].w) : null)))
          if (reduced) draw()
        })
      }
    }

    // Cuando el volcán del hero hace erupción, esas piezas "siguen" cayendo
    // aquí: soltamos otras tantas desde el inicio del documento para que el
    // usuario las alcance conforme baja.
    function onEruption(e) {
      if (reduced) return
      const n = Math.max(1, Math.min(14, e.detail?.count ?? 6))
      for (let i = 0; i < n; i++) {
        if (bodies.length < maxBodies) spawn(rand(-420, -90), false)
        else if (!recycle()) break // escena llena y nada reciclable todavía
      }
    }
    window.addEventListener('alitas:erupcion', onEruption)

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    // la altura del documento cambia con los reveals: reajusta el suelo
    if ('ResizeObserver' in window) {
      let t0 = 0
      ro = new ResizeObserver(() => {
        clearTimeout(t0)
        t0 = setTimeout(() => {
          const prev = floorY
          docH = Math.max(document.documentElement.scrollHeight, H)
          floorY = docH - 28
          const shift = floorY - prev
          if (shift) for (const b of bodies) b.y += shift
          if (reduced) draw()
        }, 200)
      })
      ro.observe(document.body)
    }

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      cancelAnimationFrame(scrollRaf)
      window.removeEventListener('alitas:erupcion', onEruption)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScrollStatic)
      document.removeEventListener('visibilitychange', onVisibility)
      ro?.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none"
    />
  )
}
