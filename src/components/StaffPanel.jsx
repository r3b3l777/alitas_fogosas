/* ============================================================================
   PANEL DEL PERSONAL
   ----------------------------------------------------------------------------
   No hay router en el sitio: el panel se abre con el hash `#empleados`
   (alitasfogosas.com/#empleados). No está enlazado desde ningún lado.

   Login con Supabase Auth (correo + contraseña). Los usuarios se crean a mano
   en el panel de Supabase; el registro público debe quedar APAGADO.

   Una vez dentro, cada sucursal tiene un switch de "mucha demanda" y una nota
   opcional que se le muestra al cliente.
   ============================================================================ */
import { useCallback, useEffect, useState } from 'react'
import { Icon, lockScroll, unlockScroll } from './ui'
import { supabase, supabaseReady } from '../lib/supabase'
import { branches } from '../data'
import { useStatus } from '../store/status'

const inputClass =
  'min-h-12 w-full rounded-xl border border-hairline bg-ink/60 px-4 text-cream placeholder:text-ash-dim focus:border-fire focus:outline-none'

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
    setError('')
    setBusy(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError('No pudimos entrar. Revisa el correo y la contraseña.')
    setBusy(false)
  }

  const setDemand = useCallback(
    async (slug, high) => {
      setSavingSlug(slug)
      setError('')
      const payload = {
        high_demand: high,
        note: (notes[slug] || '').trim() || null,
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
            <h1 className="mt-2 font-display text-4xl text-cream">Panel de sucursales</h1>
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
            <p className="text-sm text-ash">Entra con tu cuenta de empleado.</p>
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
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-crimson to-fire font-bold text-white disabled:opacity-50"
            >
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-ash">
                Sesión: <span className="text-cream">{session.user.email}</span>
              </p>
              <button
                onClick={() => supabase.auth.signOut()}
                className="font-semibold text-ash-dim transition-colors hover:text-crimson"
              >
                Cerrar sesión
              </button>
            </div>

            {error && (
              <p role="alert" className="mb-4 text-sm font-semibold text-crimson">
                {error}
              </p>
            )}

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
                        onChange={(e) => setNotes((n) => ({ ...n, [b.slug]: e.target.value }))}
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
      </div>
    </div>
  )
}
