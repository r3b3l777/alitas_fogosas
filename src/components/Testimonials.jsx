import { Reveal, Icon } from './ui'
import { testimonials } from '../data'

export default function Testimonials() {
  return (
    <section className="relative py-14 md:py-20">
      <div className="shell">
        <Reveal className="mx-auto mb-9 max-w-2xl text-center">
          <p className="kicker justify-center">Lo que dicen</p>
          <h2 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] text-cream">
            Historias de <span className="text-fire-gradient">paladares felices</span>
          </h2>
        </Reveal>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 100}
              className="glass flex h-full flex-col rounded-3xl p-7"
            >
              <div className="mb-4 flex items-center gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Icon.Star key={j} className="h-5 w-5 text-gold" />
                ))}
              </div>
              <p className="flex-1 text-lg leading-relaxed text-cream">“{t.text}”</p>
              <div className="mt-6 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt=""
                  loading="lazy"
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-fire/40"
                />
                <div>
                  <p className="font-semibold text-cream">{t.name}</p>
                  <p className="text-xs text-ash">Cliente verificado</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
