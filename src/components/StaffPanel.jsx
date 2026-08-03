/* ============================================================================
   PANEL DEL PERSONAL
   ----------------------------------------------------------------------------
   No hay router en el sitio: el panel se abre con el hash `#empleados`
   (alitasfogosas.com/#empleados). No está enlazado desde ningún lado.

   Login con Supabase Auth (correo + contraseña). Los usuarios se crean a mano
   en el panel de Supabase; el registro público debe quedar APAGADO.

   Dos cosas viven aquí:

   1. COMANDA — los pedidos del sitio caen en vivo. Marcar "Entregado" BORRA el
      pedido: el panel es una comanda de cocina, no un historial. Lo que nadie
      atendió se purga solo a las 12 horas (ver supabase/orders.sql).

   2. SUCURSALES — switch de "mucha demanda" y una nota opcional al cliente.

   La sesión se cierra sola tras un rato sin actividad: esta pantalla se queda
   abierta en una tablet de mostrador, a la vista de cualquiera que pase.

   ── SOBRE EL DISEÑO ────────────────────────────────────────────────────────
   Esto NO es el sitio. El sitio vende; esto se usa con las manos ocupadas, de
   pie, a metro y medio de distancia y con prisa. Por eso aquí no hay ni una
   sola de las florituras de la página pública:

   · Un solo acento, el naranja de fuego, y sólo para lo accionable: el botón
     principal, la pestaña activa y el pedido que nadie ha visto. El rojo queda
     reservado para lo que va mal (retraso, error, cupo lleno); si el rojo
     estuviera también en los botones dejaría de significar algo.
   · Nada de degradados en texto ni en botones, y nada de Anton en los datos:
     una tipografía de interfaz a un solo tamaño de lectura se escanea más
     rápido que una condensada con carácter.
   · El número del pedido y los minutos de espera mandan sobre todo lo demás.
     Son los dos datos con los que cocina decide qué sale primero.
   ============================================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon, Logo, lockScroll, unlockScroll } from './ui'
import { supabase, supabaseReady } from '../lib/supabase'
import { branches } from '../data'
import { useStatus } from '../store/status'
import { fetchOrdersStatus } from '../lib/orders'

/* ── Vocabulario de controles ────────────────────────────────────────────────
   Un solo repertorio para todo el panel: si el botón de guardar se ve distinto
   en dos pantallas, una de las dos está mal. */
const btnPrimary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-fire px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-[#ff8542] active:bg-[#e85c12] disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none'

const btnGhost =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold text-cream transition-colors duration-200 hover:border-fire/50 hover:bg-cream/5 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none'

const inputClass =
  'min-h-11 w-full rounded-xl border border-hairline bg-ink/60 px-3.5 text-sm text-cream transition-colors duration-200 placeholder:text-ash-dim hover:border-cream/20 focus:border-fire focus:outline-none motion-reduce:transition-none'

const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash'

/** La nota se le enseña al cliente en el banner: acotada para que un texto
    kilométrico no rompa la barra ni el aviso del carrito. */
export const NOTE_MAX = 80

/* ── Freno al fuerza bruta ───────────────────────────────────────────────────
   Supabase ya limita los intentos por IP del lado del servidor, pero eso no le
   dice nada a quien está sentado en la caja probando contraseñas. A partir del
   3er fallo bloqueamos el formulario un rato, y el castigo se duplica: 30s,
   1min, 2min… hasta 15 minutos. Se guarda en localStorage para que recargar la
   página no borre el castigo.

   Es una barrera para el troll de mostrador, no para un atacante decidido (el
   candado real vive en Supabase: contraseña, límites por IP y, si lo activas,
   captcha). El detalle está en SEGURIDAD.md. */
const LOCK_KEY = 'alitas-fogosas:intentos:v1'
const FREE_TRIES = 3
const BASE_LOCK = 30_000
const MAX_LOCK = 15 * 60_000

/* Copia en memoria del castigo. `localStorage` se puede vaciar desde las
   herramientas del navegador, y hacerlo reseteaba el contador a cero. La copia
   viva no se puede borrar sin recargar la pestaña, y al leer se toma SIEMPRE
   el castigo más alto de los dos. */
let memLock = { fails: 0, until: 0 }

function readLock() {
  let stored = { fails: 0, until: 0 }
  try {
    const raw = JSON.parse(localStorage.getItem(LOCK_KEY) || 'null')
    if (raw && typeof raw.fails === 'number') {
      stored = { fails: Math.min(20, raw.fails), until: Number(raw.until) || 0 }
    }
  } catch {
    /* modo privado: nos quedamos con lo que haya en memoria */
  }
  return {
    fails: Math.max(stored.fails, memLock.fails),
    until: Math.max(stored.until, memLock.until),
  }
}

function writeLock(v) {
  memLock = v
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(v))
  } catch {
    /* modo privado: nos quedamos con el bloqueo en memoria */
  }
}

