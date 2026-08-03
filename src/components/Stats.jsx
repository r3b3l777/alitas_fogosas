import { Reveal, useCountUp } from './ui'

const stats = [
  { value: 11, suffix: '', label: 'Salsas · 4 de la casa' },
  { value: 8, suffix: '', label: 'Antojos en el menú' },
  { value: 3, suffix: '', label: 'Sucursales' },
  { value: 100, suffix: '%', label: 'Sabor que enciende' },
]

function Stat({ s }) {
  const [ref, n] = useCountUp(s.value)
  return (
    <div className="text-center">
      <p ref={ref} className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-none text-fire-gradient tabular-nums">
        {n}
        {s.suffix}
      </p>
      <p className="mt-2 text-sm font-medium uppercase tracking-widest text-ash">{s.label}</p>
    </div>
  )
}

export default function Stats() {
  return (
    <section className="relative py-10 md:py-12">
      <div className="shell">
        <Reveal className="grid grid-cols-2 gap-y-10 gap-x-6 md:grid-cols-4">
          {stats.map((s) => (
            <Stat key={s.label} s={s} />
          ))}
        </Reveal>
      </div>
    </section>
  )
}
