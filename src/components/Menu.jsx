import { useState } from 'react'
import { Reveal, Icon } from './ui'
import { menu, waLink } from '../data'

function Price({ value }) {
  return (
    <span className="shrink-0 font-display text-xl tabular-nums text-fire-gradient">
      ${value}
    </span>
  )
}

export default function Menu() {
  const [active, setActive] = useState(menu[0].id)
  const group = menu.find((m) => m.id === active) ?? menu[0]

  return (
    <section id="menu" className="edge-top relative scroll-mt-20 bg-ink-2 py-20 md:py-28">
      <div className="shell">
        <Reveal className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="kicker">El menú</p>
            <h2 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] text-cream">
              Pide lo que se te <span className="text-fire-gradient">antoje</span>
            </h2>
          </div>
          <p className="text-sm text-ash-dim">Precios del menú oficial en MXN · sujetos a cambio.</p>
        </Reveal>

        {/* Category tabs */}
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

        {/* Items */}
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
              {it.price != null && <Price value={it.price} />}
            </Reveal>
          ))}
        </div>

        {group.note && (
          <p className="mt-6 text-center text-sm text-ash-dim">{group.note}</p>
        )}

        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-hairline bg-gradient-to-r from-surface to-surface-2 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-display text-2xl text-cream">¿Listo para pedir?</p>
            <p className="text-sm text-ash">Arma tu orden y te la preparamos al momento.</p>
          </div>
          <a
            href={waLink('Hola 👋 quiero ordenar del menú de Alitas Fogosas')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-gradient-to-r from-crimson to-fire px-7 py-4 font-bold text-white transition-transform duration-200 hover:scale-[1.04] active:scale-95"
          >
            <Icon.Whatsapp className="h-5 w-5" /> Ordena por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
