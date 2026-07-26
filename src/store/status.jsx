/* ============================================================================
   ESTADO DE SUCURSALES — "mucha demanda"
   ----------------------------------------------------------------------------
   Lee `branch_status` de Supabase y se suscribe a cambios en tiempo real, para
   que cuando el personal encienda la bandera todos los que ya tienen el sitio
   abierto la vean sin recargar.

   Sin credenciales de Supabase el hook devuelve todo apagado y el sitio se
   comporta como siempre.
   ============================================================================ */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { branches } from '../data'

const StatusContext = createContext(null)

/** Estado inicial: todas las sucursales operando normal. */
function emptyStatus() {
  return Object.fromEntries(
    branches.map((b) => [b.slug, { high_demand: false, note: null, updated_at: null }]),
  )
}

export function StatusProvider({ children }) {
  const [status, setStatus] = useState(emptyStatus)
  const [loading, setLoading] = useState(supabaseReady)

  const applyRows = useCallback((rows) => {
    setStatus((prev) => {
      const next = { ...prev }
      for (const row of rows) {
        // Sólo aceptamos sucursales que existen en data.js: así una fila
        // sembrada en la tabla no puede inventar una sucursal en el sitio.
        if (!(row?.slug in prev)) continue
        next[row.slug] = {
          high_demand: Boolean(row.high_demand),
          // La nota se pinta al cliente: la recortamos aquí, que es por donde
          // pasa todo (carga inicial y realtime), y no en cada componente.
          note: typeof row.note === 'string' && row.note.trim()
            ? row.note.trim().slice(0, 120)
            : null,
          updated_at: row.updated_at || null,
        }
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!supabaseReady) return
    let alive = true

    const load = async () => {
      const { data, error } = await supabase
        .from('branch_status')
        .select('slug, high_demand, note, updated_at')
      if (!alive) return
      // Si la tabla no existe todavía, no rompemos el sitio: queda todo normal.
      if (error) console.warn('[branch_status]', error.message)
      else if (data) applyRows(data)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('branch_status_stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'branch_status' },
        (payload) => {
          if (payload.new?.slug) applyRows([payload.new])
        },
      )
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [applyRows])

  const value = useMemo(() => {
    const saturated = branches.filter((b) => status[b.slug]?.high_demand)
    return {
      status,
      loading,
      /** Sucursales con demanda alta ahora mismo. */
      saturated,
      /** ¿Esta sucursal está saturada? */
      isSaturated: (slug) => Boolean(status[slug]?.high_demand),
      noteFor: (slug) => status[slug]?.note || null,
      /** Todas saturadas: el sitio deja de ofrecer WhatsApp como camino principal. */
      allSaturated: saturated.length === branches.length,
      enabled: supabaseReady,
      applyRows,
    }
  }, [status, loading, applyRows])

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>
}

export function useStatus() {
  const ctx = useContext(StatusContext)
  if (!ctx) throw new Error('useStatus debe usarse dentro de <StatusProvider>')
  return ctx
}
