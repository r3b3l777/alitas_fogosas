/* ============================================================================
   AVISO DE DEMANDA
   Cuando una sucursal trae mucha demanda, avisamos y mandamos a Uber Eats.

   Es una tarjeta flotante bajo el nav, de vidrio oscuro con filo carmesí, en
   móvil y en escritorio. Antes era una barra naranja de borde a borde, pero
   competía de tú a tú con el volcán del hero (misma paleta) y se leía como
   banner de cookies. Cambia sólo la disposición: en móvil el texto y el botón
   se apilan y el botón ocupa todo el ancho; en escritorio van en fila.
   Se puede cerrar; vuelve a salir si cambia el conjunto de sucursales.
   ============================================================================ */
import { useEffect, useState } from 'react'
import { Icon } from './ui'
import { useStatus } from '../store/status'

export default function DemandBanner() {
  const { saturated, noteFor } = useStatus()
  const [dismissed, setDismissed] = useState('')

  // La "firma" cambia cuando cambia el conjunto de sucursales saturadas, así
  // que un aviso cerrado no esconde un estado nuevo.
  const signature = saturated.map((b) => b.slug).join(',')

  useEffect(() => {
    setDismissed((d) => (d === signature ? d : ''))
  }, [signature])

  if (saturated.length === 0 || dismissed === signature) return null

  const many = saturated.length > 1
  const note = many ? null : noteFor(saturated[0].slug)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[68px] z-40 md:px-8"
    >
      {/* Liquid glass: el fondo se ve a través (blur + saturación), un filo de
          luz arriba y sombra abajo para que la tarjeta parezca un cristal
          apoyado sobre la página. El tinte `ink/55` no es decorativo: sin él,
          sobre el volcán del hero la letra se pierde. */}
      <div className="pointer-events-auto relative mx-3 mt-2 overflow-hidden rounded-2xl border border-crimson/35 bg-ink/55 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-2xl backdrop-saturate-150 md:mx-auto md:mt-3 md:max-w-3xl">
        {/* Brillo especular y calor de marca, por encima del blur */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/12 via-white/0 to-black/25"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-20 h-40 w-40 rounded-full bg-crimson/25 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-3 px-5 py-4 text-center md:flex-row md:justify-center md:gap-4 md:px-14 md:py-3.5">
          {/* La flama va en su propia insignia: suelta sobre el fondo oscuro
              el dorado se pierde. */}
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-crimson/20 ring-1 ring-crimson/50">
            <Icon.Flame className="h-5 w-5 text-gold" filled />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-cream">
              {many ? 'Varias sucursales' : saturated[0].name}{' '}
              {many ? 'traen' : 'trae'} mucha demanda.
            </p>
            <p className="text-sm text-ash">
              {note || 'Pide por Uber Eats y te lo llevan sin esperar.'}
            </p>
          </div>

          {/* En móvil el botón cae debajo y ocupa todo el ancho: es la acción
              que queremos que se toque, no un enlace perdido en el texto. */}
          <div className="flex w-full shrink-0 flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center">
            {saturated.map((b) => (
              <a
                key={b.slug}
                href={b.uberEats}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-crimson to-fire px-4 text-sm font-bold text-white transition-transform duration-200 hover:scale-[1.04] active:scale-95 md:min-h-10"
              >
                {many ? b.name.replace('Sucursal ', '') : 'Abrir Uber Eats'}
                <Icon.Arrow className="h-4 w-4" />
              </a>
            ))}
          </div>

          <button
            onClick={() => setDismissed(signature)}
            className="absolute right-2 top-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ash transition-colors hover:text-cream md:right-3 md:top-1/2 md:-translate-y-1/2"
            aria-label="Cerrar aviso"
          >
            <Icon.Close className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
