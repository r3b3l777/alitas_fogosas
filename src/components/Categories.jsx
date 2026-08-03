import { Reveal, Icon } from './ui'
import { categories } from '../data'

function CategoryCard({ c, delay = 0 }) {
  return (
    <a
      href="#menu"
      className="group relative block h-full overflow-hidden rounded-3xl border border-hairline bg-surface transition-transform duration-300 hover:-translate-y-1.5"
      aria-label={`${c.name} — ver opciones en el menú`}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Reveal bare delay={delay} className="clip-up absolute inset-0">
          <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
        </Reveal>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-2xl text-cream">{c.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-ash">{c.desc}</p>
          {/* En pantalla táctil no hay hover: si se deja en opacity-0 la pista
              de "esto se toca" nunca aparece. Sólo se esconde donde SÍ hay
              cursor fino, y vuelve con el foco de teclado. */}
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-fire transition-opacity duration-300 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-focus-visible:opacity-100">
            Ver opciones <Icon.Arrow className="h-4 w-4" />
          </span>
        </div>
      </div>
    </a>
  )
}

export default function Categories() {
  return (
    <section className="relative py-14 md:py-20">
      <div className="shell">
        <Reveal className="mx-auto mb-9 max-w-2xl text-center">
          <p className="kicker justify-center">Nuestra carta</p>
          <h2 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] text-cream">
            Hay para <span className="text-fire-gradient">todos</span>
          </h2>
          <p className="mt-4 text-ash">
            Aquí nadie se queda sin su sabor favorito. Elige tu antojo y nosotros le ponemos el fuego.
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Reveal key={c.id} delay={i * 90}>
              <CategoryCard c={c} delay={i * 90} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
