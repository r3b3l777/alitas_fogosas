import { Logo, Icon } from './ui'
import { business, waLink } from '../data'

const nav = [
  { href: '#menu', label: 'Menú' },
  { href: '#salsas', label: 'Salsas' },
  { href: '#bebidas', label: 'Bebidas' },
  { href: '#visita', label: 'Visítanos' },
]

export default function Footer() {
  return (
    <footer className="edge-top relative z-10">
      <div className="shell py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <a href="#top" className="text-crimson" aria-label="Alitas Fogosas — inicio">
              <Logo />
            </a>
            <p className="mt-4 text-ash">{business.subtitle}. Alitas, burgers, costillas y las mejores micheladas.</p>
            <div className="mt-5 flex gap-3">
              <a
                href={business.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-hairline text-ash transition-colors hover:border-fire/50 hover:text-fire"
              >
                <Icon.Instagram className="h-5 w-5" />
              </a>
              <a
                href={business.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-hairline text-ash transition-colors hover:border-fire/50 hover:text-fire"
              >
                <Icon.Facebook className="h-5 w-5" />
              </a>
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-hairline text-ash transition-colors hover:border-fire/50 hover:text-fire"
              >
                <Icon.Whatsapp className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-ash-dim">Explora</p>
              <ul className="space-y-2.5">
                {nav.map((n) => (
                  <li key={n.href}>
                    <a href={n.href} className="text-ash transition-colors hover:text-cream">
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-ash-dim">Encuéntranos</p>
              <ul className="space-y-2.5 text-ash">
                <li className="flex items-start gap-2">
                  <Icon.MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fire" />
                  <span>{business.address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon.Phone className="h-4 w-4 shrink-0 text-fire" />
                  <span>{business.phone}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon.Clock className="h-4 w-4 shrink-0 text-fire" />
                  <span>{business.hours[0].h}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* En móvil esta fila cae justo sobre la pila de alitas del canvas, así
            que lleva un velo opaco; en pantallas grandes queda limpia. */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 rounded-2xl border-t border-hairline bg-ink/88 px-4 py-6 text-sm text-ash-dim backdrop-blur sm:flex-row sm:rounded-none sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-6 sm:backdrop-blur-none">
          <p>© {new Date().getFullYear()} {business.name}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="transition-colors hover:text-ash">Términos y Condiciones</a>
            <a href="#" className="transition-colors hover:text-ash">Aviso de Privacidad</a>
            {/* Entrada al panel del personal: discreta, pero legible. En móvil
                va en una píldora opaca porque si no, la comida que cae por
                detrás del footer se come la letra. */}
            <a
              href="#empleados"
              title="Acceso del personal"
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-hairline bg-ink/80 px-4 text-ash transition-colors hover:text-cream sm:min-h-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:text-ash-dim/45 sm:hover:text-ash"
            >
              · Personal
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
