/* ============================================================================
   RED DE SEGURIDAD
   ----------------------------------------------------------------------------
   Si algo revienta en tiempo de ejecución (WebGL que no arranca, un dato
   corrupto en localStorage, una extensión del navegador que estorba), React
   desmonta TODO el árbol y el visitante se queda con una pantalla en blanco:
   parece que el sitio "se cerró". Con esto ve una salida decente y el negocio
   no pierde el pedido: teléfono y WhatsApp siguen a la vista.

   Ojo: esto atrapa errores de render. Los errores fuera de React (dentro de un
   requestAnimationFrame, por ejemplo) no pasan por aquí, por eso el canvas y
   el hero 3D llevan además sus propios try/catch.
   ========================================================================== */
import { Component } from 'react'
import { WHATSAPP, business } from '../data'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    // Sin servicio de telemetría: al menos queda en la consola del navegador
    // para cuando alguien reporte "no me carga".
    console.error('[Alitas Fogosas] error en pantalla:', error, info?.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink px-6 py-16 text-center">
        <div className="max-w-md">
          <p className="kicker justify-center">Se nos quemó algo</p>
          <h1 className="mt-4 font-display text-4xl text-cream">
            La página no cargó bien
          </h1>
          <p className="mt-4 text-ash">
            Recarga y debería volver. Si sigue igual, pide directo por WhatsApp o
            por teléfono, que ahí te atendemos igual de rápido.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-crimson to-fire px-7 font-bold text-white"
            >
              Recargar
            </button>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-hairline px-7 font-semibold text-cream"
            >
              Pedir por WhatsApp
            </a>
          </div>
          <p className="mt-6 text-sm text-ash-dim">
            O llámanos al{' '}
            <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="text-gold">
              {business.phone}
            </a>
          </p>
        </div>
      </div>
    )
  }
}
