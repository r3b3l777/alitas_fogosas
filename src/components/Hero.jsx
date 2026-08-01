import { Embers, Icon, useParallax } from './ui'
import { branches, hoursToday, img } from '../data'

export default function Hero() {
  const imgRef = useParallax(0.1)
  return (
    <section id="top" className="ember-bg grain relative overflow-hidden pt-[68px]">
      <Embers count={16} />

      {/* glow orbs */}
      <div aria-hidden className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-fire/20 blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-crimson/25 blur-[100px]" />

      <div className="shell relative grid items-center gap-10 py-14 md:min-h-[calc(100dvh-68px)] md:grid-cols-2 md:gap-6 md:py-8">
        {/* Copy — centrado en móvil, alineado a la izquierda en desktop */}
        <div className="relative z-10 mx-auto max-w-xl text-center md:mx-0 md:text-left">
          <p className="kicker mb-5 load-in">
            <span className="h-px w-8 bg-gold" /> El fuego del buen comer
          </p>
          {/* h2, no h1: el h1 de la página es el título del hero 3D de arriba.
              Dos h1 rompen la jerarquía para lectores de pantalla. */}
          <h2 className="text-[clamp(2.75rem,9.5vw,6rem)] leading-[1.02] text-cream">
            <span className="line-mask">
              <span className="line-in" style={{ '--d': '0.06s' }}>Alitas que</span>
            </span>
            <span className="line-mask">
              <span className="line-in text-fire-gradient" style={{ '--d': '0.2s' }}>encienden</span>
            </span>
            <span className="line-mask">
              <span className="line-in" style={{ '--d': '0.34s' }}>tu pasión</span>
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-ash load-in md:mx-0" style={{ '--ld': '0.44s' }}>
            Las alitas más crujientes, bañadas en la salsa que elijas: son{' '}
            <span className="text-cream">11</span>, y <span className="text-gold">4 de la casa</span>{' '}
            con receta propia. Pide ahora y disfruta el fuego del buen comer, con cerveza y
            buena compañía.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 load-in md:justify-start" style={{ '--ld': '0.56s' }}>
            {/* CTA principal: el pedido se arma aquí mismo, sin salir a WhatsApp */}
            <a
              href="#menu"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-crimson to-fire px-7 py-4 text-base font-bold text-white glow-crimson transition-transform duration-200 hover:scale-[1.04] active:scale-95"
            >
              <Icon.Bag className="h-5 w-5" />
              Ver el menú completo
            </a>
            <a
              href="#salsas"
              className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white/5 px-7 py-4 text-base font-semibold text-cream backdrop-blur transition-colors hover:bg-white/10"
            >
              11 salsas
              <span className="rounded-full bg-gold px-2 py-0.5 text-[0.68rem] font-extrabold uppercase tracking-wide text-ink shadow-[0_4px_14px_-4px_rgba(247,183,51,0.75)]">
                4 de la casa
              </span>
            </a>
          </div>

          <div className="mt-9 flex items-center justify-center gap-5 text-sm text-ash load-in md:justify-start" style={{ '--ld': '0.68s' }}>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Icon.Star key={i} className="h-4 w-4 text-gold" />
              ))}
            </div>
            <span>Amado por los que se atreven a lo picoso</span>
          </div>
        </div>

        {/* Image */}
        <div ref={imgRef} className="relative z-10 mx-auto w-full max-w-md md:max-w-none">
          <div className="relative load-in" style={{ '--ld': '0.3s' }}>
            <div aria-hidden className="absolute inset-0 -m-6 rounded-full bg-gradient-to-tr from-fire/30 to-magenta/20 blur-3xl pulse-slow" />
            <img
              src={img.wingsFire}
              alt="Orden de alitas con salsa BBQ sobre fondo de fuego"
              width="720"
              height="720"
              loading="eager"
              fetchPriority="high"
              className="relative w-full rounded-[2rem] object-cover shadow-2xl ring-1 ring-white/10"
            />
            {/* floating price chip */}
            <div className="absolute bottom-4 left-4 glass rounded-2xl px-4 py-3 shadow-xl">
              <p className="font-display text-3xl leading-none text-fire-gradient">6 pzs</p>
              <p className="mt-1 text-xs font-medium text-ash">
                desde $95 · con vegetales, dip y tu salsa
              </p>
            </div>
            {/* rating chip */}
            <div className="absolute right-4 top-4 glass flex items-center gap-2 rounded-full px-3.5 py-2 shadow-lg">
              <Icon.Flame className="h-4 w-4 text-fire" filled />
              <span className="text-sm font-bold text-cream">11 salsas · 4 de la casa</span>
            </div>
          </div>
        </div>
      </div>

      {/* location strip */}
      <div className="relative z-10 border-t border-hairline bg-ink/40 load-in" style={{ '--ld': '0.8s' }}>
        <div className="shell flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-4 text-sm text-ash">
          {/* Las 3 sucursales, cada una a su ficha en Maps */}
          <span className="inline-flex items-center gap-x-2 gap-y-1 flex-wrap justify-center">
            <Icon.MapPin className="h-4 w-4 shrink-0 text-fire" />
            {branches.map((b, i) => (
              <span key={b.slug} className="inline-flex items-center gap-2">
                {i > 0 && <span aria-hidden="true" className="text-ash/40">·</span>}
                <a
                  href={b.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-cream"
                >
                  {b.name.replace('Sucursal ', '')}
                </a>
              </span>
            ))}
          </span>
          <span className="inline-flex items-center gap-2">
            <Icon.Clock className="h-4 w-4 text-fire" /> Abierto hoy · {hoursToday().h}
          </span>
          <span className="inline-flex items-center gap-2">
            <Icon.Whatsapp className="h-4 w-4 text-fire" /> Pedidos para llevar y a domicilio
          </span>
        </div>
      </div>
    </section>
  )
}
