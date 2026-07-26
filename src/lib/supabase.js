/* ============================================================================
   SUPABASE
   ----------------------------------------------------------------------------
   Sólo se usa para el estado de "mucha demanda" por sucursal y para el login
   del personal. El menú y el carrito NO dependen de esto.

   Si las variables de entorno no están puestas, `supabase` queda en null y el
   sitio funciona igual: el modo demanda simplemente no se activa nunca.

   Configura en `.env.local` (y en Vercel → Settings → Environment Variables):
     VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

   El SQL de las tablas y sus políticas está en `supabase/schema.sql`.
   ============================================================================ */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** `true` cuando el proyecto tiene credenciales configuradas. */
export const supabaseReady = Boolean(url && anonKey)

export const supabase = supabaseReady
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

if (!supabaseReady && import.meta.env.DEV) {
  console.info(
    '[Alitas Fogosas] Supabase sin configurar: el modo "mucha demanda" queda inactivo. ' +
      'Pon VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local para encenderlo.',
  )
}
