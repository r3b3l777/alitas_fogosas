import { Reveal, Heat, Icon } from './ui'
import { sauces } from '../data'

export default function Sauces() {
  return (
    <section id="salsas" className="relative scroll-mt-20 py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-magenta/10 blur-[100px]" />
      <div className="shell relative">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="kicker justify-center">11 salsas de la casa</p>
          <h2 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] text-cream">
            Elige tu nivel de <span className="text-fire-gradient">fuego</span>
          </h2>
          <p className="mt-4 text-ash">
            Desde lo cremosito hasta la de los valientes. Todas hechas en casa.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sauces.map((s, i) => (
            <Reveal
              key={s.name}
              replay
              delay={(i % 3) * 70}
              className="group relative overflow-hidden rounded-2xl border border-hairline bg-surface p-6 transition-all duration-300 hover:border-fire/40 hover:bg-surface-2"
            >
              <div
                aria-hidden
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-fire/10 blur-2xl transition-opacity duration-300 group-hover:bg-fire/20"
              />
              <div className="relative flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span aria-hidden className="swatch h-5 w-5 shrink-0 rounded-full" style={{ '--sc': s.color }} />
                  <h3 className="font-display text-2xl tracking-wide text-cream">{s.name}</h3>
                </span>
                {s.popular && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-crimson/15 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-crimson">
                    <Icon.Flame className="h-3 w-3" filled /> Top
                  </span>
                )}
              </div>
              <p className="relative mt-2 text-sm leading-relaxed text-ash">{s.desc}</p>
              <div className="relative mt-5 flex items-center justify-between">
                <Heat level={s.heat} />
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    ['', 'text-gold/80', 'text-fire', 'text-[#ff5252]'][s.heat]
                  }`}
                >
                  {['', 'Suave', 'Picosa', 'Valientes'][s.heat]}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
