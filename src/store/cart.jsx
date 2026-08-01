/* ============================================================================
   CARRITO
   ----------------------------------------------------------------------------
   Vive en el navegador (localStorage) mientras el cliente lo arma. Al enviar,
   el pedido sale por dos vías: el mensaje de WhatsApp que se construye aquí
   abajo, y el registro en el panel de empleados (ver src/lib/orders.js).

   Cada línea del carrito tiene un `key` que combina categoría + producto +
   salsas elegidas, para que "10 alitas BBQ" y "10 alitas Habanero" sean dos
   renglones distintos y no se sumen por error.
   ============================================================================ */
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'alitas-fogosas:carrito:v1'

/** Identidad de una línea: mismo producto + mismas salsas = misma línea. */
function lineKey(item) {
  const sauces = [...(item.sauces || [])].sort().join('|')
  return `${item.groupId}::${item.name}::${sauces}`
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const line = action.line
      const key = lineKey(line)
      const found = state.lines.find((l) => l.key === key)
      if (found) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, qty: Math.min(99, l.qty + (line.qty || 1)) } : l,
          ),
        }
      }
      // Tope de renglones: nadie pide 200 cosas distintas, y sin tope el
      // carrito se puede inflar hasta dejar la página pegada.
      if (state.lines.length >= MAX_LINES) return state
      return { ...state, lines: [...state.lines, { ...line, key, qty: line.qty || 1 }] }
    }
    case 'setQty': {
      const qty = Math.max(0, Math.min(99, action.qty))
      if (qty === 0) return { ...state, lines: state.lines.filter((l) => l.key !== action.key) }
      return {
        ...state,
        lines: state.lines.map((l) => (l.key === action.key ? { ...l, qty } : l)),
      }
    }
    case 'remove':
      return { ...state, lines: state.lines.filter((l) => l.key !== action.key) }
    case 'clear':
      return { ...state, lines: [] }
    case 'hydrate':
      return { ...state, ...action.state }
    default:
      return state
  }
}

const initialState = { lines: [] }

/* Todo lo que viene de localStorage es texto que CUALQUIERA puede editar desde
   la consola del navegador (o que puede quedar corrupto si el navegador cierra
   a media escritura). Si nos lo creemos tal cual, un `qty` de un millón o un
   `name` de 5 MB congelan la pestaña, y un precio en texto rompe el total y
   deja la página en blanco. Por eso aquí no se filtra: se reconstruye cada
   línea campo por campo, con topes. */
const MAX_LINES = 60
const MAX_QTY = 99
const MAX_TEXT = 120
const MAX_SAUCES = 3

const cleanText = (v, max = MAX_TEXT) =>
  typeof v === 'string' ? v.slice(0, max) : undefined

function cleanLine(l) {
  if (!l || typeof l !== 'object') return null
  const name = cleanText(l.name)
  if (!name) return null
  const qty = Math.max(1, Math.min(MAX_QTY, Math.round(Number(l.qty) || 1)))
  const price = Number(l.price)
  const sauces = Array.isArray(l.sauces)
    ? l.sauces.slice(0, MAX_SAUCES).map((s) => cleanText(s, 40)).filter(Boolean)
    : undefined
  const line = {
    name,
    qty,
    price: Number.isFinite(price) && price >= 0 && price < 1e6 ? price : 0,
    groupId: cleanText(l.groupId, 40),
    groupName: cleanText(l.groupName),
    onlyBranch: cleanText(l.onlyBranch, 40),
    ...(sauces?.length ? { sauces } : {}),
  }
  // La clave se recalcula: si la guardada venía manipulada, dos líneas podrían
  // compartir identidad y romper las cantidades.
  return { ...line, key: lineKey(line) }
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // Un blob enorme sólo puede venir de manipulación: ni lo parseamos.
    if (!raw || raw.length > 200_000) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.lines)) return null
    const lines = []
    for (const l of parsed.lines.slice(0, MAX_LINES)) {
      const clean = cleanLine(l)
      // Si el mismo producto aparece repetido, se queda la primera línea.
      if (clean && !lines.some((x) => x.key === clean.key)) lines.push(clean)
    }
    return { lines }
  } catch {
    return null
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => readStorage() || initialState)

  useEffect(() => {
    try {
      const raw = JSON.stringify(state)
      // Sólo escribimos si algo cambió de verdad: así no despertamos a las
      // otras pestañas con un `storage` que no trae novedades.
      if (localStorage.getItem(STORAGE_KEY) !== raw) localStorage.setItem(STORAGE_KEY, raw)
    } catch {
      // Modo privado de Safari: seguimos sin persistencia, no es fatal.
    }
  }, [state])

  /* El carrito es de este navegador y de nadie más (vive en localStorage, no
     toca el servidor). Lo que sí se pisaba era el mismo usuario con DOS
     PESTAÑAS abiertas: cada una guardaba su versión sobre la otra y la última
     en cerrarse borraba lo que la otra hubiera agregado. Escuchando `storage`
     las pestañas se mantienen en el mismo pedido en vez de competir. */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return
      if (e.newValue == null) {
        dispatch({ type: 'clear' })
        return
      }
      // Llega de otra pestaña: se sanea igual que al arrancar, porque el
      // contenido de localStorage nunca es de fiar.
      const fresh = readStorage()
      if (fresh) dispatch({ type: 'hydrate', state: fresh })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => {
    const count = state.lines.reduce((n, l) => n + l.qty, 0)
    const total = state.lines.reduce((n, l) => n + l.qty * (l.price || 0), 0)
    // Hay renglones sin precio fijo (bebidas con varias presentaciones,
    // menú infantil): el total mostrado es "desde".
    const hasOpenPrice = state.lines.some((l) => !l.price)
    return {
      lines: state.lines,
      count,
      total,
      hasOpenPrice,
      add: (line) => dispatch({ type: 'add', line }),
      setQty: (key, qty) => dispatch({ type: 'setQty', key, qty }),
      remove: (key) => dispatch({ type: 'remove', key }),
      clear: () => dispatch({ type: 'clear' }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}

const money = (n) => `$${n.toLocaleString('es-MX')}`

/** Arma el texto del pedido para WhatsApp. */
/** Tope del texto que viaja en la URL de WhatsApp: pasado cierto largo, el
    enlace se rompe en algunos navegadores y el pedido se pierde. */
const MAX_MESSAGE = 1600

export function buildOrderMessage({ lines, total, hasOpenPrice, branch, mode, payment, name, notes }) {
  const out = ['¡Hola! Quiero hacer un pedido 🔥', '']

  for (const l of lines) {
    const price = l.price ? ` — ${money(l.price * l.qty)}` : ' — (precio según presentación)'
    out.push(`• ${l.qty}× ${l.name}${price}`)
    if (l.groupName) out.push(`   ${l.groupName}`)
    if (l.sauces?.length) out.push(`   🌶️ Salsas: ${l.sauces.join(', ')}`)
  }

  out.push('')
  out.push(`TOTAL: ${hasOpenPrice ? 'desde ' : ''}${money(total)}`)
  out.push('')
  if (name) out.push(`Nombre: ${String(name).slice(0, 60)}`)
  if (branch) out.push(`Sucursal: ${branch.name}`)
  out.push(`Entrega: ${mode === 'domicilio' ? 'A domicilio' : 'Paso por él'}`)
  if (payment) out.push(`Pago: ${payment}`)
  if (notes) out.push(`Notas: ${String(notes).slice(0, 400)}`)

  const text = out.join('\n')
  return text.length > MAX_MESSAGE ? `${text.slice(0, MAX_MESSAGE)}…` : text
}
