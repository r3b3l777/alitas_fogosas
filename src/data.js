/* ============================================================================
   ALITAS FOGOSAS — CONTENIDO EDITABLE
   ----------------------------------------------------------------------------
   Todo lo que puede cambiar vive aquí. Edita este archivo y listo.

   ✔ WhatsApp real: 729 142 9080 · Precios reales de los tableros oficiales.
   ⚠️  Verifica: direcciones exactas de sucursales y el email de contacto.
   ============================================================================ */

// Solo dígitos, con lada país (México: 52 + 10 dígitos)
export const WHATSAPP = '527291429080' // 729 142 9080

export const business = {
  name: 'Alitas Fogosas',
  tagline: 'Sabor que enciende tu pasión',
  subtitle: 'El mejor lugar para hacer volar el paladar',
  phone: '729 142 9080',
  email: 'hola@alitasfogosas.com',    // ← CAMBIAR (opcional)
  address: 'Calle Ignacio Allende 301, Barrio La Magdalena',
  city: 'San Mateo Atenco, Edo. Méx.',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Alitas+Fogosas+Ignacio+Allende+301+San+Mateo+Atenco',
  social: {
    instagram: 'https://www.instagram.com/alitas_fogosas',
    facebook: 'https://www.facebook.com/alitasfogosas/',
  },
  hours: [
    { d: 'Domingo – Jueves', h: '1:00 PM – 10:00 PM' },
    { d: 'Viernes – Sábado', h: '1:00 PM – 11:00 PM' },
  ],
}

// ─── SUCURSALES ─────────────────────────────────────────────────────────────
// Direcciones verificadas desde los links oficiales de Google Maps
// publicados en el perfil de Instagram @alitas_fogosas.
export const branches = [
  {
    name: 'Sucursal Buenavista',
    address: 'Calle Ignacio Allende 301, esq. Av. Buenavista, Barrio La Magdalena',
    city: 'San Mateo Atenco, Edo. Méx. · C.P. 52104',
    phone: '729 142 9080',
    mapsUrl: 'https://g.co/kgs/syb16N',
    uberEats: 'https://www.ubereats.com/mx/store/alitas-fogosas/ifZjL4cxQIWiXj1mYawFwg',
  },
  {
    name: 'Sucursal Av. Lerma',
    address: 'Av. Lerma 102, Col. Santa María San Isidro',
    city: 'San Mateo Atenco, Edo. Méx. · C.P. 52105',
    phone: '729 142 9080',
    mapsUrl: 'https://maps.app.goo.gl/cPQLwgNNZXotw2zt9',
    uberEats: 'https://www.ubereats.com/mx/store/alitas-fogosas-lerma/ZOCTpNqXUi6xqM61Lp0Qqg',
  },
  {
    name: 'Sucursal Sauces Metepec',
    address: 'Cto. Metropolitano Exterior 2028-Ote',
    city: 'Metepec, Edo. Méx. · C.P. 52176',
    phone: '729 142 9080',
    mapsUrl: 'https://maps.app.goo.gl/PnNmn2YymdVyAbs78',
    uberEats: 'https://www.ubereats.com/mx/store/alitas-fogosas-sauces-metepec/Oy_gGubhVISKkZCq4ImITQ',
  },
]

/** Construye un link de WhatsApp con mensaje pre-cargado. */
export function waLink(text = 'Hola 👋 quiero hacer un pedido de Alitas Fogosas') {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
}

// Imágenes reales descargadas del sitio original (optimizadas a JPEG ~960px;
// los PNG originales siguen en public/img por si se necesitan)
export const img = {
  wingsFire: '/img/fotos-alitas-2.jpg',   // alitas BBQ sobre fuego
  wingsNeon: '/img/3-3.jpg',              // alitas basket neón
  ribs: '/img/fotos-alitas-3.jpg',        // costillas + papas + cerveza
  michelada: '/img/fotos-alitas-1-1.jpg', // michelada + pacífico
  blueDrink: '/img/4-2.jpg',              // cóctel azul
  avatar1: '/img/Captura-de-Pantalla-2025-04-04-a-las-17.45.27-1.png',
  avatar2: '/img/Captura-de-Pantalla-2025-04-04-a-las-17.48.33-1.png',
}

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────
export const categories = [
  {
    id: 'alitas',
    name: 'Alitas de la Casa',
    desc: 'Crujientes por fuera, jugosas por dentro. Bañadas en la salsa que elijas.',
    image: '/img/alitas-menu.jpg', // foto oficial del menú del sitio original
  },
  {
    id: 'boneless',
    name: 'Boneless Fogosos',
    desc: 'Todo el sabor, sin hueso. Bocados perfectos para no parar de comer.',
    image: '/img/boneless-menu.jpg', // foto oficial del menú del sitio original
  },
  {
    id: 'burgers',
    name: 'Burgers',
    desc: 'Como le gustan a Burgerman: carne con tocino estilo panceta, deliciosa al paladar.',
    image: '/img/burger-menu.jpg', // recorte del tablero oficial del menú
  },
  {
    id: 'costillas',
    name: 'Costillas',
    desc: 'Baby back ribs jugosas y adictivas, con mucha carne pegada al hueso.',
    image: '/img/costillas-closeup.jpg',
  },
]

