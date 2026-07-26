import { Reveal, Icon } from './ui'
import { business, branches, waLink } from '../data'

function BranchCard({ b, i }) {
  return (
    <Reveal
      delay={i * 90}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-hairline bg-surface p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-fire/40"
    >
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-fire/10 blur-2xl transition-opacity duration-300 group-hover:bg-fire/20" />
      <div className="relative flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-crimson/15 text-fire">
          <Icon.MapPin className="h-5 w-5" />
        </span>
        <h3 className="font-display text-2xl tracking-wide text-cream">{b.name}</h3>
      </div>

      <div className="relative mt-5 space-y-3 text-sm">
        <p className="flex items-start gap-2.5 text-ash">
          <Icon.MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fire/80" />
          <span>
            {b.address}
            <br />
            {b.city}
          </span>
        </p>
        <p className="flex items-center gap-2.5 text-ash">
          <Icon.Phone className="h-4 w-4 shrink-0 text-fire/80" />
          <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-cream">
            {b.phone}
          </a>
        </p>
        <div className="flex items-start gap-2.5 text-ash">
          <Icon.Clock className="mt-0.5 h-4 w-4 shrink-0 text-fire/80" />
          <dl className="w-full space-y-0.5">
            {business.hours.map((h) => (
              <div key={h.d} className="flex justify-between gap-3">
                <dt>{h.d}</dt>
                <dd className="tabular-nums text-cream/90">{h.h}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-2.5">
        <a
          href={b.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white/5 px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-white/10"
        >
          <Icon.MapPin className="h-4 w-4 text-fire" /> Cómo llegar
        </a>
        <a
          href={waLink(`Hola 👋 quiero pedir en la ${b.name} de Alitas Fogosas`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-crimson to-fire px-4 py-2.5 text-sm font-bold text-white transition-transform duration-200 hover:scale-[1.04] active:scale-95"
        >
          <Icon.Whatsapp className="h-4 w-4" /> Pedir aquí
        </a>
        {b.uberEats && (
          <a
            href={b.uberEats}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white/5 px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-white/10"
          >
            <span aria-hidden className="h-2 w-2 rounded-full bg-[#06C167]" /> Uber Eats
          </a>
        )}
      </div>
    </Reveal>
  )
}

export default function Visit() {
  return (
    <section id="visita" className="edge-top relative scroll-mt-20 bg-ink-2/72 py-20 md:py-28">
      <div className="shell">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="kicker justify-center">Nuestras sucursales</p>
          <h2 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] text-cream">
            Te esperamos con el <span className="text-fire-gradient">comal caliente</span>
          </h2>
          <p className="mt-4 text-ash">
            Visítanos en cualquiera de nuestras sucursales en San Mateo Atenco. Servicio en
            local, para llevar y a domicilio.
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2">
          {branches.map((b, i) => (
            <BranchCard key={b.name} b={b} i={i} />
          ))}
        </div>

        <Reveal className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-hairline bg-gradient-to-r from-surface to-surface-2 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-display text-2xl text-cream">¿Se te antojaron?</p>
            <p className="text-sm text-ash">Haz tu pedido y te lo preparamos al momento.</p>
          </div>
          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-gradient-to-r from-crimson to-fire px-7 py-4 font-bold text-white transition-transform duration-200 hover:scale-[1.04] active:scale-95"
          >
            <Icon.Whatsapp className="h-5 w-5" /> Ordena por WhatsApp
          </a>
        </Reveal>
      </div>
    </section>
  )
}
