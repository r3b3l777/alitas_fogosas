import { Logo, Icon } from './ui'
import { business, hoursToday, waLink } from '../data'

const nav = [
  { href: '#menu', label: 'Menú' },
  { href: '#salsas', label: 'Salsas' },
  { href: '#bebidas', label: 'Bebidas' },
  { href: '#visita', label: 'Visítanos' },
]

export default function Footer() {
  return (
    <footer className="edge-top relative z-10">
      <div className="shell py-10">
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
                  <span>Hoy · {hoursToday().h}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Esta fila cae justo sobre la pila de alitas del canvas, así que
            lleva un velo opaco. Antes el velo se apagaba con `sm:` y en
            escritorio la letra volvía a competir con la comida; ahora la
            tarjeta es la misma en todos los tamaños y sólo cambia el eje
            (columna en móvil, fila en escritorio). */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 rounded-2xl border border-hairline bg-ink/88 px-4 py-5 text-sm text-ash-dim backdrop-blur sm:flex-row sm:gap-6 sm:px-6 sm:py-3.5">
          <p>© {new Date().getFullYear()} {business.name}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            {/* Ojo: aquí vivían "Términos" y "Aviso de Privacidad" apuntando a
                `#`. Un enlace que no lleva a ningún lado es peor que no tenerlo;
                cuando existan esas páginas, se vuelven a poner con su URL. */}
            <a
              href={`mailto:${business.email}`}
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-hairline bg-ink/80 px-4 text-ash transition-colors hover:text-cream sm:min-h-9"
            >
              Contacto
            </a>
            {/* Entrada al panel del personal: discreta, pero legible. Va en
                una píldora opaca en TODOS los tamaños — la comida que cae por
                detrás del footer se comía la letra también en escritorio. */}
            <a
              href="#empleados"
              title="Acceso del personal"
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-hairline bg-ink/80 px-4 text-ash transition-colors hover:text-cream sm:min-h-9"
            >
              · Personal
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
