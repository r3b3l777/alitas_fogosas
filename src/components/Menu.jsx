import { useEffect, useId, useRef, useState } from 'react'
import { Reveal, Icon } from './ui'
import { menu, sauces as allSauces, branches } from '../data'
import { useCart } from '../store/cart'
import { useStatus } from '../store/status'

const money = (n) => `$${n.toLocaleString('es-MX')}`

function Price({ value }) {
  return (
    <span className="shrink-0 font-display text-xl tabular-nums text-fire-gradient">
      {money(value)}
    </span>
  )
}

function QtyStepper({ qty, onChange, label }) {
  return (
    <div
      className="inline-flex shrink-0 items-center rounded-full border border-hairline"
      role="group"
      aria-label={label}
    >
      <button
        onClick={() => onChange(Math.max(1, qty - 1))}
        className="h-11 w-11 rounded-full text-lg text-ash transition-colors hover:text-cream"
        aria-label="Quitar uno"
      >
        −
      </button>
      <span className="min-w-7 text-center font-display text-lg tabular-nums text-cream">{qty}</span>
      <button
        onClick={() => onChange(Math.min(99, qty + 1))}
        className="h-11 w-11 rounded-full text-lg text-ash transition-colors hover:text-cream"
        aria-label="Agregar uno"
      >
        +
      </button>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Hoja para elegir salsas y cantidad. Sólo aparece en los grupos marcados con
   `sauces: true`; el resto se agrega de un toque.
   ------------------------------------------------------------------------- */
const MAX_SAUCES = 3

function AddSheet({ group, item, onClose }) {
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const [picked, setPicked] = useState([])
  const titleId = useId()
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = (name) =>
    setPicked((prev) =>
      prev.includes(name)
        ? prev.filter((s) => s !== name)
        : prev.length >= MAX_SAUCES
          ? prev
          : [...prev, name],
    )

  const confirm = () => {
    add({
      groupId: group.id,
      groupName: group.name,
      name: item.name,
      price: item.price ?? null,
      sauces: picked,
      qty,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center">
      <button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-ink/75" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
        tabIndex={-1}
        data-lenis-prevent
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl border border-hairline bg-surface p-6 shadow-2xl outline-none sm:rounded-3xl"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <p className="kicker">{group.name}</p>
        <h3 id={titleId} className="mt-2 font-display text-3xl text-cream">
          {item.name}
        </h3>
        {item.price != null && (
          <p className="mt-1 font-display text-2xl text-fire-gradient">{money(item.price)}</p>
        )}

        <p className="mt-6 text-sm font-semibold text-cream">
          Elige tus salsas{' '}
          <span className="font-normal text-ash-dim">(hasta {MAX_SAUCES} · opcional)</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {allSauces.map((s) => {
            const on = picked.includes(s.name)
            const full = !on && picked.length >= MAX_SAUCES
            return (
              <button
                key={s.name}
                onClick={() => toggle(s.name)}
                disabled={full}
                aria-pressed={on}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${
                  on
                    ? 'border-fire bg-fire/15 text-cream'
                    : full
                      ? 'cursor-not-allowed border-hairline text-ash-dim opacity-50'
                      : 'border-hairline text-ash hover:text-cream'
                }`}
              >
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: s.color }}
                />
                {s.name}
              </button>
            )
          })}
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <QtyStepper qty={qty} onChange={setQty} label={`Cantidad de ${item.name}`} />
          <button
            onClick={confirm}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-crimson to-fire px-6 font-bold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          >
            Agregar
            {item.price != null && <span className="tabular-nums">· {money(item.price * qty)}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------- */

export default function Menu() {
  const [active, setActive] = useState(menu[0].id)
  const [sheet, setSheet] = useState(null)
  const [justAdded, setJustAdded] = useState(null)
  const { add, count } = useCart()
  const { isSaturated } = useStatus()

  const group = menu.find((m) => m.id === active) ?? menu[0]

  // Confirmación breve en el propio botón: el usuario ve que sí se agregó
  // sin que le abramos el carrito encima.
  useEffect(() => {
    if (!justAdded) return
    const t = setTimeout(() => setJustAdded(null), 1400)
    return () => clearTimeout(t)
  }, [justAdded])

  const onAdd = (item) => {
    if (group.sauces) {
      setSheet({ group, item })
      return
    }
    add({
      groupId: group.id,
      groupName: group.name,
      name: item.name,
      price: item.price ?? null,
      sauces: [],
      qty: 1,
    })
    setJustAdded(item.name)
  }

  const onlyBranch = group.onlyBranch ? branches.find((b) => b.slug === group.onlyBranch) : null

  return (
    <section id="menu" className="edge-top relative scroll-mt-20 bg-ink-2/72 py-20 md:py-28">
      <div className="shell">
        <Reveal className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="kicker">El menú</p>
            <h2 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] text-cream">
              Arma tu <span className="text-fire-gradient">pedido</span>
            </h2>
            <p className="mt-4 text-ash">
              Agrega lo que se te antoje y lo mandamos por WhatsApp. Ahí eliges si pagas con
              Mercado Pago, transferencia o efectivo.
            </p>
          </div>
          <p className="text-sm text-ash-dim">Precios del menú oficial en MXN · sujetos a cambio.</p>
        </Reveal>

        {/* Tabs por categoría */}
        <div className="no-scrollbar -mx-5 mb-10 flex gap-2.5 overflow-x-auto px-5 pb-1">
          {menu.map((m) => {
            const on = m.id === active
            return (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                aria-pressed={on}
                className={`min-h-11 shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  on
                    ? 'border-transparent bg-gradient-to-r from-crimson to-fire text-white shadow-lg'
                    : 'border-hairline bg-white/5 text-ash hover:text-cream'
                }`}
              >
                {m.name}
              </button>
            )
          })}
        </div>

        {onlyBranch && (
          <p className="mb-6 flex items-start gap-2.5 rounded-2xl border border-gold/25 bg-gold/10 p-4 text-sm text-cream">
            <Icon.MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>
              Las pizzas se preparan sólo en <strong>{onlyBranch.name}</strong>.
              {isSaturated(onlyBranch.slug) && ' Ahorita esa sucursal trae mucha demanda.'}
            </span>
          </p>
        )}

        <div key={active} className="grid gap-4 md:grid-cols-2">
          {group.items.map((it, i) => (
            <Reveal
              key={it.name}
              delay={i * 50}
              className="group flex items-start justify-between gap-4 rounded-2xl border border-hairline bg-surface p-5 transition-colors hover:border-fire/40"
            >
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 font-display text-xl tracking-wide text-cream">
                  {it.name}
                  {it.star && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-gold">
                      <Icon.Star className="h-3 w-3" /> Top
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ash">{it.desc}</p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2.5">
                {it.price != null && <Price value={it.price} />}
                <button
                  onClick={() => onAdd(it)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-all duration-200 active:scale-95 ${
                    justAdded === it.name
                      ? 'bg-gold text-ink'
                      : 'bg-gradient-to-r from-crimson to-fire text-white hover:scale-[1.04]'
                  }`}
                  aria-label={`Agregar ${it.name} al pedido`}
                >
                  {justAdded === it.name ? (
                    <>
                      <Icon.Star className="h-3.5 w-3.5" /> Listo
                    </>
                  ) : (
                    <>+ Agregar</>
                  )}
                </button>
              </div>
            </Reveal>
          ))}
        </div>

        {group.note && <p className="mt-6 text-center text-sm text-ash-dim">{group.note}</p>}

        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-hairline bg-gradient-to-r from-surface to-surface-2 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-display text-2xl text-cream">
              {count > 0
                ? `Llevas ${count} ${count === 1 ? 'producto' : 'productos'}`
                : '¿Listo para pedir?'}
            </p>
            <p className="text-sm text-ash">
              {count > 0
                ? 'Abre tu pedido para revisarlo y mandarlo.'
                : 'Agrega productos del menú y arma tu orden.'}
            </p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('alitas:abrir-carrito'))}
            disabled={count === 0}
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-gradient-to-r from-crimson to-fire px-7 py-4 font-bold text-white transition-transform duration-200 hover:scale-[1.04] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <Icon.Whatsapp className="h-5 w-5" /> Ver mi pedido
          </button>
        </div>
      </div>

      {sheet && <AddSheet group={sheet.group} item={sheet.item} onClose={() => setSheet(null)} />}
    </section>
  )
}