// ─── MENÚ OFICIAL (precios reales de los tableros de alitasfogosas.com/menu) ─
export const menu = [
  {
    id: 'alitas',
    name: 'Alitas de la Casa',
    tag: 'La estrella',
    note: 'Se sirven con vegetales frescos y dip de aderezo. Paquete con cerveza: 355 ml.',
    items: [
      { name: '6 piezas', desc: 'Una salsa a elegir', price: 95 },
      { name: '10 piezas', desc: 'Dos salsas a elegir', price: 149 },
      { name: '15 piezas', desc: 'Tres salsas a elegir', price: 229 },
      { name: '20 piezas', desc: 'Tres salsas a elegir', price: 329 },
      { name: '30 piezas', desc: 'Cuatro salsas · para la banda', price: 410, star: true },
      { name: 'Paquete + cerveza', desc: '6 pzs + 1 cerveza $159 · hasta 30 pzs + 3 cervezas $489', price: 159 },
    ],
  },
  {
    id: 'boneless',
    name: 'Boneless Fogosos',
    tag: 'Carnosas',
    note: 'Pechuga de pollo empanizada y dorada. 8 piezas ≈ 220 g de proteína.',
    items: [
      { name: '8 piezas', desc: 'Una salsa a elegir', price: 105 },
      { name: '15 piezas', desc: 'Dos salsas a elegir', price: 190 },
      { name: '20 piezas', desc: 'Tres salsas a elegir', price: 275 },
      { name: '30 piezas', desc: 'Tres salsas · ideal para compartir', price: 389, star: true },
      { name: 'Paquete + cerveza', desc: '8 pzs + 1 cerveza $149 · hasta 30 pzs + 3 cervezas $470', price: 149 },
    ],
  },
  {
    id: 'burgers',
    name: 'Burgers',
    tag: 'Burgerman',
    note: 'Incluyen camita de papas, jitomate, cebolla y lechuga fresca.',
    items: [
      { name: 'La Hawaiana', desc: 'Jamón de pavo y piña asada, queso Gouda, tocino estilo polaco, cebolla caramelizada y honey mustard', price: 159 },
      { name: 'La Fogostina', desc: 'La más pedida: doble carne en pan brioche, cheddar derretido, mermelada de tocino y aderezo de la casa', price: 199, star: true },
    ],
  },
  {
    id: 'costillas',
    name: 'Costillas',
    tag: 'Baby back ribs',
    note: 'Incluyen papas a la francesa con extra queso y tocino. Pídelas con cualquiera de nuestras salsas.',
    items: [
      { name: 'Tira de Ribs', desc: '260 g bañados en BBQ, doble pasada por el horno. Porción individual: ¡prohibido compartir!', price: 159 },
      { name: 'Jenga de Costillas', desc: 'Un kilo de baby back ribs. Placer para compartir entre familia y amigos', price: 429, star: true },
    ],
  },
  {
    id: 'conos',
    name: 'Conos',
    tag: 'Papas al full',
    note: 'Papas de 250 g con extra queso y tocino.',
    items: [
      { name: 'Sencillo', desc: 'Papas al full, tocino y un chingo de queso', price: 75 },
      { name: 'Doble', desc: 'Papas + boneless', price: 155 },
      { name: 'Triple', desc: 'Boneless + papas', price: 199 },
      { name: 'Cono Fogoso', desc: 'El más completo de la casa', price: 219, star: true },
    ],
  },
  {
    id: 'jochos',
    name: 'Jochos',
    tag: 'Metrodogs',
    note: 'Un cuarto de libra de salchicha de res premium. Incluyen papas, jalapeño y salsa secreta de la casa.',
    items: [
      { name: 'Metrodog Estilo Nathans', desc: 'Tocino holandés, queso cheddar, chili y crujientes de papa spice. Como si estuvieras en New York', price: 109 },
      { name: 'Metrodog Bellagio', desc: 'Tocino holandés, cheddar derretido y cebolla caramelizada. Estilo Las Vegas', price: 109 },
      { name: 'Metrodog Estilo Mexa', desc: 'Chorizo doradito y sábana de queso Oaxaca. El favorito del Norte', price: 109, star: true },
    ],
  },
  {
    id: 'infantil',
    name: 'Menú Infantil',
    tag: 'Para los peques',
    note: 'Incluye regalo sorpresa.',
    items: [
      { name: 'Paquete Infantil', desc: 'Conito de papas (100 g) + alitas (3 pzs) o palomitas de pollo (8 pzs) + limonada, naranjada o soda italiana (355 ml) + postre del día' },
    ],
  },
]

