/* ============================================================================
   CARRITO / CHECKOUT
   ----------------------------------------------------------------------------
   Botón flotante con el contador + panel lateral con el desglose.

   El pedido NO se guarda en ningún lado: se arma un mensaje de WhatsApp y el
   empleado confirma por chat la forma de pago.

   Si la sucursal elegida trae mucha demanda (bandera que prende el personal en
   Supabase), el camino principal cambia a Uber Eats.
   ============================================================================ */
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Icon, LiveRegion, lockScroll, unlockScroll, useFocusTrap } from './ui'
import LiquidGlassButton from './LiquidGlassButton'
import { branches, WHATSAPP } from '../data'
import { buildOrderMessage, useCart } from '../store/cart'
import { useStatus } from '../store/status'

const money = (n) => `$${n.toLocaleString('es-MX')}`
const PAYMENTS = ['Efectivo', 'Transferencia', 'Mercado Pago']

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-cream">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ash-dim">{hint}</span>}
    </label>
  )
}

const inputClass =
  'min-h-12 w-full rounded-xl border border-hairline bg-ink/60 px-4 text-cream placeholder:text-ash-dim focus:border-fire focus:outline-none'

export default function CartDrawer() {
  const [open, setOpen] = useState(false)
  const { lines, count, total, hasOpenPrice, setQty, remove, clear } = useCart()
  const { isSaturated, noteFor } = useStatus()

  const [branchSlug, setBranchSlug] = useState(branches[0].slug)
  const [mode, setMode] = useState('recoger')
  const [payment, setPayment] = useState(PAYMENTS[0])
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [announce, setAnnounce] = useState('')

  const titleId = useId()
  const panelRef = useRef(null)
  const lastFocused = useRef(null)
  const prevCount = useRef(count)

  // El menú (y cualquier otro punto del sitio) abre el carrito con este evento.
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('alitas:abrir-carrito', onOpen)
    return () => window.removeEventListener('alitas:abrir-carrito', onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    lastFocused.current = document.activeElement
    lockScroll()
    panelRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockScroll()
      lastFocused.current?.focus?.()
    }
  }, [open])

  useFocusTrap(panelRef, open)

  // El "Listo" del botón es visual: sin esto, quien usa lector de pantalla no
  // se entera de que el producto entró al pedido.
  useEffect(() => {
    if (count === prevCount.current) return
    const diff = count - prevCount.current
    prevCount.current = count
    setAnnounce(
      diff > 0
        ? `Producto agregado. Llevas ${count} ${count === 1 ? 'producto' : 'productos'}.`
        : count === 0
          ? 'Tu pedido quedó vacío.'
          : `Producto quitado. Llevas ${count} ${count === 1 ? 'producto' : 'productos'}.`,
    )
  }, [count])

  // Si el carrito se vacía, la confirmación de "vaciar" ya no aplica.
  useEffect(() => {
    if (lines.length === 0) setConfirmClear(false)
  }, [lines.length])

  const branch = branches.find((b) => b.slug === branchSlug) ?? branches[0]
  const saturated = isSaturated(branch.slug)
  const note = noteFor(branch.slug)

  // Las pizzas sólo salen de Sauces Metepec: avisamos antes de mandar el pedido.
  const pizzaMismatch = useMemo(
    () => lines.some((l) => l.groupId === 'pizzas') && branch.slug !== 'sauces',
    [lines, branch.slug],
  )

  const waHref = useMemo(() => {
    const text = buildOrderMessage({
      lines,
      total,
      hasOpenPrice,
      branch,
      mode,
      payment,
      name: name.trim(),
      notes: notes.trim(),
    })
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
  }, [lines, total, hasOpenPrice, branch, mode, payment, name, notes])

  return (
    <>
      <LiveRegion message={announce} />

      {/* Botón flotante — se esconde cuando el panel está abierto */}
      {count > 0 && !open && (
        <LiquidGlassButton
          onClick={() => setOpen(true)}
          style={{
            bottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
            left: 'calc(1.25rem + env(safe-area-inset-left))',
          }}
          className="cart-pop fixed z-40 min-h-14 px-5 font-bold text-white shadow-xl glow-crimson"
          aria-label={`Ver mi pedido, ${count} productos`}
        >
          <Icon.Star className="h-5 w-5" />
          Mi pedido
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-ink/35 px-2 text-sm tabular-nums">
            {count}
          </span>
        </LiquidGlassButton>
      )}

      {/* Panel */}
      <div
        className={`fixed inset-0 z-[80] ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/70 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          ref={panelRef}
          tabIndex={-1}
          className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-hairline bg-ink-2 shadow-2xl outline-none transition-transform duration-300 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-hairline px-5 py-5">
            <h2 id={titleId} className="font-display text-2xl text-cream">
              Mi pedido
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ash transition-colors hover:text-cream"
              aria-label="Cerrar pedido"
            >
              <Icon.Close className="h-6 w-6" />
            </button>
          </div>

          {/* data-lenis-prevent: sin esto Lenis se come el scroll interno */}
          <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            {lines.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-display text-2xl text-cream">Tu pedido está vacío</p>
                <p className="mt-2 text-sm text-ash">
                  Agrega productos desde el menú y aquí aparecen.
                </p>
                <a
                  href="#menu"
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-flex min-h-12 items-center rounded-full border border-hairline px-6 font-semibold text-cream transition-colors hover:border-fire/50"
                >
                  Ir al menú
                </a>
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  {lines.map((l) => (
                    <li
                      key={l.key}
                      className="rounded-2xl border border-hairline bg-surface p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-lg leading-tight text-cream">{l.name}</p>
                          <p className="text-xs text-ash-dim">{l.groupName}</p>
                          {l.sauces?.length > 0 && (
                            <p className="mt-1 text-xs text-ash">Salsas: {l.sauces.join(', ')}</p>
                          )}
                        </div>
                        <button
                          onClick={() => remove(l.key)}
                          className="-mr-2 -mt-2 inline-flex min-h-11 shrink-0 items-center px-2 text-xs font-semibold text-ash-dim transition-colors hover:text-crimson"
                          aria-label={`Quitar ${l.name} del pedido`}
                        >
                          Quitar
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div
                          className="inline-flex items-center rounded-full border border-hairline"
                          role="group"
                          aria-label={`Cantidad de ${l.name}`}
                        >
                          {/* Se topa en 1: bajar de ahí borraba el renglón sin
                              avisar. Para quitarlo está el botón "Quitar". */}
                          <button
                            onClick={() => setQty(l.key, Math.max(1, l.qty - 1))}
                            disabled={l.qty <= 1}
                            className="h-11 w-11 rounded-full text-lg text-ash transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Quitar uno de ${l.name}`}
                          >
                            −
                          </button>
                          <span className="min-w-7 text-center font-display tabular-nums text-cream">
                            {l.qty}
                          </span>
                          <button
                            onClick={() => setQty(l.key, l.qty + 1)}
                            className="h-11 w-11 rounded-full text-lg text-ash transition-colors hover:text-cream"
                            aria-label={`Agregar uno de ${l.name}`}
                          >
                            +
                          </button>
                        </div>
                        <span className="font-display text-lg tabular-nums text-fire-gradient">
                          {l.price ? money(l.price * l.qty) : 'A confirmar'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Vaciar es destructivo y no hay deshacer: se confirma en el
                    mismo lugar en vez de abrir un diálogo encima del panel. */}
                {confirmClear ? (
                  <div className="swap-in mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-crimson/35 bg-crimson/10 p-3">
                    <p className="mr-auto text-sm text-cream">¿Vaciar todo el pedido?</p>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="inline-flex min-h-11 items-center rounded-full border border-hairline px-4 text-sm font-semibold text-ash transition-colors hover:text-cream"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        clear()
                        setConfirmClear(false)
                      }}
                      className="inline-flex min-h-11 items-center rounded-full bg-crimson px-4 text-sm font-bold text-white transition-transform duration-200 active:scale-95"
                    >
                      Sí, vaciar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-ash-dim transition-colors hover:text-crimson"
                  >
                    Vaciar pedido
                  </button>
                )}

                {/* Datos del pedido */}
                <div className="mt-8 space-y-5">
                  {/* Tarjetas en vez de <select>: la sucursal decide tiempos y
                      qué se puede pedir, así que tiene que verse desde el inicio. */}
                  <Field label="¿De qué sucursal?">
                    <div role="radiogroup" aria-label="Sucursal" className="grid grid-cols-1 gap-2">
                      {branches.map((b) => {
                        const active = branchSlug === b.slug
                        return (
                          <button
                            key={b.slug}
                            role="radio"
                            aria-checked={active}
                            onClick={() => setBranchSlug(b.slug)}
                            className={`group flex w-full min-w-0 min-h-14 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                              active
                                ? 'border-fire bg-fire/15'
                                : 'border-hairline hover:border-fire/40 hover:bg-white/[0.03]'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                                active ? 'border-fire bg-fire' : 'border-ash-dim'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full bg-ink transition-opacity ${
                                  active ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-base leading-tight ${
                                  active ? 'text-cream' : 'text-ash group-hover:text-cream'
                                }`}
                              >
                                {b.name.replace('Sucursal ', '')}
                                {isSaturated(b.slug) && (
                                  <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gold">
                                    Mucha demanda
                                  </span>
                                )}
                              </span>
                              <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-ash-dim">
                                {b.address}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </Field>

                  {pizzaMismatch && (
                    <p
                      role="alert"
                      className="swap-in flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-cream"
                    >
                      <Icon.MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <span>
                        Llevas pizzas y sólo se preparan en <strong>Sauces Metepec</strong>. Cambia
                        de sucursal o quítalas del pedido.
                      </span>
                    </p>
                  )}

                  <Field label="¿Cómo lo quieres?">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['recoger', 'Paso por él'],
                        ['domicilio', 'A domicilio'],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          onClick={() => setMode(id)}
                          aria-pressed={mode === id}
                          className={`min-h-12 rounded-xl border text-sm font-semibold transition-colors ${
                            mode === id
                              ? 'border-fire bg-fire/15 text-cream'
                              : 'border-hairline text-ash hover:text-cream'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Forma de pago" hint="La confirmas por WhatsApp con el encargado.">
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPayment(p)}
                          aria-pressed={payment === p}
                          className={`min-h-12 rounded-xl border px-2 text-xs font-semibold transition-colors ${
                            payment === p
                              ? 'border-fire bg-fire/15 text-cream'
                              : 'border-hairline text-ash hover:text-cream'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Tu nombre">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      placeholder="¿A nombre de quién?"
                      maxLength={60}
                      autoComplete="name"
                    />
                  </Field>

                  <Field
                    label="Notas"
                    hint={mode === 'domicilio' ? 'Incluye tu dirección y referencias.' : undefined}
                  >
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      maxLength={400}
                      className={`${inputClass} min-h-24 resize-y py-3`}
                      placeholder={
                        mode === 'domicilio'
                          ? 'Calle, número, colonia y referencias'
                          : 'Sin verduras, extra picante, etc.'
                      }
                    />
                  </Field>
                </div>
              </>
            )}
          </div>

          {/* Cierre */}
          {lines.length > 0 && (
            <div
              className="border-t border-hairline bg-ink/70 px-5 py-5"
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
            >
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm font-semibold uppercase tracking-widest text-ash">
                  Total {hasOpenPrice && <span className="normal-case text-ash-dim">(desde)</span>}
                </span>
                <span className="font-display text-3xl tabular-nums text-fire-gradient">
                  {money(total)}
                </span>
              </div>

              {/* Mandar pizzas a una sucursal que no las hace es un pedido que
                  nadie puede surtir: se corta aquí, no en el chat. */}
              {pizzaMismatch ? (
                <>
                  <button
                    disabled
                    className="inline-flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-crimson to-fire px-6 font-bold text-white opacity-40"
                  >
                    <Icon.Whatsapp className="h-5 w-5" />
                    Enviar pedido por WhatsApp
                  </button>
                  <p className="mt-3 text-center text-xs text-gold">
                    Ajusta la sucursal o quita las pizzas para poder enviarlo.
                  </p>
                </>
              ) : saturated ? (
                <>
                  <p className="mb-3 rounded-xl border border-crimson/40 bg-crimson/12 p-3 text-sm text-cream">
                    <strong>{branch.name}</strong> trae mucha demanda ahorita.
                    {note ? ` ${note}` : ' Para que no esperes de más, pide por Uber Eats.'}
                  </p>
                  <a
                    href={branch.uberEats}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-crimson to-fire px-6 font-bold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                  >
                    Pedir por Uber Eats
                    <Icon.Arrow className="h-5 w-5" />
                  </a>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-hairline px-6 text-sm font-semibold text-ash transition-colors hover:text-cream"
                  >
                    Mandarlo por WhatsApp de todos modos
                  </a>
                </>
              ) : (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-crimson to-fire px-6 font-bold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                >
                  <Icon.Whatsapp className="h-5 w-5" />
                  Enviar pedido por WhatsApp
                </a>
              )}

              {!pizzaMismatch && (
                <p className="mt-3 text-center text-xs text-ash-dim">
                  Te confirmamos disponibilidad y tiempo por WhatsApp antes de preparar.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