/* Piso de tiempo por intento de entrada.

   Sin esto, el formulario contesta tan rápido como conteste la red, y eso
   permite probar contraseñas a máquina hasta toparse con los 3 intentos
   libres. Con un piso fijo, cada intento cuesta lo mismo —acierte o falle— y
   de paso se tapa una fuga sutil: si un correo que existe tardara distinto que
   uno que no, el tiempo de respuesta iría diciendo qué cuentas son reales. */
const MIN_ATTEMPT_MS = 700

/* Tope duro de sesión, corra o no corra el reloj de inactividad.

   El de inactividad se revive con cualquier toque, así que una tablet en el
   mostrador con gente pasando al lado puede mantener viva la misma sesión días
   enteros. Ocho horas es un turno: al cumplirse, se cierra aunque alguien haya
   estado tocando la pantalla todo el tiempo. */
const MAX_SESSION_MS = 8 * 60 * 60_000

const lockLabel = (ms) => {
  const s = Math.ceil(ms / 1000)
  return s >= 60 ? `${Math.ceil(s / 60)} min` : `${s} s`
}

/* ── Cierre de sesión por inactividad ────────────────────────────────────────
   El panel vive en una tablet en el mostrador. Si el turno termina y nadie
   cierra sesión, queda abierto con los datos de los clientes (nombres,
   direcciones en las notas) a la vista de quien pase.

   15 minutos sin tocar nada y se cierra. El último minuto avisa, para que a
   nadie se le caiga la sesión a media comanda: cualquier toque la revive. */
const IDLE_MS = 15 * 60_000
const WARN_MS = 60_000
const ACTIVITY = ['pointerdown', 'keydown', 'wheel', 'touchstart']

function useIdleLogout(active, onTimeout) {
  const [left, setLeft] = useState(IDLE_MS)
  const deadline = useRef(Date.now() + IDLE_MS)
  const fired = useRef(false)

  useEffect(() => {
    if (!active) return
    fired.current = false
    deadline.current = Date.now() + IDLE_MS
    setLeft(IDLE_MS)

    const bump = () => {
      // Ya se cerró: un toque tardío no debe resucitar el contador.
      if (fired.current) return
      deadline.current = Date.now() + IDLE_MS
    }
    for (const ev of ACTIVITY) window.addEventListener(ev, bump, { passive: true })

    // Un segundo basta: el aviso se cuenta en minutos, no en milésimas.
    const t = setInterval(() => {
      const ms = deadline.current - Date.now()
      setLeft(ms)
      if (ms <= 0 && !fired.current) {
        fired.current = true
        onTimeout()
      }
    }, 1000)

    return () => {
      for (const ev of ACTIVITY) window.removeEventListener(ev, bump)
      clearInterval(t)
    }
  }, [active, onTimeout])

  return { left, warning: active && left <= WARN_MS && left > 0 }
}

/** Ventana para deshacer un "Entregado" antes de que el borrado sea real. */
const UNDO_MS = 8000

/* ── Comanda ─────────────────────────────────────────────────────────────────
   Carga los pedidos abiertos y se queda escuchando: si dos personas tienen el
   panel abierto, el que uno entrega desaparece de la pantalla del otro. */
