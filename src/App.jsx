import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Stats from './components/Stats'
import Categories from './components/Categories'
import Cinematic from './components/Cinematic'
import Menu from './components/Menu'
import Sauces from './components/Sauces'
import Drinks from './components/Drinks'
import Testimonials from './components/Testimonials'
import Visit from './components/Visit'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'
import { Icon, ScrollProgress, useSmoothScroll } from './components/ui'
import { waLink } from './data'

export default function App() {
  useSmoothScroll()
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-crimson focus:px-5 focus:py-3 focus:font-bold focus:text-white"
      >
        Saltar al contenido
      </a>
      <ScrollProgress />
      <Nav />
      <main id="contenido">
        <Hero />
        <Marquee />
        <Stats />
        <Categories />
        <Cinematic />
        <Menu />
        <Sauces />
        <Drinks />
        <Testimonials />
        <Visit />
        <FinalCTA />
      </main>
      <Footer />

      {/* Floating WhatsApp button (mobile-first quick order) */}
      <a
        href={waLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ordena por WhatsApp"
        style={{
          bottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
          right: 'calc(1.25rem + env(safe-area-inset-right))',
        }}
        className="fixed z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-crimson to-fire text-white shadow-xl glow-crimson transition-transform duration-200 hover:scale-110 active:scale-95 md:h-16 md:w-16"
      >
        <span aria-hidden className="absolute inset-0 rounded-full bg-fire/40 pulse-slow" />
        <Icon.Whatsapp className="relative h-7 w-7 md:h-8 md:w-8" />
      </a>
    </>
  )
}
