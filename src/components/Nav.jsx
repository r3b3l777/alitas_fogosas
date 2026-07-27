import { useEffect, useRef, useState } from 'react'
import { Logo, Icon, useFocusTrap } from './ui'

const links = [
  { href: '#menu', label: 'Menú' },
  { href: '#salsas', label: 'Salsas' },
  { href: '#bebidas', label: 'Bebidas' },
  { href: '#visita', label: 'Sucursales' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const closeBtnRef = useRef(null)
  const openBtnRef = useRef(null)
  const drawerRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll-spy: marcar en qué sección va el usuario. Sin esto la barra no dice
  // nunca dónde estás parado (nav-state-active).
  useEffect(() => {
    const targets = links
      .map((l) => document.querySelector(l.href))
      .filter(Boolean)
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setCurrent(`#${visible.target.id}`)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])

  // Nota: NO bloqueamos el scroll a propósito — el drawer es de vidrio y se
  // ve/scrollea el contenido detrás (efecto liquid glass).

  // Cerrar con Escape + enfocar el botón de cierre al abrir; al cerrar, el
  // foco regresa al botón de hamburguesa (si no, queda en la nada).
  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      openBtnRef.current?.focus()
    }
  }, [open])

  useFocusTrap(drawerRef, open)

  return (
    <>
    <header
      className={`load-down fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-hairline bg-ink/85 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <nav className="shell flex h-[68px] items-center justify-between">
        <a href="#top" className="text-crimson transition-transform hover:scale-[1.03]" aria-label="Alitas Fogosas — inicio">
          <Logo />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={current === l.href ? 'true' : undefined}
              className={`relative text-sm font-medium tracking-wide transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:rounded-full after:bg-gradient-to-r after:from-crimson after:to-fire after:transition-all after:duration-300 ${
                current === l.href
                  ? 'text-cream after:w-full'
                  : 'text-ash after:w-0 hover:text-cream hover:after:w-full'
              }`}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#menu"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-crimson to-fire px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform duration-200 hover:scale-[1.04] active:scale-95"
          >
            <Icon.Bag className="h-4 w-4" />
            Ordena ya
          </a>
        </div>

        <button
          ref={openBtnRef}
          onClick={() => setOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-cream md:hidden"
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <Icon.Menu className="h-6 w-6" />
        </button>
      </nav>
    </header>

      {/* Mobile drawer — sibling of <header> so the header's backdrop-filter
          never turns it into a containing block or bleeds glass into it */}
      {/* `inert` (no sólo aria-hidden): sin él, los enlaces del drawer cerrado
          siguen en el orden de tabulación y el teclado se pierde ahí dentro */}
      <div
        className={`fixed inset-0 z-[70] md:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className={`absolute right-0 top-0 h-full w-[82%] max-w-sm border-l border-white/10 bg-ink/50 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-5">
            <Logo className="text-crimson" />
            <button
              ref={closeBtnRef}
              onClick={() => setOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-cream"
              aria-label="Cerrar menú"
            >
              <Icon.Close className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-col gap-1 px-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={current === l.href ? 'true' : undefined}
                className={`rounded-xl px-4 py-4 text-lg font-semibold transition-colors ${
                  current === l.href
                    ? 'bg-fire/12 text-fire'
                    : 'text-cream hover:bg-white/5'
                }`}
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="px-4 pt-4">
            <a
              href="#menu"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-crimson to-fire px-5 py-4 text-base font-bold text-white"
            >
              <Icon.Bag className="h-5 w-5" />
              Arma tu pedido
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