function useOrders(session) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [quota, setQuota] = useState(null)

  const load = useCallback(async () => {
    /* Primero la purga: lo de anoche no debe recibir a nadie en la mañana.

       El `try` no es decorativo. El constructor de consultas de Supabase es un
       "thenable", no una promesa: tiene `.then` pero NO tiene `.catch`, así que
       el `.catch(() => {})` que estaba aquí reventaba con un TypeError antes de
       llegar a cargar nada — y como el error salía de `load()`, el panel se
       quedaba clavado en el esqueleto de carga con la comanda del turno
       adentro. Si la purga falla no pasa nada: es mantenimiento, y el listado
       de abajo es lo que importa. */
    try {
      await supabase.rpc('purge_old_orders')
    } catch {
      /* la purga es mantenimiento: que falle no debe frenar la comanda */
    }
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) setErr(`No se pudieron cargar los pedidos: ${error.message}`)
    else setOrders(data || [])
    setLoading(false)
    fetchOrdersStatus().then((q) => q && setQuota(q))
  }, [])

  useEffect(() => {
    if (!session) return
    let alive = true
    load()

    const channel = supabase
      .channel('orders_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (!alive) return
        setOrders((prev) => {
          if (payload.eventType === 'DELETE') {
            return prev.filter((o) => o.id !== payload.old?.id)
          }
          const row = payload.new
          if (!row?.id) return prev
          const without = prev.filter((o) => o.id !== row.id)
          return [...without, row].sort((a, b) => a.created_at.localeCompare(b.created_at))
        })
        if (payload.eventType === 'INSERT') fetchOrdersStatus().then((q) => q && setQuota(q))
      })
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [session, load])

  /* ── Entregado = borrado ───────────────────────────────────────────────────
     Un toque y el pedido desaparece del panel. El borrado en la base se retrasa
     unos segundos y en ese hueco se puede deshacer: en cocina se toca con
     prisa y con las manos ocupadas, y un dedazo no debe costar el pedido.
     Pasada la ventana no hay papelera — la copia real es el WhatsApp. */
  const pending = useRef(new Map())
  // Espejo del mapa para pintar la barra de deshacer (un ref no re-renderiza).
  const [closing, setClosing] = useState([])

  const flush = useCallback(async (id) => {
    const job = pending.current.get(id)
    if (!job) return
    clearTimeout(job.timer)
    pending.current.delete(id)
    setClosing((prev) => prev.filter((c) => c.id !== id))
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) {
      setErr(`No se pudo cerrar el pedido #${job.row.daily_no}: ${error.message}`)
      load()
    }
  }, [load])

  /* El temporizador se arma FUERA del updater de estado: los updaters tienen
     que ser puros y en StrictMode corren dos veces, lo que dejaba dos relojes
     por pedido. */
  /* `kind` distingue entregado de cancelado. El camino es el mismo a propósito:
     los dos sacan el pedido de la comanda y los dos se pueden deshacer en la
     misma ventana de 8 segundos. Cambiar de mecanismo según el botón obligaría
     a cocina a aprender dos formas de arrepentirse. */
  const finish = useCallback(
    (id, kind = 'entregado') => {
      const row = orders.find((o) => o.id === id)
      if (!row) return
      const timer = setTimeout(() => flush(id), UNDO_MS)
      pending.current.set(id, { row, timer })
      setClosing((c) => [...c.filter((x) => x.id !== id), { id, no: row.daily_no, kind }])
      setOrders((prev) => prev.filter((o) => o.id !== id))
    },
    [orders, flush],
  )

  const undo = useCallback((id) => {
    const job = pending.current.get(id)
    if (!job) return
    clearTimeout(job.timer)
    pending.current.delete(id)
    setClosing((prev) => prev.filter((c) => c.id !== id))
    setOrders((prev) =>
      [...prev.filter((o) => o.id !== id), job.row].sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      ),
    )
  }, [])

  /* Si se cierra el panel o se cae la sesión con borrados en vuelo, se
     ejecutan ya: dejarlos colgando revive el pedido en la próxima carga y en
     cocina creerían que volvió a entrar. */
  useEffect(() => {
    return () => {
      for (const id of [...pending.current.keys()]) flush(id)
    }
  }, [flush])

  /** "Ya lo vi": lo saca de la lista de nuevos sin borrarlo todavía. */
  const acknowledge = useCallback(
    async (id) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, seen: true } : o)))
      await supabase
        .from('orders')
        .update({ seen: true, seen_by: session?.user?.email ?? null, seen_at: new Date().toISOString() })
        .eq('id', id)
    },
    [session],
  )

  return { orders, loading, err, quota, finish, undo, closing, acknowledge, reload: load }
}

const money = (n) => `$${Number(n || 0).toLocaleString('es-MX')}`

const clock = (iso) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

/** Minutos que lleva esperando el pedido: es el dato que ordena la cocina. */
function waitedMin(iso) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
}

/* ── Etiqueta ────────────────────────────────────────────────────────────────
   Tres tonos y ni uno más: `fire` = novedad, `alert` = algo va mal, `mute` = un
   dato del pedido que sólo hay que poder leer.

   Ninguno va en naranja sólido: ese relleno es del botón que se toca. Una
   etiqueta con el mismo peso visual que "Entregado" invita a picarle. */
