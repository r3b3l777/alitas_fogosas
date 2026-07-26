import Nav from './components/Nav'
import HorizonHero from './components/HorizonHero'
import Hero from './components/Hero'
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
import FallingFeast from './components/FallingFeast'
import CartDrawer from './components/CartDrawer'
import DemandBanner from './components/DemandBanner'
import StaffPanel from './components/StaffPanel'
import { ScrollProgress, useSmoothScroll } from './components/ui'
import { CartProvider } from './store/cart'
import { StatusProvider } from './store/status'

export default function App() {
  useSmoothScroll()
  return (
    <StatusProvider>
      <CartProvider>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-crimson focus:px-5 focus:py-3 focus:font-bold focus:text-white"
        >
          Saltar al contenido
        </a>
        <FallingFeast />
        <ScrollProgress />
        <Nav />
        <DemandBanner />
        <main id="contenido" className="relative z-10">
          <HorizonHero />
          <Hero />
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

        {/* Pedido: botón flotante (izquierda) + panel lateral */}
        <CartDrawer />

        {/* Uso interno: alitasfogosas.com/#empleados */}
        <StaffPanel />
      </CartProvider>
    </StatusProvider>
  )
}
