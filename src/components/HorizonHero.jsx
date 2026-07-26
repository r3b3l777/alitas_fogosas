/* ============================================================
   HORIZON HERO — Alitas Fogosas
   Intro cinematográfica en WebGL: brasas que suben, humo sobre el
   asador y bloom, con recorrido de cámara atado al scroll.

   Portado a JSX del componente "Horizon Hero Section" (21st.dev,
   @lovesickfromthe6ix) y re-tematizado a la marca. Sin lucide:
   usa los iconos SVG que ya vivían en components/ui.jsx.
   ============================================================ */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { Icon } from './ui'
import { waLink } from '../data'
import './HorizonHero.css'

gsap.registerPlugin(ScrollTrigger)

/** Capítulos que se recorren con el scroll, después del hero. */
const SCROLL_SECTIONS = [
  {
    round: '01 · Las salsas',
    title: 'ONCE NIVELES',
    accent: 'NIVELES',
    line1: 'Del ajo parmesano cremosito',
    line2: 'hasta el habanero de los valientes.',
  },
  {
    round: '02 · La orden',
    title: 'A TU MEDIDA',
    accent: 'MEDIDA',
    line1: 'Desde 324 gramos para ti solo,',
    line2: 'hasta 2,442 para toda la banda.',
  },
]

/** Waypoints de cámara: uno por pantalla del recorrido. */
const CAMERA_PATH = [
  { x: 0, y: 26, z: 180 },
  { x: 0, y: 16, z: 96 },
  { x: 0, y: 9, z: 26 },
]

const EMBER_PALETTE = [
  new THREE.Color('#f7b733'), // gold
  new THREE.Color('#ffd15c'),
  new THREE.Color('#ff6a1a'), // fire
  new THREE.Color('#ff9a3c'),
  new THREE.Color('#e11d2a'), // crimson, sólo de acento
  new THREE.Color('#fff3d6'),
]