function Chip({ tone = 'mute', children }) {
  const tones = {
    fire: 'bg-fire/15 text-fire ring-1 ring-inset ring-fire/45',
    alert: 'bg-crimson/20 text-crimson ring-1 ring-inset ring-crimson/40',
    mute: 'bg-cream/8 text-ash ring-1 ring-inset ring-hairline',
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

/* ── Tarjeta de pedido ───────────────────────────────────────────────────────
   La jerarquía está puesta para leerse a metro y medio y de reojo: primero el
   número, luego cuánto lleva esperando. Todo lo demás es letra chica hasta que
   alguien se acerca a prepararlo. */
function OrderCard({ o, onFinish, onCancel, onAck }) {
  const branch = branches.find((b) => b.slug === o.branch_slug)
  const waited = waitedMin(o.created_at)
  // Pasados 25 min el pedido se marca: en hora pico es lo único que se ve.
  const late = waited >= 25
  const items = Array.isArray(o.items) ? o.items : []

  return (
    <li
      className={`flex flex-col rounded-2xl border p-5 transition-colors duration-200 motion-reduce:transition-none ${
        o.seen ? 'border-hairline bg-surface' : 'border-fire/45 bg-fire/[0.07]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-bold leading-none tabular-nums text-cream">#{o.daily_no}</p>
          <p className="mt-2 truncate text-sm text-ash">
            {o.customer || 'Sin nombre'} · {branch?.name.replace('Sucursal ', '') || o.branch_slug}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xl font-semibold tabular-nums text-cream">
            {o.open_price && (
              <span className="mr-1 text-xs font-normal text-ash-dim">desde</span>
            )}
            {money(o.total)}
          </p>
          <p
            className={`mt-1 text-xs tabular-nums ${
              late ? 'font-semibold text-crimson' : 'text-ash-dim'
            }`}
          >
            {waited} min · {clock(o.created_at)}
          </p>
        </div>
      </div>

      {(!o.seen || late || o.mode === 'domicilio') && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {!o.seen && <Chip tone="fire">Nuevo</Chip>}
          {late && <Chip tone="alert">Retrasado</Chip>}
          {o.mode === 'domicilio' && <Chip>A domicilio</Chip>}
        </div>
      )}

      <ul className="mt-4 space-y-2.5 border-t border-hairline pt-4">
        {items.map((it, i) => (
          <li key={i}>
            <p className="text-[0.95rem] font-semibold text-cream">
              <span className="tabular-nums">{it.qty}×</span> {it.name}
            </p>
            {it.sauces?.length > 0 && (
              <p className="mt-0.5 text-xs">
                {/* Lo primero que pregunta cocina. Va resaltado, no en gris. */}
                <span className="font-semibold text-fire">Salsas:</span>{' '}
                <span className="text-cream">{it.sauces.join(' · ')}</span>
              </p>
            )}
          </li>
        ))}
      </ul>

      {o.notes && (
        <p className="mt-4 rounded-xl bg-cream/6 p-3 text-sm text-cream ring-1 ring-inset ring-hairline">
          <span className="font-semibold text-fire">Notas:</span> {o.notes}
        </p>
      )}

      <p className="mt-3 text-xs text-ash-dim">Pago: {o.payment || 'por confirmar'}</p>

      {/* `mt-auto`: con tarjetas de distinto alto en la misma fila, los botones
          quedan alineados abajo y el pulgar los encuentra en el mismo sitio. */}
      <div className="mt-auto pt-4">
        <div className="flex gap-2">
          {!o.seen && (
            <button onClick={() => onAck(o.id)} className={`${btnGhost} flex-1`}>
              En preparación
            </button>
          )}
          {/* Un solo toque. La red de seguridad es la barra de deshacer, no un
              "¿estás seguro?" que se contesta en automático a la tercera vez. */}
          <button onClick={() => onFinish(o.id)} className={`${btnPrimary} flex-1`}>
            <Icon.Check className="h-4 w-4" /> Entregado
          </button>
        </div>

        {/* Cancelar va aparte y en voz baja: es el único botón de la tarjeta
            que deja al cliente sin comida, y no debe caer bajo el pulgar que
            venía a marcar "Entregado". El rojo sólo aparece al tocarlo. */}
        <button
          onClick={() => onCancel(o.id)}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full text-sm font-semibold text-ash-dim transition-colors duration-200 hover:bg-crimson/10 hover:text-crimson motion-reduce:transition-none"
        >
          <Icon.Close className="h-4 w-4" /> Cancelar pedido
        </button>
      </div>
    </li>
  )
}

/** Esqueleto con la forma real de la tarjeta: la comanda no da un salto de
    maquetación cuando llegan los pedidos. */
function OrdersSkeleton() {
  return (
    <ul aria-hidden="true" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className="animate-pulse rounded-2xl border border-hairline bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="h-8 w-20 rounded-lg bg-cream/10" />
            <div className="h-6 w-16 rounded-lg bg-cream/10" />
          </div>
          <div className="mt-3 h-3.5 w-2/3 rounded bg-cream/8" />
          <div className="mt-6 space-y-2.5 border-t border-hairline pt-4">
            <div className="h-3.5 w-4/5 rounded bg-cream/8" />
            <div className="h-3.5 w-3/5 rounded bg-cream/8" />
          </div>
          <div className="mt-6 h-11 rounded-full bg-cream/8" />
        </li>
      ))}
    </ul>
  )
}

function useHashRoute(target) {
  const [on, setOn] = useState(
    () => typeof window !== 'undefined' && window.location.hash === target,
  )
  useEffect(() => {
    const onHash = () => setOn(window.location.hash === target)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [target])
  return [on, () => { window.location.hash = '' }]
}

export default function StaffPanel() {
  const [open, close] = useHashRoute('#empleados')
  const { status, applyRows } = useStatus()

  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [savingSlug, setSavingSlug] = useState(null)
  const [notes, setNotes] = useState({})
  const [lock, setLock] = useState(readLock)
  const [now, setNow] = useState(() => Date.now())
  const [tab, setTab] = useState('pedidos')
  // '' | 'inactividad' | 'turno' — por qué se cerró la sesión sola.
  const [timedOut, setTimedOut] = useState('')

  const lockLeft = Math.max(0, lock.until - now)

  const {
    orders,
    loading: loadingOrders,
    err: ordersErr,
    quota,
    finish,
    undo,
    closing,
    acknowledge,
  } = useOrders(open && session ? session : null)

  // La cuenta corre sólo con el panel abierto y sesión activa: no tiene caso
  // vigilar la inactividad de alguien que ni siquiera entró.
  const onIdle = useCallback(() => {
    setTimedOut('inactividad')
    supabase?.auth.signOut()
  }, [])
  const idle = useIdleLogout(Boolean(open && session), onIdle)

  // Al volver a entrar, el aviso de "te sacamos" ya no aplica.
  useEffect(() => {
    if (session) setTimedOut('')
  }, [session])

  /* Tope de turno. Se cuenta desde que la persona entró (`last_sign_in_at`),
     no desde que se abrió el panel: recargar la página no debe regalar ocho
     horas nuevas. Corre aunque el panel esté cerrado. */
  useEffect(() => {
    if (!session) return
    const start = Date.parse(session.user?.last_sign_in_at ?? '') || Date.now()
    const left = start + MAX_SESSION_MS - Date.now()
    const end = () => {
      setTimedOut('turno')
      supabase.auth.signOut()
    }
    if (left <= 0) {
      end()
      return
    }
    const t = setTimeout(end, left)
    return () => clearTimeout(t)
  }, [session])

  const nuevos = useMemo(() => orders.filter((o) => !o.seen).length, [orders])

  /* "Hace 12 min" se calcula al pintar. Sin este tic, un panel sin movimiento
     se queda con la hora del último evento y en cocina creen que el pedido
     acaba de entrar. Medio minuto basta para un dato que se lee en minutos. */
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!open || !session || tab !== 'pedidos') return
    const t = setInterval(() => setTick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [open, session, tab])

  // Sólo corre el reloj mientras haya castigo pendiente.
  useEffect(() => {
    if (lockLeft <= 0) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [lockLeft > 0])

  const registerFailure = useCallback(() => {
    setLock((prev) => {
      const fails = prev.fails + 1
      const over = fails - FREE_TRIES
      const next =
        over >= 0
          ? { fails, until: Date.now() + Math.min(MAX_LOCK, BASE_LOCK * 2 ** over) }
          : { fails, until: 0 }
      writeLock(next)
      return next
    })
    setNow(Date.now())
  }, [])

  const clearFailures = useCallback(() => {
    const fresh = { fails: 0, until: 0 }
    writeLock(fresh)
    setLock(fresh)
  }, [])

  useEffect(() => {
    if (!open) return
    lockScroll()
    return () => unlockScroll()
  }, [open])

  useEffect(() => {
    if (!supabaseReady) {
      setChecking(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Precarga las notas existentes en los campos de texto.
  useEffect(() => {
    setNotes((prev) => {
      const next = { ...prev }
      for (const b of branches) if (next[b.slug] === undefined) next[b.slug] = status[b.slug]?.note || ''
      return next
    })
  }, [status])

  const signIn = async (e) => {
    e.preventDefault()
    if (lockLeft > 0 || busy) return
    setError('')
    setBusy(true)
    const started = Date.now()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    // El piso de tiempo se aplica acierte o falle: ver MIN_ATTEMPT_MS.
    const rest = MIN_ATTEMPT_MS - (Date.now() - started)
    if (rest > 0) await new Promise((r) => setTimeout(r, rest))
    if (err) {
      // Mensaje deliberadamente vago: decir "ese correo no existe" le regala
      // al que prueba a ciegas la mitad del trabajo.
      setError('No pudimos entrar. Revisa el correo y la contraseña.')
      setPassword('')
      registerFailure()
    } else {
      clearFailures()
    }
    setBusy(false)
  }

  const setDemand = useCallback(
    async (slug, high) => {
      setSavingSlug(slug)
      setError('')
      const payload = {
        high_demand: high,
        note: (notes[slug] || '').trim().slice(0, NOTE_MAX) || null,
        updated_by: session?.user?.email ?? null,
      }
      const { data, error: err } = await supabase
        .from('branch_status')
        .update(payload)
        .eq('slug', slug)
        .select()
      if (err) setError(`No se pudo guardar: ${err.message}`)
      else if (data?.length) applyRows(data)
      setSavingSlug(null)
    },
    [notes, session, applyRows],
  )

  if (!open) return null

  const signedIn = supabaseReady && !checking && Boolean(session)

  return (
    <div
      data-lenis-prevent
      className="staff fixed inset-0 z-[90] overflow-y-auto overscroll-contain bg-ink font-body"
    >
      {/* ── Barra fija ──────────────────────────────────────────────────────
          Pegada arriba a propósito: la comanda de una hora pico mide varias
          pantallas y en una tablet de mostrador no se puede perder el acceso
          a las pestañas ni a "Salir" por haber bajado a ver un pedido. */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-ink-2/95 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo showText={false} />
            {/* El título es el único Anton del panel: un guiño de marca del
                tamaño de una etiqueta, no un titular. */}
            <h1 className="truncate text-sm tracking-[0.16em] text-cream">Panel de empleados</h1>
          </div>

          {/* En un teléfono la palabra "Salir" se lleva el ancho que necesita
              el título, y el icono con `aria-label` dice exactamente lo mismo. */}
          <button onClick={close} className={`${btnGhost} shrink-0 px-4 sm:px-5`}>
            <Icon.Close className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Salir</span>
          </button>
        </div>

        {/* Las pestañas viven en la barra, no en el cuerpo: son navegación, y
            la navegación no se va con el scroll. La sesión viaja en el mismo
            renglón y baja sola cuando no cabe — antes se escondía por debajo de
            `sm` y en un teléfono no había manera de cerrar sesión. */}
        {signedIn && (
          <div className="shell flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-3">
            <div className="flex gap-2">
              {[
                ['pedidos', 'Pedidos', nuevos],
                ['sucursales', 'Sucursales', 0],
              ].map(([id, text, count]) => {
                const on = tab === id
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    aria-pressed={on}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors duration-200 motion-reduce:transition-none ${
                      on ? 'bg-fire text-ink' : 'text-ash hover:bg-cream/5 hover:text-cream'
                    }`}
                  >
                    {text}
                    {count > 0 && (
                      <span
                        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums ${
                          on ? 'bg-ink/25 text-ink' : 'bg-fire text-ink'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Cerrar sesión no es letra chica: el panel vive en una tablet de
                mostrador con los datos de los clientes en pantalla, y salir de
                ahí tiene que ser tan fácil de tocar como cambiar de pestaña. */}
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden truncate text-xs text-ash-dim sm:inline">
                {session.user.email}
              </span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-hairline px-4 text-sm font-semibold text-ash transition-colors duration-200 hover:border-fire/50 hover:bg-cream/5 hover:text-cream motion-reduce:transition-none"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="shell py-8">
        {!supabaseReady ? (
          <div className="mx-auto max-w-2xl rounded-2xl bg-surface p-6 ring-1 ring-inset ring-fire/30">
            <p className="text-lg font-semibold text-cream">Falta conectar Supabase</p>
            <p className="mt-2 text-sm leading-relaxed text-ash">
              Pon <code className="text-fire">VITE_SUPABASE_URL</code> y{' '}
              <code className="text-fire">VITE_SUPABASE_ANON_KEY</code> en tu{' '}
              <code className="text-fire">.env.local</code> (y en Vercel), y corre el SQL de{' '}
              <code className="text-fire">supabase/schema.sql</code>. Mientras tanto el sitio
              funciona normal y el modo demanda queda apagado.
            </p>
          </div>
        ) : checking ? (
          <p className="text-ash">Cargando…</p>
        ) : !session ? (
          /* Entrada centrada: es la única pantalla del panel con una sola cosa
             que hacer, y centrarla evita que el ojo la busque en la esquina. */
          <form onSubmit={signIn} className="mx-auto mt-8 max-w-sm sm:mt-16">
            <div className="rounded-2xl bg-surface p-6 ring-1 ring-inset ring-hairline">
              {timedOut ? (
                <p
                  role="status"
                  className="mb-5 rounded-xl bg-fire/10 p-3 text-sm leading-relaxed text-cream ring-1 ring-inset ring-fire/35"
                >
                  {timedOut === 'turno'
                    ? `Cerramos la sesión: llevaba ${MAX_SESSION_MS / 3_600_000} horas abierta. Vuelve a entrar para seguir con la comanda.`
                    : `Cerramos la sesión por inactividad (${IDLE_MS / 60_000} min). Vuelve a entrar para ver los pedidos.`}
                </p>
              ) : (
                <p className="mb-5 text-sm text-ash">Entra con tu cuenta de empleado.</p>
              )}

              <div className="space-y-4">
                <label className="block">
                  <span className={label}>Correo</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    autoComplete="username"
                  />
                </label>
                <label className="block">
                  <span className={label}>Contraseña</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    autoComplete="current-password"
                  />
                </label>
              </div>

              {error && (
                <p role="alert" className="mt-4 text-sm font-semibold text-crimson">
                  {error}
                </p>
              )}
              {lockLeft > 0 && (
                <p role="alert" className="mt-4 text-sm text-crimson">
                  Demasiados intentos fallidos. Espera {lockLabel(lockLeft)} para volver a
                  probar.
                </p>
              )}

              <button
                type="submit"
                disabled={busy || lockLeft > 0}
                className={`${btnPrimary} mt-6 min-h-12 w-full`}
              >
                {lockLeft > 0 ? `Bloqueado ${lockLabel(lockLeft)}` : busy ? 'Entrando…' : 'Entrar'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* El aviso es fijo y ocupa lugar: si se cae la sesión a media
                comanda, el pedido en pantalla se pierde de vista. */}
            {idle.warning && (
              <div
                role="alert"
                className="swap-in mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-fire/10 p-3 ring-1 ring-inset ring-fire/40"
              >
                <p className="text-sm text-cream">
                  Vamos a cerrar la sesión en{' '}
                  <span className="font-semibold tabular-nums">
                    {Math.ceil(idle.left / 1000)} s
                  </span>{' '}
                  por inactividad.
                </p>
                {/* El botón no hace nada por sí mismo: el `pointerdown` que
                    genera al tocarlo es justo la señal que revive el contador.
                    Existe para que haya algo evidente que tocar en vez de
                    tener que adivinar que sirve picarle a cualquier lado. */}
                <button type="button" className={`${btnGhost} min-h-11`}>
                  Sigo aquí
                </button>
              </div>
            )}

            {error && (
              <p role="alert" className="mb-5 text-sm font-semibold text-crimson">
                {error}
              </p>
            )}

            {tab === 'pedidos' ? (
              <>
                {/* El contador diario ya no vive aquí: el número exacto no
                    cambia lo que hace cocina. Lo único que sí lo cambia es
                    haber llegado al tope, y eso sale como alerta. */}
                {quota && quota.remaining <= 0 && (
                  <p
                    role="alert"
                    className="mb-5 rounded-xl bg-crimson/12 p-3 text-sm text-cream ring-1 ring-inset ring-crimson/40"
                  >
                    <span className="font-semibold text-crimson">Cupo lleno.</span> El sitio dejó
                    de aceptar pedidos por hoy; vuelve a abrir mañana.
                  </p>
                )}

                {ordersErr && (
                  <p role="alert" className="mb-5 text-sm font-semibold text-crimson">
                    {ordersErr}
                  </p>
                )}

                {loadingOrders ? (
                  <>
                    <p className="sr-only" role="status">
                      Cargando pedidos…
                    </p>
                    <OrdersSkeleton />
                  </>
                ) : orders.length === 0 ? (
                  <div className="mx-auto mt-6 max-w-md rounded-2xl bg-surface p-10 text-center ring-1 ring-inset ring-hairline sm:mt-12">
                    <Icon.Flame className="mx-auto h-8 w-8 text-fire" filled />
                    <p className="mt-4 text-lg font-semibold text-cream">Todo al día</p>
                    <p className="mt-2 text-sm leading-relaxed text-ash">
                      No hay pedidos abiertos. Los que entren por el sitio aparecen aquí solos,
                      sin recargar, y se marcan como <span className="text-cream">Nuevo</span>{' '}
                      hasta que alguien los ponga en preparación.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-ash">
                      <span className="font-semibold text-cream tabular-nums">{orders.length}</span>{' '}
                      {orders.length === 1 ? 'pedido abierto' : 'pedidos abiertos'}
                      {nuevos > 0 && (
                        <>
                          {' · '}
                          <span className="font-semibold text-fire tabular-nums">{nuevos}</span> sin
                          ver
                        </>
                      )}
                    </p>
                    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {orders.map((o) => (
                        <OrderCard
                          key={o.id}
                          o={o}
                          onFinish={finish}
                          onCancel={(id) => finish(id, 'cancelado')}
                          onAck={acknowledge}
                        />
                      ))}
                    </ul>
                  </>
                )}

                {/* Barra de deshacer: flota abajo, encima de la comanda, para
                    que se alcance sin buscar la tarjeta que acaba de irse. La
                    línea que se vacía es el único movimiento decorativo que se
                    permite el panel, y no es decorativo: es el tiempo que
                    queda para arrepentirse, dibujado. */}
                {closing.length > 0 && (
                  <div
                    role="status"
                    className="rise-in fixed inset-x-0 bottom-0 z-30 flex justify-center px-5"
                    style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
                  >
                    <div className="max-w-full overflow-hidden rounded-2xl bg-ink-2 shadow-[0_18px_45px_-12px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-hairline">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                        <p className="text-sm text-cream">
                          {closing.length === 1
                            ? `Pedido #${closing[0].no} ${closing[0].kind}`
                            : `${closing.length} pedidos cerrados`}
                        </p>
                        <button
                          onClick={() => undo(closing[closing.length - 1].id)}
                          className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-fire transition-colors duration-200 hover:bg-fire/10 motion-reduce:transition-none"
                        >
                          Deshacer
                        </button>
                      </div>
                      <div
                        aria-hidden="true"
                        key={closing[closing.length - 1].id}
                        className="undo-drain h-0.5 bg-fire"
                        style={{ '--undo': `${UNDO_MS}ms` }}
                      />
                    </div>
                  </div>
                )}

                <p className="mt-10 max-w-2xl text-sm leading-relaxed text-ash-dim">
                  Al marcar <strong className="font-semibold text-ash">Entregado</strong> el pedido
                  se borra de aquí: este panel es la comanda del turno, no un historial. Tienes{' '}
                  {UNDO_MS / 1000} segundos para deshacerlo; después ya no se puede recuperar. Lo
                  que nadie cierre se borra solo a las 12 horas. La copia siempre queda en el
                  WhatsApp del negocio.
                </p>
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  {branches.map((b) => {
                    const high = status[b.slug]?.high_demand
                    const saving = savingSlug === b.slug
                    return (
                      <div
                        key={b.slug}
                        className={`flex flex-col rounded-2xl border p-5 transition-colors duration-200 motion-reduce:transition-none ${
                          high ? 'border-crimson/45 bg-crimson/[0.08]' : 'border-hairline bg-surface'
                        }`}
                      >
                        {/* `font-body` + `normal-case`: el sitio pone Anton en
                            todos los h1–h3, y una condensada en versalitas es
                            justo lo que no se quiere leer de reojo. */}
                        <h2 className="font-body text-base font-semibold normal-case tracking-normal text-cream">
                          {b.name}
                        </h2>
                        <p className="mt-1 text-xs text-ash-dim">{b.city}</p>

                        <div className="mt-4">
                          {high ? (
                            <Chip tone="alert">
                              <Icon.Flame className="h-3 w-3" filled /> Mucha demanda
                            </Chip>
                          ) : (
                            <Chip>Operando normal</Chip>
                          )}
                        </div>

                        <label className="mt-5 block">
                          <span className={label}>Nota al cliente</span>
                          <input
                            value={notes[b.slug] ?? ''}
                            onChange={(e) =>
                              setNotes((n) => ({ ...n, [b.slug]: e.target.value.slice(0, NOTE_MAX) }))
                            }
                            maxLength={NOTE_MAX}
                            className={inputClass}
                            placeholder="Ej. 45 min de espera"
                          />
                        </label>

                        <button
                          onClick={() => setDemand(b.slug, !high)}
                          disabled={saving}
                          className={`${high ? btnGhost : btnPrimary} mt-5 w-full`}
                        >
                          {saving ? 'Guardando…' : high ? 'Volver a normal' : 'Marcar mucha demanda'}
                        </button>
                      </div>
                    )
                  })}
                </div>

                <p className="mt-10 max-w-2xl text-sm leading-relaxed text-ash-dim">
                  Al marcar una sucursal con mucha demanda, el sitio deja de empujar el pedido por
                  WhatsApp para esa sucursal y manda al cliente a su Uber Eats. El cambio se ve al
                  instante en los navegadores que ya tengan la página abierta.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
