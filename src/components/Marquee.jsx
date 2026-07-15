import { Icon } from './ui'

const words = ['Alitas', 'Boneless', 'Burgers', 'Costillas', 'Micheladas', 'Cerveza Artesanal', 'Papas Fogosas']

export default function Marquee() {
  const row = [...words, ...words]
  return (
    <div className="relative overflow-hidden border-y border-hairline bg-gradient-to-r from-crimson-2 via-crimson to-fire py-4">
      <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap" style={{ '--speed': '32s' }}>
        {row.map((w, i) => (
          <span key={i} className="inline-flex items-center gap-8 font-display text-2xl uppercase tracking-wide text-white/95">
            {w}
            <Icon.Flame className="h-5 w-5 text-gold" filled />
          </span>
        ))}
      </div>
    </div>
  )
}
