import { Reveal, useParallax, Icon } from './ui'
import { img, waLink } from '../data'

export default function Cinematic() {
  const bgRef = useParallax(0.22)
  return (
    <section className="relative flex min-h-[80dvh] items-center justify-center overflow-hidden md:min-h-[90dvh]">
      {/* Parallax image layer (oversized so translate never reveals edges) */}
      <div ref={bgRef} className="absolute inset-x-0 -top-[12%] h-[124%]">
        <img
          src={img.wingsNeon}
          alt="Alitas fogosas recién servidas"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      {/* Cinematic scrims */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/70" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent,rgba(11,7,5,0.75))]" />

      <div className="shell relative z-10 text-center">
        <Reveal>
          <p className="kicker justify-center">Hecho con fuego</p>
        </Reveal>
        <h2 className="mt-5 text-[clamp(2.75rem,10vw,7rem)] leading-[0.95] text-cream">
          <span className="line-mask">
            <span className="line-in" style={{ '--d': '0.05s' }}>El fuego del</span>
          </span>
          <span className="line-mask">
            <span className="line-in text-fire-gradient" style={{ '--d': '0.18s' }}>buen comer</span>
          </span>
        </h2>
        <Reveal delay={200} className="mx-auto mt-6 max-w-xl text-lg text-ash">
          Cada orden se prepara al momento, se baña en salsa de la casa y se sirve
          bien caliente. Así se enciende el paladar.
        </Reveal>
        <Reveal delay={300}>
          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-crimson to-fire px-7 py-4 font-bold text-white glow-crimson transition-transform duration-200 hover:scale-[1.04] active:scale-95"
          >
            <Icon.Whatsapp className="h-5 w-5" /> Ordena ahora
          </a>
        </Reveal>
      </div>
    </section>
  )
}