// ─── SALSAS (heat: 1 = suave · 3 = para valientes; color = swatch visual) ──
export const sauces = [
  { name: 'Ajo Parmesano', desc: 'Cremosa y deliciosa como en ningún otro lugar', heat: 1, popular: true, color: '#EFE3C4' },
  { name: 'Lemon Pepper', desc: 'Lo acidito del limón con un toque de pimienta', heat: 1, popular: true, color: '#F5D547' },
  { name: 'Barbecue', desc: 'Lo que nunca falla, con auténtico sabor ahumado', heat: 1, popular: true, color: '#6B3A1F' },
  { name: 'Original de la Casa', desc: 'El sabor que nos hizo famosos', heat: 2, popular: true, color: '#E2571B' },
  { name: 'Red Hot', desc: 'Picante clásico, directo y sin rodeos', heat: 2, color: '#E11D2A' },
  { name: 'Tamarindo Fogoso', desc: 'Dulce, ácido y con su buen toque de fuego', heat: 2, popular: true, color: '#A44A1C' },
  { name: 'Jalapeño Fogoso', desc: 'El mero mero sabor mexicano', heat: 2, color: '#6FA832' },
  { name: 'Mango Habanero', desc: 'Tropical y picoso, una mezcla con experiencia', heat: 3, popular: true, color: '#FFA61A' },
  { name: 'Habanero Fogoso', desc: 'La de los valientes. Atrévete a probarla', heat: 3, popular: true, color: '#C81420' },
]

// ─── BEBIDAS PREFERIDAS (todas las del menú original) ──────────────────────
export const drinks = [
  { name: 'Gomichela', desc: 'Escarchada de chamoy con gomitas. El escándalo de la casa.', image: '/img/gomichela-menu.jpg' },
  { name: 'Michelada Fogosa', desc: 'Escarchada picosita con gomitas de habanero, servida con tu cerveza.', image: '/img/michelada-menu.jpg' },
  { name: 'Megatarro Calavera', desc: 'Cítrico de naranja y mango en tarro calavera, con gomitas.', image: '/img/calavera-menu.jpg' },
  { name: 'Mojito Clásico', desc: 'Hierbabuena fresca, limón y el toque de la casa.', image: '/img/mojito-menu.jpg' },
  { name: 'Cóctel Azul', desc: 'Refrescante, dulce y muy instagrameable.', image: '/img/azul-menu.jpg' },
  { name: 'Fresa Loca', desc: 'Frappé de fresa en tarro licuadora, coronado con gomitas.', image: '/img/fresa-menu.jpg' },
  { name: 'Frutos Rojos', desc: 'Moras y zarzamora con escarchado dulce, para los antojados.', image: '/img/frutos-menu.jpg' },
  { name: 'ICEE con Gusanitos', desc: 'Raspado helado con gomitas, el favorito de los peques.', image: '/img/icee-menu.jpg' },
  { name: 'Cervezas Artesanales', desc: 'Porter, Coco y Mandarina — nuestras propias etiquetas.', image: '/img/cervezas-menu.jpg' },
]

// ─── TESTIMONIOS ──────────────────────────────────────────────────────────
export const testimonials = [
  {
    name: 'Mariana G.',
    text: 'Las mejores alitas que he probado. La Fogostina es una locura y las micheladas están enormes. Porciones súper generosas.',
    avatar: img.avatar1,
    rating: 5,
  },
  {
    name: 'Andrea R.',
    text: 'Vine por las alitas y me quedé por los mojitos. Sabor, ambiente y buen servicio. Ya es mi lugar de cada finde.',
    avatar: img.avatar2,
    rating: 5,
  },
]
