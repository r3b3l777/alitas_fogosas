/* ============================================================================
   AVISO DE DEMANDA
   Barra bajo el nav cuando alguna sucursal trae mucha demanda, con su liga
   directa a Uber Eats. Se puede cerrar; vuelve a salir si cambia el estado.
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

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-[68px] z-40 border-b border-crimson/30 bg-gradient-to-r from-crimson/95 to-fire/90 backdrop-blur"
    >
      <div className="shell flex items-center gap-3 py-2.5">
        <Icon.Flame className="h-4 w-4 shrink-0 text-gold" filled />
        <p className="min-w-0 flex-1 text-sm text-white">
          <strong>{many ? 'Varias sucursales' : saturated[0].name}</strong>{' '}
          {many ? 'traen' : 'trae'} mucha demanda.{' '}
          {!many && noteFor(saturated[0].slug)
            ? noteFor(saturated[0].slug)
            : 'Pide por Uber Eats y evita la espera:'}{' '}
          {saturated.map((b, i) => (
            <span key={b.slug}>
              {i > 0 && ' · '}
              <a
                href={b.uberEats}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-2"
              >
                {many ? b.name.replace('Sucursal ', '') : 'Abrir Uber Eats'}
              </a>
            </span>
          ))}
        </p>
        <button
          onClick={() => setDismissed(signature)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:text-white"
          aria-label="Cerrar aviso"
        >
          <Icon.Close className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
