import { Reveal } from './ui'
import { drinks } from '../data'

export default function Drinks() {
  return (
    <section id="bebidas" className="edge-top relative scroll-mt-20 bg-ink-2/72 py-20 md:py-28">
      <div className="shell">
        <Reveal className="mb-12 max-w-2xl">
          <p className="kicker">Bebidas preferidas</p>
          <h2 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] text-cream">
            Bebidas que <span className="text-fire-gradient">refrescan</span> el fuego
          </h2>
          <p className="mt-4 text-ash">
            Gomichelas, megatarros, cócteles de colores y nuestra propia cerveza artesanal.
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {drinks.map((d, i) => (
            <Reveal key={d.name} delay={i * 90}>
              <article className="group h-full overflow-hidden rounded-3xl border border-hairline bg-surface transition-transform duration-300 hover:-translate-y-1.5">
                <div className="relative aspect-square overflow-hidden">
                  <Reveal bare delay={i * 90} className="clip-up absolute inset-0">
                    <img src={d.image} alt={d.name} loading="lazy" className="h-full w-full object-cover" />
                  </Reveal>
                  <div className="absolute inset-0 bg-gradient-to-t from-surface/90 to-transparent" />
                  {d.price != null && (
                    <span className="absolute right-4 top-4 rounded-full bg-ink/70 px-3 py-1.5 font-display text-lg tabular-nums text-fire-gradient backdrop-blur">
                      ${d.price}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-2xl tracking-wide text-cream">{d.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ash">{d.desc}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