const EMBER_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aSway;
  attribute vec3  aColor;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSpan;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;

    // Ascenso continuo con wrap vertical.
    p.y = mod(p.y + uTime * aSpeed * 7.0, uSpan) - uSpan * 0.35;
    // Vaivén de la corriente térmica.
    p.x += sin(uTime * 0.55 + aPhase) * aSway;
    p.z += cos(uTime * 0.42 + aPhase * 1.7) * aSway * 0.6;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

    float twinkle = 0.55 + 0.45 * sin(uTime * 2.4 + aPhase * 3.1);
    // Se apagan conforme suben, como brasa real.
    float fade = 1.0 - smoothstep(uSpan * 0.25, uSpan * 0.62, p.y);

    vColor = aColor;
    vAlpha = twinkle * max(fade, 0.06);

    gl_PointSize = aSize * uPixelRatio * (190.0 / max(-mvPosition.z, 1.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`

const EMBER_FRAGMENT = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float core = 1.0 - smoothstep(0.0, 0.5, d);
    float glow = pow(core, 2.6);

    gl_FragColor = vec4(vColor * (0.65 + glow * 1.6), glow * vAlpha);
  }
`

const SMOKE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SMOKE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uIntensity;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // Humo que sube lentamente sobre el asador.
    float n = fbm(uv * 3.2 + vec2(uTime * 0.035, -uTime * 0.085));
    n += 0.5 * fbm(uv * 6.4 - vec2(uTime * 0.05, uTime * 0.03));

    // Concentrado en el horizonte, se disuelve arriba.
    float horizon = 1.0 - smoothstep(0.0, 0.72, abs(uv.y - 0.28));
    float density = smoothstep(0.35, 1.15, n) * horizon;

    vec3 col = mix(uColorA, uColorB, clamp(n * 0.8, 0.0, 1.0));

    gl_FragColor = vec4(col, density * uIntensity);
  }
`

function ChevronDown({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HorizonHero() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const heroContentRef = useRef(null)

  const smoothCameraPos = useRef({ x: 0, y: 26, z: 180 })
  const targetCameraPos = useRef({ x: 0, y: 26, z: 180 })
  const pointer = useRef({ x: 0, y: 0 })

  const [isReady, setIsReady] = useState(false)
  /** Si el dispositivo no puede crear contexto WebGL, caemos a un fondo CSS. */
  const [webglFailed, setWebglFailed] = useState(false)

  // En móvil recortamos el recorrido: menos scroll antes del contenido real.
  const [sections] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches
      ? SCROLL_SECTIONS.slice(0, 1)
      : SCROLL_SECTIONS,
  )

  const threeRefs = useRef({
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    bloom: null,
    embers: [],
    smoke: null,
    keyLight: null,
    craterGlow: null,
    craterLight: null,
    crater: null,
    erupt: null,
    stepEruption: null,
    flash: 0,
    nextErupt: 1.2, // la primera erupción entra casi de inmediato
    lastElapsed: 0,
    animationId: null,
    startTime: performance.now(),
    visible: true,
  })

  /* ---------------------------------------------------------------- */
  /*  Three.js                                                         */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const refs = threeRefs.current
    const canvas = canvasRef.current
    if (!canvas) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 860px)').matches

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x140b06, 0.0032)
    refs.scene = scene

    // En vertical el encuadre es angosto: abrimos campo y alejamos la cámara
    // para que el volcán entre completo en un teléfono.
    const portrait = window.innerHeight > window.innerWidth
    const camPath = isMobile
      ? CAMERA_PATH.map((p) => ({ x: p.x, y: p.y * 1.08, z: p.z * 1.5 }))
      : CAMERA_PATH
    refs.camPath = camPath
    smoothCameraPos.current = { ...camPath[0] }
    targetCameraPos.current = { ...camPath[0] }

    const camera = new THREE.PerspectiveCamera(
      portrait ? 86 : 70,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    )
    camera.position.set(camPath[0].x, camPath[0].y, camPath[0].z)
    refs.camera = camera

    // Sin WebGL (equipos viejos, GPU deshabilitada, navegadores embebidos) el
    // hero cae a un fondo CSS y el contenido se muestra igual.
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      setWebglFailed(true)
      setIsReady(true)
      return
    }
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    refs.renderer = renderer

    /* --- Luces --- */
    scene.add(new THREE.AmbientLight(0x2c1a0e, 0.9))

    const keyLight = new THREE.PointLight(0xff8a2b, 900, 620, 2)
    keyLight.position.set(0, 6, 40)
    scene.add(keyLight)
    refs.keyLight = keyLight

    const rimLight = new THREE.DirectionalLight(0xffc98a, 0.6)
    rimLight.position.set(-60, 70, -40)
    scene.add(rimLight)

    /* --- Brasas (3 capas de profundidad) --- */
    const createEmbers = (count, sizeRange, spread, span) => {
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      const sizes = new Float32Array(count)
      const phases = new Float32Array(count)
      const speeds = new Float32Array(count)
      const sways = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread
        positions[i * 3 + 1] = Math.random() * span
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.75

        const color = EMBER_PALETTE[Math.floor(Math.random() * EMBER_PALETTE.length)]
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b

        sizes[i] = THREE.MathUtils.randFloat(sizeRange[0], sizeRange[1])
        phases[i] = Math.random() * Math.PI * 2
        speeds[i] = THREE.MathUtils.randFloat(0.35, 1.15)
        sways[i] = THREE.MathUtils.randFloat(1.2, 5.5)
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
      geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
      geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
      geometry.setAttribute('aSway', new THREE.BufferAttribute(sways, 1))

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: renderer.getPixelRatio() },
          uSpan: { value: span },
        },
        vertexShader: EMBER_VERTEX,
        fragmentShader: EMBER_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })

      const points = new THREE.Points(geometry, material)
      scene.add(points)
      refs.embers.push(points)
    }

    const emberScale = isMobile ? 0.4 : 1
    createEmbers(Math.round(2600 * emberScale), [1.4, 3.4], 520, 300)
    createEmbers(Math.round(1400 * emberScale), [2.6, 5.6], 300, 220)
    createEmbers(Math.round(600 * emberScale), [4.5, 9.5], 170, 150)

    /* --- Humo del asador --- */
    const smokeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#5a1c05') },
        uColorB: { value: new THREE.Color('#ffa63d') },
        uIntensity: { value: 0.42 },
      },
      vertexShader: SMOKE_VERTEX,
      fragmentShader: SMOKE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    const smoke = new THREE.Mesh(new THREE.PlaneGeometry(1800, 900), smokeMaterial)
    smoke.position.set(0, 90, -420)
    scene.add(smoke)
    refs.smoke = smoke

    /* --- Siluetas del horizonte --- */
    const createRidge = (z, height, color, opacity) => {
      const geometry = new THREE.PlaneGeometry(1600, 340, isMobile ? 80 : 140, isMobile ? 14 : 24)
      const position = geometry.attributes.position

      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i)
        const y = position.getY(i)
        const crest =
          Math.sin(x * 0.011 + z) * height * 0.5 +
          Math.sin(x * 0.031 + z * 2.1) * height * 0.22 +
          Math.sin(x * 0.084 + z * 0.7) * height * 0.09
        const t = (y + 170) / 340
        position.setZ(i, crest * t)
      }
      geometry.computeVertexNormals()

      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.96,
        metalness: 0.04,
        transparent: true,
        opacity,
        emissive: new THREE.Color(0x241004),
        emissiveIntensity: 0.4,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.x = -Math.PI / 2.06
      mesh.position.set(0, -46, z)
      scene.add(mesh)
    }

    // Sierra de fondo: sólo las dos capas lejanas, para dar profundidad
    // detrás del volcán.
    createRidge(-620, 130, 0x140c07, 1)
    createRidge(-470, 96, 0x1b110a, 0.95)

    /* --- El volcán --- */
    const CRATER = new THREE.Vector3(0, 52, -300)

    const coneGeo = new THREE.CylinderGeometry(
      30, 232, 100, isMobile ? 40 : 72, isMobile ? 6 : 12, true,
    )
    {
      // Ruido en los vértices: la ladera queda rugosa, no un cono perfecto.
      const pos = coneGeo.attributes.position
      const v = new THREE.Vector3()
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i)
        const ang = Math.atan2(v.z, v.x)
        const t = (v.y + 50) / 100 // 0 en la base, 1 en el cráter
        const ridge =
          Math.sin(ang * 7.0) * 5.5 +
          Math.sin(ang * 13.0 + 1.7) * 3.0 +
          Math.sin(ang * 23.0 + 0.4) * 1.6
        const k = 1 + (ridge / 232) * (1 - t * 0.75)
        pos.setX(i, v.x * k)
        pos.setZ(i, v.z * k)
      }
      coneGeo.computeVertexNormals()
    }

    const cone = new THREE.Mesh(
      coneGeo,
      new THREE.MeshStandardMaterial({
        color: 0x190f08,
        roughness: 0.94,
        metalness: 0.06,
        emissive: new THREE.Color(0x431a04),
        emissiveIntensity: 0.55,
        side: THREE.DoubleSide,
        flatShading: true,
      }),
    )
    cone.position.set(CRATER.x, CRATER.y - 50, CRATER.z)
    scene.add(cone)

    // Boca del cráter: disco incandescente + aro, ambos aditivos para que
    // el bloom los convierta en el foco de la escena.
    const craterGlow = new THREE.Mesh(
      new THREE.CircleGeometry(31, 40),
      new THREE.MeshBasicMaterial({
        color: 0xff7a1e,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    craterGlow.rotation.x = -Math.PI / 2
    craterGlow.position.copy(CRATER)
    scene.add(craterGlow)
    refs.craterGlow = craterGlow

    const craterRim = new THREE.Mesh(
      new THREE.TorusGeometry(31, 3.2, 8, 44),
      new THREE.MeshBasicMaterial({
        color: 0xffc063,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    craterRim.rotation.x = -Math.PI / 2
    craterRim.position.copy(CRATER)
    scene.add(craterRim)

    const craterLight = new THREE.PointLight(0xff5a1f, 1400, 700, 2)
    craterLight.position.set(CRATER.x, CRATER.y + 10, CRATER.z)
    scene.add(craterLight)
    refs.craterLight = craterLight
    refs.crater = CRATER

    /* --- Plancha --- */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900, 1, 1),
      new THREE.MeshStandardMaterial({
        color: 0x1a0d06,
        roughness: 0.55,
        metalness: 0.2,
        transparent: true,
        opacity: 0.9,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -48
    scene.add(floor)

    const grid = new THREE.GridHelper(900, 46, 0xff8a2b, 0x2e1608)
    grid.material.transparent = true
    grid.material.opacity = 0.12
    grid.position.y = -47.6
    scene.add(grid)

    /* --- Erupción: la comida sale disparada del cráter --- */
    // En móvil cargamos menos texturas (cada PNG pesa ~100 KB) y lanzamos
    // menos piezas por erupción.
    const ERUPT_SPRITES = isMobile
      ? [
          { src: '/img/sprites/wing2.png', size: 34, w: 4 },
          { src: '/img/sprites/wing3.png', size: 34, w: 4 },
          { src: '/img/sprites/boneless1.png', size: 21, w: 3 },
          { src: '/img/sprites/pizza1.png', size: 54, w: 1 },
        ]
      : [
          { src: '/img/sprites/wing2.png', size: 34, w: 5 },
          { src: '/img/sprites/wing3.png', size: 34, w: 5 },
          { src: '/img/sprites/wing.png', size: 36, w: 3 },
          { src: '/img/sprites/boneless1.png', size: 21, w: 3 },
          { src: '/img/sprites/boneless2.png', size: 22, w: 3 },
          { src: '/img/sprites/pizza1.png', size: 54, w: 1 },
          { src: '/img/sprites/pizza3.png', size: 55, w: 1 },
        ]

    const BURST = isMobile ? 14 : 30
    const POOL = Math.round(BURST * 2.2)
    const ERUPT_GRAVITY = 55

    const loader = new THREE.TextureLoader()
    const bag = []
    ERUPT_SPRITES.forEach((s, i) => {
      s.texture = loader.load(s.src, (t) => {
        t.colorSpace = THREE.SRGBColorSpace
        s.aspect = t.image ? t.image.height / t.image.width : 1.4
      })
      s.texture.colorSpace = THREE.SRGBColorSpace
      for (let k = 0; k < s.w; k++) bag.push(i)
    })

    const flying = []
    for (let i = 0; i < POOL; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ transparent: true, depthWrite: false, opacity: 0 }),
      )
      sprite.visible = false
      scene.add(sprite)
      flying.push({ sprite, active: false, vx: 0, vy: 0, vz: 0, life: 0, ttl: 0, size: 1 })
    }

    /** Lanza `count` piezas desde la boca del cráter en un cono hacia arriba. */
    const erupt = (count) => {
      let launched = 0
      for (const f of flying) {
        if (launched >= count) break
        if (f.active) continue

        const def = ERUPT_SPRITES[bag[(Math.random() * bag.length) | 0]]
        f.sprite.material.map = def.texture
        f.sprite.material.needsUpdate = true
        f.size = def.size * THREE.MathUtils.randFloat(0.78, 1.24)
        const aspect = def.aspect || 1.4
        f.sprite.scale.set(f.size, f.size * aspect, 1)

        // Salida desde la boca, con dispersión dentro del cráter.
        const r = Math.random() * 22
        const a0 = Math.random() * Math.PI * 2
        f.sprite.position.set(
          CRATER.x + Math.cos(a0) * r,
          CRATER.y + THREE.MathUtils.randFloat(-6, 6),
          CRATER.z + Math.sin(a0) * r,
        )

        // Cono de disparo: casi vertical, con inclinación aleatoria.
        const speed = THREE.MathUtils.randFloat(78, 132)
        const tilt = THREE.MathUtils.randFloat(0.1, 0.52)
        const dir = Math.random() * Math.PI * 2
        f.vx = Math.sin(tilt) * Math.cos(dir) * speed
        f.vz = Math.sin(tilt) * Math.sin(dir) * speed
        f.vy = Math.cos(tilt) * speed

        f.spin = THREE.MathUtils.randFloat(-2.6, 2.6)
        f.sprite.material.rotation = Math.random() * Math.PI * 2
        f.sprite.material.opacity = 0
        f.life = 0
        f.ttl = THREE.MathUtils.randFloat(5.5, 7.5)
        f.active = true
        f.sprite.visible = true
        launched++
      }
      // Fogonazo en el cráter al momento del disparo.
      refs.flash = 1

      // Continuidad con la capa 2D: lo que sale del volcán sigue cayendo por
      // el resto de la página. FallingFeast escucha este evento.
      if (launched) {
        window.dispatchEvent(
          new CustomEvent('alitas:erupcion', { detail: { count: launched } }),
        )
      }
    }
    refs.erupt = erupt
    refs.bigBurst = Math.round(BURST * 1.6)

    /** Avanza la parábola de cada pieza en vuelo. */
    const stepEruption = (dt) => {
      for (const f of flying) {
        if (!f.active) continue
        f.life += dt
        f.vy -= ERUPT_GRAVITY * dt
        const p = f.sprite.position
        p.x += f.vx * dt
        p.y += f.vy * dt
        p.z += f.vz * dt
        f.sprite.material.rotation += f.spin * dt

        // Entra con un fundido corto y se apaga al final del vuelo.
        const fadeIn = Math.min(1, f.life / 0.25)
        const fadeOut = Math.min(1, Math.max(0, (f.ttl - f.life) / 1.1))
        f.sprite.material.opacity = fadeIn * fadeOut

        if (f.life > f.ttl || p.y < -70) {
          f.active = false
          f.sprite.visible = false
          f.sprite.material.opacity = 0
        }
      }
    }
    refs.stepEruption = stepEruption

    /* --- Post-procesado (bloom para las brasas) --- */
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      isMobile ? 0.85 : 1.25, // strength
      0.72, // radius
      0.06, // threshold
    )
    composer.addPass(bloom)
    composer.setSize(window.innerWidth, window.innerHeight)
    refs.composer = composer
    refs.bloom = bloom

    refs.startTime = performance.now()
    setIsReady(true)

    /* --- Loop --- */
    const animate = () => {
      refs.animationId = requestAnimationFrame(animate)

      // Fuera de vista no gastamos GPU (el hero mide ~2-3 pantallas).
      if (!refs.visible) return

      const elapsed = (performance.now() - refs.startTime) / 1000
      // dt acotado: al volver de una pestaña oculta no queremos un salto.
      const dt = Math.min(0.05, elapsed - refs.lastElapsed)
      refs.lastElapsed = elapsed

      for (const layer of refs.embers) layer.material.uniforms.uTime.value = elapsed
      if (refs.smoke) refs.smoke.material.uniforms.uTime.value = elapsed
      // Parpadeo sutil, como brasa viva.
      if (refs.keyLight) refs.keyLight.intensity = 900 + Math.sin(elapsed * 3.1) * 90

      // Erupciones automáticas: el volcán truena solo cada pocos segundos.
      if (elapsed > refs.nextErupt) {
        erupt(BURST)
        refs.nextErupt = elapsed + THREE.MathUtils.randFloat(isMobile ? 5.5 : 4.2, isMobile ? 8 : 6.5)
      }
      stepEruption(dt)

      // Fogonazo del cráter: pico al disparar y decaimiento suave.
      refs.flash = Math.max(0, refs.flash - dt * 1.9)
      const flash = refs.flash * refs.flash
      if (refs.craterLight) refs.craterLight.intensity = 1400 + flash * 5200
      if (refs.craterGlow) {
        refs.craterGlow.material.opacity = 0.72 + flash * 0.28 + Math.sin(elapsed * 2.3) * 0.06
        const s = 1 + flash * 0.5
        refs.craterGlow.scale.set(s, s, 1)
      }

      const target = targetCameraPos.current
      const smooth = smoothCameraPos.current
      const ease = reduceMotion ? 1 : 0.055

      smooth.x += (target.x + pointer.current.x * 12 - smooth.x) * ease
      smooth.y += (target.y + pointer.current.y * 6 - smooth.y) * ease
      smooth.z += (target.z - smooth.z) * ease

      camera.position.set(smooth.x, smooth.y, smooth.z)
      camera.lookAt(0, smooth.y * 0.35 - 2, -260)

      composer.render()
    }
    animate()

    /* --- Pausa cuando el hero sale de pantalla --- */
    let io = null
    if (containerRef.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => { refs.visible = entry.isIntersecting }, {
        rootMargin: '10% 0px',
      })
      io.observe(containerRef.current)
    }

    /* --- Resize --- */
    let resizeTimer = null
    const applyResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      composer.setSize(w, h)
      bloom.setSize(w, h)
      for (const layer of refs.embers) {
        layer.material.uniforms.uPixelRatio.value = renderer.getPixelRatio()
      }
    }
    const handleResize = () => {
      // En móvil, ocultar/mostrar la barra del navegador dispara resize sin parar.
      if (resizeTimer) window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(applyResize, 120)
    }
    window.addEventListener('resize', handleResize)

    /* --- Parallax (solo puntero fino) --- */
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const handlePointerMove = (event) => {
      if (reduceMotion) return
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1)
    }
    if (fine) window.addEventListener('pointermove', handlePointerMove)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (fine) window.removeEventListener('pointermove', handlePointerMove)
      if (resizeTimer) window.clearTimeout(resizeTimer)
      io?.disconnect()
      if (refs.animationId !== null) cancelAnimationFrame(refs.animationId)

      scene.traverse((object) => {
        if (object.isMesh || object.isPoints) {
          object.geometry.dispose()
          const material = object.material
          if (Array.isArray(material)) material.forEach((m) => m.dispose())
          else material.dispose()
        } else if (object.isSprite) {
          // Los Sprite comparten geometría interna: sólo material propio.
          object.material.dispose()
        }
      })
      for (const s of ERUPT_SPRITES) s.texture?.dispose()
      composer.dispose()
      renderer.dispose()

      refs.embers = []
      refs.scene = null
      refs.camera = null
      refs.renderer = null
      refs.composer = null
    }
  }, [])

  /* ---------------------------------------------------------------- */
  /*  ScrollTrigger — recorrido de cámara                              */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!isReady) return
    const container = containerRef.current
    if (!container) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress

          // Interpolación por tramos entre waypoints.
          const path = threeRefs.current.camPath || CAMERA_PATH
          const scaled = progress * (path.length - 1)
          const from = Math.min(path.length - 2, Math.floor(scaled))
          const t = scaled - from
          const a = path[from]
          const b = path[from + 1]

          targetCameraPos.current = {
            x: THREE.MathUtils.lerp(a.x, b.x, t),
            y: THREE.MathUtils.lerp(a.y, b.y, t),
            z: THREE.MathUtils.lerp(a.z, b.z, t),
          }

          // El bloom crece al acercarse a la brasa.
          const refs = threeRefs.current
          if (refs.bloom) refs.bloom.strength = 1.05 + progress * 0.9
          if (refs.smoke) refs.smoke.material.uniforms.uIntensity.value = 0.42 + progress * 0.3

          // Erupción grande al cruzar la mitad del recorrido, una sola vez
          // por pasada (se rearma al volver hacia arriba).
          if (progress > 0.42 && !refs.bigErupted) {
            refs.bigErupted = true
            refs.erupt?.(refs.bigBurst || 0)
          } else if (progress < 0.3 && refs.bigErupted) {
            refs.bigErupted = false
          }
        },
      })

      // Es un desplazamiento grande: con reduced-motion se queda quieto.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const chapters = container.querySelectorAll('.content-section')
      chapters.forEach((section) => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 72%',
              end: 'bottom 28%',
              toggleActions: 'restart reverse restart reverse',
            },
            defaults: { ease: 'expo.out' },
          })
          .from(section.querySelectorAll('.section-round'), {
            opacity: 0,
            y: 14,
            filter: 'blur(6px)',
            duration: 0.6,
          })
          .from(
            section.querySelectorAll('.title-char'),
            { yPercent: 105, opacity: 0, filter: 'blur(10px)', duration: 0.9, stagger: 0.026 },
            0.05,
          )
          .from(
            section.querySelectorAll('.subtitle-line'),
            { opacity: 0, y: 12, filter: 'blur(6px)', duration: 0.7, stagger: 0.09 },
            0.3,
          )
      })

      // Parallax de salida del hero: el contenido sube y se desvanece.
      gsap.to(heroContentRef.current, {
        opacity: 0,
        y: -60,
        ease: 'none',
        scrollTrigger: { trigger: container, start: 'top top', end: '45% top', scrub: true },
      })
    }, container)

    return () => ctx.revert()
  }, [isReady])

  /* ---------------------------------------------------------------- */
  /*  Salvavidas: si la intro no corre (WebGL lento, error, etc.),     */
  /*  a los 2.5 s el contenido se muestra igual — nunca en blanco.     */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const t = window.setTimeout(() => heroContentRef.current?.classList.add('shown'), 2500)
    return () => window.clearTimeout(t)
  }, [])

  /* ---------------------------------------------------------------- */
  /*  Animación de entrada                                             */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!isReady) return
    const scope = heroContentRef.current
    if (!scope) return

    // GSAP no lee prefers-reduced-motion por su cuenta: sin animación de
    // entrada, el contenido simplemente aparece en su estado final.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scope.classList.add('shown')
      return
    }

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .from('.hero-title .title-char', {
          yPercent: 105,
          opacity: 0,
          filter: 'blur(10px)',
          duration: 1.1,
          stagger: 0.028,
        })
        .fromTo('.hero-eyebrow', { opacity: 0, y: 10, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7 }, 0.12)
        .fromTo('.subtitle-line', { opacity: 0, y: 12, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, stagger: 0.1 }, 0.45)
        .fromTo('.hero-actions', { opacity: 0, y: 14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 }, 0.66)
        .to('.hero-fine', { opacity: 1, duration: 0.7 }, 0.8)
        .fromTo('.hero-stats', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 }, 0.88)
        .to('.scroll-hint', { opacity: 1, duration: 0.7 }, 1)
    }, scope)

    return () => ctx.revert()
  }, [isReady])

  /* ---------------------------------------------------------------- */
  const renderTitle = (title, accentWord) =>
    title.split(' ').map((word, wordIndex) => (
      <span
        className={`title-word${word === accentWord ? ' title-word--accent' : ''}`}
        key={`${word}-${wordIndex}`}
      >
        {word.split('').map((char, charIndex) => (
          <span className="title-char" key={`${char}-${charIndex}`}>
            {char}
          </span>
        ))}
      </span>
    ))

  return (
    <div ref={containerRef} className={`hero-container${webglFailed ? ' no-webgl' : ''}`}>
      {/* Lienzo anclado: vive solo mientras dura la intro */}
      <div className="hero-sticky">
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
      </div>

      <div ref={heroContentRef} className="hero-content">
        <div className="hero-eyebrow">
          <Icon.Flame className="h-3.5 w-3.5" filled />
          Asador encendido · San Mateo Atenco & Metepec
        </div>

        <h1 className="hero-title" aria-label="Alitas Fogosas">
          {renderTitle('ALITAS FOGOSAS', 'FOGOSAS')}
        </h1>

        <div className="hero-subtitle">
          <p className="subtitle-line">Once salsas hechas en casa, de lo cremosito a la de los valientes.</p>
          <p className="subtitle-line">Alitas, boneless y costillas al fuego. Para llevar o a domicilio.</p>
        </div>

        <div className="hero-actions">
          <a
            className="hero-btn hero-btn--primary"
            href={waLink('Hola 👋 quiero hacer un pedido de Alitas Fogosas')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ordena por WhatsApp
            <span aria-hidden="true">→</span>
          </a>
          <a className="hero-btn hero-btn--ghost" href="#menu">
            Ver el menú
          </a>
        </div>

        <p className="hero-fine">
          Pide al <strong>729 142 9080</strong> o por Uber Eats. Tres sucursales.
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat__value">11</div>
            <div className="hero-stat__label">Salsas</div>
          </div>
          <div className="hero-stat__divider" />
          <div className="hero-stat">
            <div className="hero-stat__value">3</div>
            <div className="hero-stat__label">Sucursales</div>
          </div>
          <div className="hero-stat__divider" />
          <div className="hero-stat">
            <div className="hero-stat__value">100%</div>
            <div className="hero-stat__label">Fuego</div>
          </div>
        </div>

        <div className="scroll-hint">
          Baja y préndete
          <ChevronDown className="scroll-hint__bell h-[17px] w-[17px]" />
        </div>
      </div>

      {/* Capítulos que se recorren con el scroll */}
      <div className="scroll-sections">
        {sections.map((section) => (
          <section key={section.title} className="content-section">
            <div className="section-round">{section.round}</div>

            <h2 className="hero-title">{renderTitle(section.title, section.accent)}</h2>

            <div className="hero-subtitle">
              <p className="subtitle-line is-static">{section.line1}</p>
              <p className="subtitle-line is-static">{section.line2}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
