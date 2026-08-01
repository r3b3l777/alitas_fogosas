/* ============================================================================
   PEDIDOS — puente con Supabase
   ----------------------------------------------------------------------------
   El pedido sigue saliendo por WhatsApp (ese camino nunca se rompe), pero
   además se registra aquí para que caiga en el panel de empleados.

   Todo pasa por la función `place_order` de Postgres: el visitante no tiene
   permiso de escribir en la tabla `orders`, así que el tope de 300 pedidos al
   día y la validación no se pueden saltar desde la consola del navegador.

   Sin credenciales de Supabase, `placeOrder` avisa que no hay registro y el
   sitio se comporta como antes: puro WhatsApp.
   ============================================================================ */
import { supabase, supabaseReady } from './supabase'

/** Tope diario. El número que manda es el de Postgres; éste es sólo para
    pintar "quedan N de 300" antes de la primera respuesta del servidor. */
export const DAILY_LIMIT = 300

/** Renglones del carrito → JSON compacto para la comanda. */
function packItems(lines) {
  return lines.slice(0, 60).map((l) => ({
    name: String(l.name).slice(0, 120),
    qty: l.qty,
    price: l.price || 0,
    group: l.groupName ? String(l.groupName).slice(0, 60) : null,
    // Las salsas van en su propio campo: en cocina es el dato que
    // más se consulta y no puede quedar escondido dentro del nombre.
    sauces: Array.isArray(l.sauces) ? l.sauces.slice(0, 3) : [],
  }))
}

/**
 * Registra el pedido para el panel de empleados.
 * Nunca lanza: el WhatsApp del cliente no se cancela porque la red falle.
 * @returns {Promise<{ok: boolean, reason?: string, daily_no?: number, remaining?: number}>}
 */
export async function placeOrder({ lines, total, hasOpenPrice, branch, mode, payment, name, notes }) {
  if (!supabaseReady) return { ok: false, reason: 'sin-supabase' }
  try {
    const { data, error } = await supabase.rpc('place_order', {
      payload: {
        branch_slug: branch?.slug,
        customer: name || null,
        mode,
        payment,
        notes: notes || null,
        items: packItems(lines),
        total,
        open_price: Boolean(hasOpenPrice),
      },
    })
    if (error) return { ok: false, reason: 'red', message: error.message }
    return data ?? { ok: false, reason: 'vacio' }
  } catch (e) {
    return { ok: false, reason: 'red', message: e?.message }
  }
}

/** Cuántos pedidos van hoy y cuántos quedan del tope. */
export async function fetchOrdersStatus() {
  if (!supabaseReady) return null
  try {
    const { data, error } = await supabase.rpc('orders_today_status')
    if (error || !data) return null
    return {
      used: Number(data.used) || 0,
      limit: Number(data.limit) || DAILY_LIMIT,
      remaining: Number(data.remaining) || 0,
    }
  } catch {
    return null
  }
}
