/* ============================================================================
   CUPO DEL DÍA
   ----------------------------------------------------------------------------
   La cocina recibe máximo 300 pedidos al día. Este hook lee el contador y se
   suscribe a los cambios, para que el aviso de "quedan pocos" o "por hoy ya no"
   aparezca sin recargar, incluso en una pestaña que lleva rato abierta.

   El tope de verdad lo aplica Postgres al registrar el pedido. Esto es para
   avisarle al cliente ANTES de que arme una orden que ya no se puede recibir.
   ============================================================================ */
import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { DAILY_LIMIT, fetchOrdersStatus } from '../lib/orders'

export function useOrdersQuota() {
  const [quota, setQuota] = useState(null)

  const refresh = useCallback(async () => {
    const q = await fetchOrdersStatus()
    if (q) setQuota(q)
  }, [])

  useEffect(() => {
    if (!supabaseReady) return
    let alive = true
    fetchOrdersStatus().then((q) => {
      if (alive && q) setQuota(q)
    })

    const channel = supabase
      .channel('order_counter_stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_counter' },
        (payload) => {
          const used = Number(payload.new?.count)
          if (!Number.isFinite(used)) return
          setQuota((prev) => {
            const limit = prev?.limit ?? DAILY_LIMIT
            return { used, limit, remaining: Math.max(0, limit - used) }
          })
        },
      )
      .subscribe()

    /* Una pestaña abierta desde ayer mostraría el cupo de ayer: al volver a
       ella se vuelve a preguntar. */
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return {
    quota,
    refresh,
    /** Cupo agotado — sólo cuando el servidor lo confirma, nunca por omisión. */
    full: Boolean(quota && quota.remaining <= 0),
    /** Recta final: vale la pena avisar que va a cerrar. */
    low: Boolean(quota && quota.remaining > 0 && quota.remaining <= 25),
  }
}
