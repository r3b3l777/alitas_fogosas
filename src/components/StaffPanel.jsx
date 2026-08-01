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
   ============================================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon, lockScroll, unlockScroll } from './ui'
import { supabase, supabaseReady } from '../lib/supabase'
import { branches } from '../data'
import { useStatus } from '../store/status'
import { DAILY_LIMIT, fetchOrdersStatus } from '../lib/orders'

const inputClass =
  'min-h-12 w-full rounded-xl border border-hairline bg-ink/60 px-4 text-cream placeholder:text-ash-dim focus:border-fire focus:outline-none'

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

function readLock() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCK_KEY) || 'null')
    if (!raw || typeof raw.fails !== 'number') return { fails: 0, until: 0 }
    return { fails: Math.min(20, raw.fails), until: Number(raw.until) || 0 }
  } catch {
    return { fails: 0, until: 0 }
  }
}

function writeLock(v) {
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(v))
  } catch {
    /* modo privado: nos quedamos con el bloqueo en memoria */
  }
}

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
    // Primero la purga: lo de anoche no debe recibir a nadie en la mañana.
    await supabase.rpc('purge_old_orders').catch(() => {})
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
  const finish = useCallback(
    (id) => {
      const row = orders.find((o) => o.id === id)
      if (!row) return
      const timer = setTimeout(() => flush(id), UNDO_MS)
      pending.current.set(id, { row, timer })
      setClosing((c) => [...c.filter((x) => x.id !== id), { id, no: row.daily_no }])
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

function OrderCard({ o, onFinish, onAck }) {
  const branch = branches.find((b) => b.slug === o.branch_slug)
  const waited = waitedMin(o.created_at)
  // Pasados 25 min el renglón se pinta: en hora pico es lo único que se ve.
  const late = waited >= 25

  return (
    <li
      className={`rounded-2xl border p-5 transition-colors ${
        o.seen ? 'border-hairline bg-surface' : 'border-fire/45 bg-fire/[0.07]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-display text-2xl text-cream">
            #{o.daily_no}
            {!o.seen && (
              <span className="rounded-full bg-fire/20 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-fire">
                Nuevo
              </span>
            )}
            {o.mode === 'domicilio' && (
              <span className="rounded-full bg-magenta/20 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-magenta">
                A domicilio
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-ash">
            {o.customer || 'Sin nombre'} · {branch?.name.replace('Sucursal ', '') || o.branch_slug}
          </p>
          <p className={`mt-0.5 text-xs ${late ? 'font-semibold text-crimson' : 'text-ash-dim'}`}>
            {clock(o.created_at)} · hace {waited} min
          </p>
        </div>
        <p className="shrink-0 font-display text-2xl tabular-nums text-fire-gradient">
          {o.open_price && <span className="mr-1 text-sm font-normal text-ash-dim">desde</span>}
          {money(o.total)}
        </p>
      </div>

      <ul className="mt-4 space-y-2 border-t border-hairline pt-4">
        {(Array.isArray(o.items) ? o.items : []).map((it, i) => (
          <li key={i} className="text-sm">
            <span className="font-display text-base text-cream">
              {it.qty}× {it.name}
            </span>
            {it.sauces?.length > 0 && (
              <span className="mt-0.5 block text-xs">
                {/* Lo primero que pregunta cocina. Va resaltado, no en gris. */}
                <span className="font-semibold text-fire">Salsas:</span>{' '}
                <span className="text-cream">{it.sauces.join(' · ')}</span>
              </span>
            )}
          </li>
        ))}
      </ul>

      {o.notes && (
        <p className="mt-4 rounded-xl border border-gold/25 bg-gold/10 p-3 text-sm text-cream">
          <span className="font-semibold text-gold">Notas:</span> {o.notes}
        </p>
      )}

      <p className="mt-3 text-xs text-ash-dim">Pago: {o.payment || 'por confirmar'}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {!o.seen && (
          <button
            onClick={() => onAck(o.id)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-hairline px-4 text-sm font-semibold text-cream transition-colors hover:border-fire/50"
          >
            En preparación
          </button>
        )}
        {/* Un solo toque. La red de seguridad es la barra de deshacer, no un
            "¿estás seguro?" que se contesta en automático a la tercera vez. */}
        <button
          onClick={() => onFinish(o.id)}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-crimson to-fire px-4 text-sm font-bold text-white transition-transform duration-200 active:scale-95"
        >
          <Icon.Check className="h-4 w-4" /> Entregado
        </button>
      </div>
    </li>
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
  const [timedOut, setTimedOut] = useState(false)

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
    setTimedOut(true)
    supabase?.auth.signOut()
  }, [])
  const idle = useIdleLogout(Boolean(open && session), onIdle)

  // Al volver a entrar, el aviso de "te sacamos" ya no aplica.
  useEffect(() => {
    if (session) setTimedOut(false)
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
    if (lockLeft > 0) return
    setError('')
    setBusy(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
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

  return (
    <div data-lenis-prevent className="fixed inset-0 z-[90] overflow-y-auto overscroll-contain bg-ink">
      <div className="shell py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="kicker">Uso interno</p>
            <h1 className="mt-2 font-display text-4xl text-cream">Panel de empleados</h1>
          </div>
          <button
            onClick={close}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-4 text-sm font-semibold text-ash transition-colors hover:text-cream"
          >
            <Icon.Close className="h-5 w-5" /> Salir
          </button>
        </div>

        {!supabaseReady ? (
          <div className="rounded-2xl border border-gold/30 bg-gold/10 p-6 text-cream">
            <p className="font-display text-2xl">Falta conectar Supabase</p>
            <p className="mt-2 text-sm text-ash">
              Pon <code className="text-gold">VITE_SUPABASE_URL</code> y{' '}
              <code className="text-gold">VITE_SUPABASE_ANON_KEY</code> en tu{' '}
              <code className="text-gold">.env.local</code> (y en Vercel), y corre el SQL de{' '}
              <code className="text-gold">supabase/schema.sql</code>. Mientras tanto el sitio
              funciona normal y el modo demanda queda apagado.
            </p>
          </div>
        ) : checking ? (
          <p className="text-ash">Cargando…</p>
        ) : !session ? (
          <form onSubmit={signIn} className="max-w-sm space-y-4">
            {timedOut ? (
              <p className="rounded-xl border border-gold/35 bg-gold/10 p-3 text-sm text-cream">
                Cerramos la sesión por inactividad ({IDLE_MS / 60_000} min). Vuelve a entrar
                para ver los pedidos.
              </p>
            ) : (
              <p className="text-sm text-ash">Entra con tu cuenta de empleado.</p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-cream">Correo</span>
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
              <span className="mb-1.5 block text-sm font-semibold text-cream">Contraseña</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm font-semibold text-crimson">
                {error}
              </p>
            )}
            {lockLeft > 0 && (
              <p role="alert" className="text-sm text-gold">
                Demasiados intentos fallidos. Espera {lockLabel(lockLeft)} para
                volver a probar.
              </p>
            )}
            <button
              type="submit"
              disabled={busy || lockLeft > 0}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-crimson to-fire font-bold text-white disabled:opacity-50"
            >
              {lockLeft > 0 ? `Bloqueado ${lockLabel(lockLeft)}` : busy ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-ash">
                Sesión: <span className="text-cream">{session.user.email}</span>
                <span className="ml-2 text-ash-dim">
                  · se cierra sola tras {IDLE_MS / 60_000} min sin actividad
                </span>
              </p>
              <button
                onClick={() => supabase.auth.signOut()}
                className="font-semibold text-ash-dim transition-colors hover:text-crimson"
              >
                Cerrar sesión
              </button>
            </div>

            {/* El aviso es fijo y ocupa lugar: si se cae la sesión a media
                comanda, el pedido en pantalla se pierde de vista. */}
            {idle.warning && (
              <p
                role="alert"
                className="swap-in mb-4 rounded-xl border border-gold/40 bg-gold/12 p-3 text-sm text-cream"
              >
                Vamos a cerrar la sesión en {Math.ceil(idle.left / 1000)} s por inactividad. Toca
                la pantalla para seguir.
              </p>
            )}

            {/* Pestañas: la comanda primero, que es el trabajo del turno. */}
            <div className="mb-6 flex gap-2">
              {[
                ['pedidos', `Pedidos${nuevos ? ` (${nuevos})` : ''}`],
                ['sucursales', 'Sucursales'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                  className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition-colors ${
                    tab === id
                      ? 'border-transparent bg-gradient-to-r from-crimson to-fire text-white'
                      : 'border-hairline text-ash hover:text-cream'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <p role="alert" className="mb-4 text-sm font-semibold text-crimson">
                {error}
              </p>
            )}

            {tab === 'pedidos' ? (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ash">
                    {orders.length === 0
                      ? 'Sin pedidos abiertos.'
                      : `${orders.length} ${orders.length === 1 ? 'pedido abierto' : 'pedidos abiertos'}`}
                  </p>
                  <p className="text-sm text-ash-dim">
                    Hoy:{' '}
                    <span className="font-semibold text-cream tabular-nums">
                      {quota?.used ?? 0}
                    </span>{' '}
                    de {quota?.limit ?? DAILY_LIMIT} pedidos
                    {quota && quota.remaining <= 0 && (
                      <span className="ml-2 rounded-full bg-crimson/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-crimson">
                        Cupo lleno
                      </span>
                    )}
                  </p>
                </div>

                {ordersErr && (
                  <p role="alert" className="mb-4 text-sm font-semibold text-crimson">
                    {ordersErr}
                  </p>
                )}

                {loadingOrders ? (
                  <p className="text-ash">Cargando pedidos…</p>
                ) : orders.length === 0 ? (
                  <div className="rounded-2xl border border-hairline bg-surface p-10 text-center">
                    <Icon.Flame className="mx-auto h-8 w-8 text-fire/50" />
                    <p className="mt-3 font-display text-2xl text-cream">Todo al día</p>
                    <p className="mt-1 text-sm text-ash">
                      Los pedidos del sitio aparecen aquí solos, sin recargar.
                    </p>
                  </div>
                ) : (
                  <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {orders.map((o) => (
                      <OrderCard key={o.id} o={o} onFinish={finish} onAck={acknowledge} />
                    ))}
                  </ul>
                )}

                {/* Barra de deshacer: flota abajo, encima de la comanda, para
                    que se alcance sin buscar la tarjeta que acaba de irse. */}
                {closing.length > 0 && (
                  <div
                    role="status"
                    className="rise-in fixed inset-x-0 bottom-0 z-10 flex justify-center px-5"
                    style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
                  >
                    <div className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-full border border-hairline bg-ink/90 px-5 py-3 shadow-2xl backdrop-blur-xl">
                      <p className="text-sm text-cream">
                        {closing.length === 1
                          ? `Pedido #${closing[0].no} entregado`
                          : `${closing.length} pedidos entregados`}
                      </p>
                      <button
                        onClick={() => undo(closing[closing.length - 1].id)}
                        className="inline-flex min-h-11 items-center rounded-full border border-hairline px-4 text-sm font-bold text-gold transition-colors hover:border-gold/60"
                      >
                        Deshacer
                      </button>
                    </div>
                  </div>
                )}

                <p className="mt-8 max-w-2xl text-sm text-ash-dim">
                  Al marcar <strong>Entregado</strong> el pedido se borra de aquí: este panel es la
                  comanda del turno, no un historial. Tienes {UNDO_MS / 1000} segundos para
                  deshacerlo; después ya no se puede recuperar. Lo que nadie cierre se borra solo
                  a las 12 horas. La copia siempre queda en el WhatsApp del negocio. Cada día se reciben
                  máximo {quota?.limit ?? DAILY_LIMIT} pedidos; al llegar al tope el sitio deja de
                  aceptarlos hasta el día siguiente.
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
                    className={`rounded-2xl border p-5 transition-colors ${
                      high ? 'border-crimson/50 bg-crimson/10' : 'border-hairline bg-surface'
                    }`}
                  >
                    <h2 className="font-display text-xl text-cream">{b.name}</h2>
                    <p className="mt-1 text-xs text-ash-dim">{b.city}</p>

                    <p
                      className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        high ? 'bg-crimson/25 text-crimson' : 'bg-white/8 text-ash'
                      }`}
                    >
                      <Icon.Flame className="h-3 w-3" filled={high} />
                      {high ? 'Mucha demanda' : 'Operando normal'}
                    </p>

                    <label className="mt-4 block">
                      <span className="mb-1.5 block text-xs font-semibold text-ash">
                        Nota para el cliente (opcional)
                      </span>
                      <input
                        value={notes[b.slug] ?? ''}
                        onChange={(e) =>
                          setNotes((n) => ({ ...n, [b.slug]: e.target.value.slice(0, NOTE_MAX) }))
                        }
                        maxLength={NOTE_MAX}
                        className={`${inputClass} min-h-11 text-sm`}
                        placeholder="Ej. 45 min de espera"
                      />
                    </label>

                    <button
                      onClick={() => setDemand(b.slug, !high)}
                      disabled={saving}
                      className={`mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full font-bold transition-transform duration-200 active:scale-95 disabled:opacity-50 ${
                        high
                          ? 'border border-hairline text-cream'
                          : 'bg-gradient-to-r from-crimson to-fire text-white'
                      }`}
                    >
                      {saving ? 'Guardando…' : high ? 'Volver a normal' : 'Marcar mucha demanda'}
                    </button>
                  </div>
                )
              })}
            </div>

            <p className="mt-8 max-w-2xl text-sm text-ash-dim">
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
