/* ============================================================================
   SALSAS
   ----------------------------------------------------------------------------
   Once en total, partidas en dos grupos que NO son cosmética:

     · 4 DE LA CASA — receta propia (ver el porqué de cada una en data.js).
     · 7 de catálogo — BBQ, lemon pepper, ajo parmesano y compañía.

   Los conteos se derivan de `sauces`, nunca se escriben a mano: la última vez
   que estuvieron duros en el texto quedaron desfasados en tres archivos.
   ============================================================================ */
import { Reveal, Heat, Icon } from './ui'
import { sauces } from '../data'

const house = sauces.filter((s) => s.house)
const rest = sauces.filter((s) => !s.house)

const LEVEL = ['', 'Suave', 'Picosa', 'Valientes']
const LEVEL_TONE = ['', 'text-gold/80', 'text-fire', 'text-[#ff5252]']

function SauceCard({ s, i }) {
  return (
    <Reveal
      replay
      delay={(i % 3) * 70}
      /* Las de la casa se distinguen por el filo dorado, no por otro tipo de
         tarjeta: mismo componente, misma lectura, distinto acento. */
      /* `flex-col` + el `mt-auto` del pie: "Original de la Casa" ocupa tres
         renglones donde las demás ocupan dos, y sin esto el medidor de picor
         quedaba a distinta altura en cada tarjeta de la misma fila. */
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surface p-6 transition-all duration-300 hover:bg-surface-2 ${
        s.house ? 'border-gold/35 hover:border-gold/60' : 'border-hairline hover:border-fire/40'
      }`}
    >
      <div
        aria-hidden
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300 ${
          s.house ? 'bg-gold/12 group-hover:bg-gold/20' : 'bg-fire/10 group-hover:bg-fire/20'
        }`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="swatch h-5 w-5 shrink-0 rounded-full" style={{ '--sc': s.color }} />
          <h3 className="font-display text-2xl tracking-wide text-cream">{s.name}</h3>
        </span>
        {s.house ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-gold">
            <Icon.Star className="h-3 w-3" /> De la casa
          </span>
        ) : s.popular ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-crimson/15 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-crimson">
            <Icon.Flame className="h-3 w-3" filled /> Top
          </span>
        ) : null}
      </div>
      <p className="relative mt-2 text-sm leading-relaxed text-ash">{s.desc}</p>
      <div className="relative mt-auto flex items-center justify-between pt-5">
        <Heat level={s.heat} />
        <span className={`text-xs font-bold uppercase tracking-wider ${LEVEL_TONE[s.heat]}`}>
          {LEVEL[s.heat]}
        </span>
      </div>
    </Reveal>
  )
}

export default function Sauces() {
  return (
    <section id="salsas" className="relative scroll-mt-20 py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-magenta/10 blur-[100px]" />
      <div className="shell relative">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          {/* El número grande es el catálogo completo; la insignia dorada es el
              argumento. Encabezar con "4 de la casa" hacía parecer que hay
              pocas — son once. */}
          <p className="kicker justify-center">Carta de salsas</p>
          <h2 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] text-cream">
            {sauces.length} salsas, elige tu nivel de{' '}
            <span className="text-fire-gradient">fuego</span>
          </h2>
          <p className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 text-ash">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-sm font-extrabold uppercase tracking-wide text-ink shadow-[0_6px_20px_-6px_rgba(247,183,51,0.8)]">
              <Icon.Star className="h-3.5 w-3.5" />
              {house.length} son de la casa
            </span>
            <span>receta propia, no las encuentras en otro lado.</span>
          </p>
          <p className="mt-3 text-ash">
            Desde lo cremosito hasta la de los valientes. Hasta 3 por orden, sin costo extra.
          </p>
        </Reveal>

        {/* Las de la casa van primero: son el argumento, no el pie de página. */}
        <Reveal className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-display text-2xl text-gold">Las {house.length} de la casa</h3>
          <p className="text-sm text-ash-dim">Nuestras recetas, las que nos dieron nombre.</p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {house.map((s, i) => (
            <SauceCard key={s.name} s={s} i={i} />
          ))}
        </div>

        <Reveal className="mb-4 mt-12 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-display text-2xl text-cream">Y otras {rest.length} para elegir</h3>
          <p className="text-sm text-ash-dim">Las de siempre, igual de bien hechas.</p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((s, i) => (
            <SauceCard key={s.name} s={s} i={i} />
          ))}
        </div>

      </div>
    </section>
  )
}
