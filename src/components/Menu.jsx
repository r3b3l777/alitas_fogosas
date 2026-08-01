import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Reveal, Icon, lockScroll, unlockScroll, useFocusTrap } from './ui'
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

/* La hoja se monta y se desmonta con `{sheet && <AddSheet/>}`, así que la
   entrada y la salida se manejan aquí adentro: `shown` conmuta un frame
   después de montar, y al cerrar esperamos a que termine la salida antes de
   avisarle al padre. Salida más corta que la entrada (se siente responsivo:
   el usuario ya decidió y no quiere esperar a la animación). */
const SHEET_OUT_MS = 190

function AddSheet({ group, item, onClose }) {
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const [picked, setPicked] = useState([])
  const [withBeer, setWithBeer] = useState(false)
  const [shown, setShown] = useState(false)
  const titleId = useId()
  const ref = useRef(null)
  const closing = useRef(false)

  const combo = item.combo
  const unitPrice = withBeer && combo ? combo.price : item.price ?? null

  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(r)
  }, [])

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    setShown(false)
    window.setTimeout(onClose, SHEET_OUT_MS)
  }, [onClose])

  const lastFocused = useRef(null)

  useEffect(() => {
    lastFocused.current = document.activeElement
    lockScroll()
    ref.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockScroll()
      lastFocused.current?.focus?.()
    }
  }, [close])

  useFocusTrap(ref, true)

  const toggle = (name) =>
    setPicked((prev) =>
      prev.includes(name)
        ? prev.filter((s) => s !== name)
        : prev.length >= MAX_SAUCES
          ? prev
          : [...prev, name],
    )

  const confirm = () => {
    const beers = withBeer && combo ? combo.beers : 0
    add({
      groupId: group.id,
      groupName: group.name,
      // El nombre lleva el paquete: así el mensaje de WhatsApp y el renglón del
      // carrito dicen exactamente qué se pidió, sin campos extra que traducir.
      name: beers ? `${item.name} + ${beers} ${beers === 1 ? 'cerveza' : 'cervezas'}` : item.name,
      price: unitPrice,
      sauces: picked,
      qty,
    })
    close()
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center">
      {/* El velo cierra al tocar fuera, pero no debe ser un botón gigante en el
          orden de tabulación: el cierre accesible es la X de la hoja. */}
      <div
        aria-hidden
        onClick={close}
        className={`absolute inset-0 bg-ink/75 transition-opacity duration-300 motion-reduce:transition-none ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Sube desde abajo (de donde nace en móvil) con un toque de escala y
          desenfoque; al salir baja menos y más rápido — la salida no necesita
          tanta ceremonia como la entrada, el usuario ya decidió.
          Ver nota de `translate`/`scale` en el className. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
        tabIndex={-1}
        data-lenis-prevent
        /* OJO: Tailwind v4 compila `translate-y-*` y `scale-*` a las
           propiedades CSS `translate` y `scale`, NO a `transform`. Con
           `transition-[transform,...]` el desplazamiento y la escala saltaban
           de golpe y sólo se veía animar la opacidad. */
        className={`relative max-h-[88vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl border border-hairline bg-surface p-6 shadow-2xl outline-none transition-[translate,scale,opacity,filter] ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none sm:rounded-3xl ${
          shown
            ? 'translate-y-0 scale-100 opacity-100 blur-0 duration-[380ms]'
            : 'translate-y-6 scale-[0.985] opacity-0 blur-[6px] duration-[190ms]'
        }`}
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-ash transition-colors hover:text-cream"
        >
          <Icon.Close className="h-6 w-6" />
        </button>

        <p className="kicker">{group.name}</p>
        <h3 id={titleId} className="mt-2 max-w-[calc(100%-3rem)] font-display text-3xl text-cream">
          {item.name}
        </h3>
        {unitPrice != null && (
          <p className="mt-1 font-display text-2xl text-fire-gradient">{money(unitPrice)}</p>
        )}

        {/* Paquete con cerveza: es la opción que más sube el ticket, así que va
            arriba de las salsas y con el precio ya resuelto, no en letra chica. */}
        {combo && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-cream">¿Le agregas cerveza?</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setWithBeer(false)}
                aria-pressed={!withBeer}
                className={`flex min-h-14 flex-col justify-center rounded-xl border px-4 py-2 text-left transition-colors ${
                  !withBeer ? 'border-fire bg-fire/15' : 'border-hairline hover:border-fire/40'
                }`}
              >
                <span className="text-sm font-semibold text-cream">Solo la orden</span>
                <span className="font-display text-lg tabular-nums text-fire-gradient">
                  {money(item.price)}
                </span>
              </button>
              <button
                onClick={() => setWithBeer(true)}
                aria-pressed={withBeer}
                className={`flex min-h-14 flex-col justify-center rounded-xl border px-4 py-2 text-left transition-colors ${
                  withBeer ? 'border-fire bg-fire/15' : 'border-hairline hover:border-fire/40'
                }`}
              >
                <span className="text-sm font-semibold text-cream">
                  Paquete · {combo.beers} {combo.beers === 1 ? 'cerveza' : 'cervezas'}
                </span>
                <span className="font-display text-lg tabular-nums text-fire-gradient">
                  {money(combo.price)}
                </span>
              </button>
            </div>
            <p className="mt-2 text-xs text-ash-dim">
              Cerveza nacional (no incluye marcas premium). La marca la eliges por WhatsApp.
            </p>
          </div>
        )}

        {group.sauces && (
        <>
        <p className="mt-6 text-sm font-semibold text-cream">
          Elige tus salsas{' '}
          <span className="font-normal text-ash-dim">(hasta {MAX_SAUCES} · sin costo)</span>
        </p>
        <p className="mt-1 text-xs text-ash">
          <Icon.Star className="mr-1 inline h-3 w-3 text-gold" />
          Las marcadas con estrella son{' '}
          <span className="font-semibold text-gold">de la casa</span>, receta propia.
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
                /* El nivel de picor va en el propio chip: mandar al cliente de
                   regreso a la sección de salsas a media orden es perderlo. */
                aria-label={`${s.name}${s.house ? ', de la casa' : ''}, ${
                  ['', 'suave', 'picosa', 'para valientes'][s.heat]
                }`}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${
                  on
                    ? 'border-fire bg-fire/15 text-cream'
                    : full
                      ? 'cursor-not-allowed border-hairline text-ash-dim opacity-50'
                      : s.house
                        ? 'border-gold/40 text-cream hover:border-gold/70'
                        : 'border-hairline text-ash hover:text-cream'
                }`}
              >
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: s.color }}
                />
                {s.name}
                {s.house && <Icon.Star aria-hidden className="h-3 w-3 shrink-0 text-gold" />}
                <span aria-hidden className="text-[0.7rem] leading-none tracking-tight">
                  {'🌶️'.repeat(s.heat)}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2.5 text-xs text-ash-dim">
          Todas se preparan aquí mismo. Si no eliges ninguna, lo confirmamos por WhatsApp.
        </p>
        </>
        )}

        <div className="mt-7 flex items-center justify-between gap-4">
          <QtyStepper qty={qty} onChange={setQty} label={`Cantidad de ${item.name}`} />
          <button
            onClick={confirm}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-crimson to-fire px-6 font-bold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          >
            Agregar
            {unitPrice != null && (
              <>
                {/* Separador como elemento propio: pegado al precio se veía chueco,
                    porque el gap del flex sólo caía de un lado del punto. */}
                <span aria-hidden="true" className="text-white/45">·</span>
                <span className="tabular-nums">{money(unitPrice * qty)}</span>
              </>
            )}
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
    // La hoja se abre si hay algo que elegir: salsas o paquete con cerveza.
    if (group.sauces || item.combo) {
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
              Agrega lo que se te antoje, elige tus salsas y el pedido cae al mismo
              tiempo en WhatsApp y en la cocina. El pago lo confirmas por chat: Mercado Pago,
              transferencia o efectivo.
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

        {/* Cambiar de pestaña es la acción que MÁS se repite en esta página (13
            categorías). Antes cada clic reproducía un reveal escalonado con
            desenfoque por producto: 50 ms × n de espera para leer precios. Ahora
            el panel entero entra de una, en 140 ms y sin blur. */}
        <div key={active} className="swap-in grid gap-4 md:grid-cols-2">
          {group.items.map((it) => (
            <div
              key={it.name}
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
                {it.desc && <p className="mt-1 text-sm leading-relaxed text-ash">{it.desc}</p>}
                {it.combo && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
                    <Icon.Beer className="h-3.5 w-3.5" />+{it.combo.beers}{' '}
                    {it.combo.beers === 1 ? 'cerveza' : 'cervezas'} · {money(it.combo.price)}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2.5">
                {it.price != null && <Price value={it.price} />}
                <button
                  onClick={() => onAdd(it)}
                  /* Sin `hover:scale`: es una rejilla de hasta 9 botones
                     iguales y hacer que cada uno crezca al pasar el cursor
                     convierte la lista en un campo de saltitos. La respuesta
                     al hover es de brillo y sombra, que no mueve el layout. */
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-all duration-200 active:scale-95 ${
                    justAdded === it.name
                      ? 'bg-gold text-ink'
                      : 'bg-gradient-to-r from-crimson to-fire text-white hover:brightness-110 hover:shadow-lg hover:shadow-crimson/30'
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
            </div>
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
