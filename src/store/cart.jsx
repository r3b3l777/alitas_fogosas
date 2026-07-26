/* ============================================================================
   CARRITO
   ----------------------------------------------------------------------------
   Vive en el navegador (localStorage). El pedido no se guarda en ningún lado:
   se arma un mensaje de WhatsApp con el desglose y el total, y el empleado lo
   confirma por chat junto con la forma de pago.

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

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.lines)) return null
    // Saneamos: si el menú cambió de precio, el carrito viejo no debe mentir.
    return { lines: parsed.lines.filter((l) => l && l.name && typeof l.qty === 'number') }
  } catch {
    return null
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => readStorage() || initialState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Modo privado de Safari: seguimos sin persistencia, no es fatal.
    }
  }, [state])

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
export function buildOrderMessage({ lines, total, hasOpenPrice, branch, mode, payment, name, notes }) {
  const out = ['¡Hola! Quiero hacer un pedido 🔥', '']

  for (const l of lines) {
    const price = l.price ? ` — ${money(l.price * l.qty)}` : ' — (precio según presentación)'
    out.push(`• ${l.qty}× ${l.name}${price}`)
    if (l.groupName) out.push(`   ${l.groupName}`)
    if (l.sauces?.length) out.push(`   Salsas: ${l.sauces.join(', ')}`)
  }

  out.push('')
  out.push(`TOTAL: ${hasOpenPrice ? 'desde ' : ''}${money(total)}`)
  out.push('')
  if (name) out.push(`Nombre: ${name}`)
  if (branch) out.push(`Sucursal: ${branch.name}`)
  out.push(`Entrega: ${mode === 'domicilio' ? 'A domicilio' : 'Paso por él'}`)
  if (payment) out.push(`Pago: ${payment}`)
  if (notes) out.push(`Notas: ${notes}`)

  return out.join('\n')
}
