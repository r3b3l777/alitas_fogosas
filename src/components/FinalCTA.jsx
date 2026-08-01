import { Reveal, Icon, Embers } from './ui'

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-crimson-2/30 via-transparent to-transparent" />
      <div className="shell">
        <Reveal className="ember-bg grain relative overflow-hidden rounded-[2.5rem] border border-hairline px-6 py-16 text-center md:px-16 md:py-20">
          <Embers count={18} />
          <div aria-hidden className="pointer-events-none absolute -left-10 top-0 h-64 w-64 rounded-full bg-fire/25 blur-[90px]" />
          <div aria-hidden className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-crimson/30 blur-[90px]" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <p className="kicker justify-center">El antojo no espera</p>
            <h2 className="mt-5 text-[clamp(2.5rem,8vw,5rem)] leading-[0.9] text-cream">
              Haz volar tu <span className="text-fire-gradient">paladar</span>
            </h2>
            <p className="mt-5 text-lg text-ash">
              Elige entre 11 salsas —4 de ellas de la casa— y arma tu orden en un minuto. Para
              llevar o a domicilio.
            </p>
            {/* Sin logo de WhatsApp y sin salir del sitio: el pedido se arma
                aquí y de ahí sale solo. Sacar al cliente a un chat vacío en el
                último empujón era pedirle que escribiera su orden a mano. */}
            <a
              href="#menu"
              className="group mt-9 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-crimson to-fire px-9 py-5 text-lg font-bold text-white glow-crimson transition-transform duration-200 hover:scale-[1.04] active:scale-95"
            >
              <Icon.Bag className="h-6 w-6" />
              Haz tu pedido aquí
              <Icon.Arrow className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
            <p className="mt-4 text-sm text-ash-dim">
              Te confirmamos tiempo y disponibilidad por WhatsApp antes de preparar.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
