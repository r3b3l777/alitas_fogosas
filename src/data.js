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
    slug: 'buenavista',
    name: 'Sucursal Buenavista',
    address: 'Calle Ignacio Allende 301, esq. Av. Buenavista, Barrio La Magdalena',
    city: 'San Mateo Atenco, Edo. Méx. · C.P. 52104',
    phone: '729 142 9080',
    mapsUrl: 'https://g.co/kgs/syb16N',
    uberEats: 'https://www.ubereats.com/mx/store/alitas-fogosas/ifZjL4cxQIWiXj1mYawFwg',
  },
  {
    slug: 'lerma',
    name: 'Sucursal Av. Lerma',
    address: 'Av. Lerma 102, Col. Santa María San Isidro',
    city: 'San Mateo Atenco, Edo. Méx. · C.P. 52105',
    phone: '729 142 9080',
    mapsUrl: 'https://maps.app.goo.gl/cPQLwgNNZXotw2zt9',
    uberEats: 'https://www.ubereats.com/mx/store/alitas-fogosas-lerma/ZOCTpNqXUi6xqM61Lp0Qqg',
  },
  {
    slug: 'sauces',
    name: 'Sucursal Sauces Metepec',
    address: 'Cto. Metropolitano Exterior 2028-Ote',
    city: 'Metepec, Edo. Méx. · C.P. 52176',
    phone: '729 142 9080',
    mapsUrl: 'https://maps.app.goo.gl/PnNmn2YymdVyAbs78',
    uberEats: 'https://www.ubereats.com/mx/store/alitas-fogosas-sauces-metepec/Oy_gGubhVISKkZCq4ImITQ',
  },
]

/** Construye un link de WhatsApp con mensaje pre-cargado. */
/** Horario que aplica HOY. Antes la barra del hero mostraba siempre la
    primera fila ("Domingo – Jueves"), así que un viernes anunciaba una hora de
    cierre equivocada. 0 = domingo … 6 = sábado. */
export function hoursToday(now = new Date()) {
  const day = now.getDay()
  const weekend = day === 5 || day === 6 // viernes y sábado cierran más tarde
  return business.hours[weekend ? 1 : 0]
}

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

// ─── MENÚ OFICIAL ───────────────────────────────────────────────────────────
// Transcrito del menú oficial en PDF entregado por el cliente (jul 2026).
// Las bebidas con varias presentaciones traen el desglose completo en `desc`
// y en `price` el precio de entrada (la presentación más chica disponible).
// S/A = sin alcohol · C/A = con alcohol.
export const menu = [
  {
    id: 'alitas',
    name: 'Alitas',
    tag: 'La estrella',
    sauces: true, // al agregar al carrito se piden salsas
    note: 'Se sirven con vegetales frescos y dip de aderezo (tamaño según la orden). Las cervezas de estos paquetes están marcadas en el menú y no incluyen marcas premium.',
    // `combo` = el paquete con cerveza del menú oficial. Va como dato (no como
    // texto en `desc`) para poder ofrecerlo como opción real al agregar.
    items: [
      { name: '324 grs.', price: 105, combo: { beers: 1, price: 169 } },
      { name: '514 grs.', price: 155, combo: { beers: 1, price: 199 } },
      { name: '832 grs.', price: 209, combo: { beers: 2, price: 299 } },
      { name: '1,212 grs.', price: 279, combo: { beers: 2, price: 429 } },
      { name: '1,636 grs.', price: 379, combo: { beers: 3, price: 519 } },
      { name: '2,442 grs.', desc: 'Para la banda', price: 599, star: true, combo: { beers: 3, price: 749 } },
    ],
  },
  {
    id: 'boneless',
    name: 'Boneless',
    tag: 'Sin hueso',
    sauces: true,
    note: 'Se sirven con vegetales frescos y dip de aderezo (tamaño según la orden). Las cervezas de estos paquetes están marcadas en el menú y no incluyen marcas premium.',
    items: [
      { name: '282 grs.', price: 129, combo: { beers: 1, price: 169 } },
      { name: '554 grs.', price: 189, combo: { beers: 2, price: 289 } },
      { name: '662 grs.', price: 285, combo: { beers: 2, price: 385 } },
      { name: '996 grs.', desc: 'Ideal para compartir', price: 419, star: true, combo: { beers: 3, price: 579 } },
    ],
  },
  {
    id: 'pizzas',
    name: 'Pizzas',
    tag: 'Solo Sauces Metepec',
    onlyBranch: 'sauces', // no se preparan en las otras dos
    note: 'Disponibles únicamente en la Sucursal Sauces Metepec. Todas nuestras pizzas tienen un tamaño de 35 cm. Agrega orilla rellena de queso a cualquiera por solo $65.',
    items: [
      { name: 'Pepperoni', desc: 'La más pedida. La infalible: capas de pepperoni dorado sobre queso fundido y salsa de tomate', price: 159, star: true },
      { name: 'Margarita', desc: 'La clásica italiana: salsa de tomate, mozzarella y albahaca fresca, simple y perfecta', price: 179 },
      { name: 'Hawaiana', desc: 'El balance perfecto entre dulce y salado: jamón y piña sobre una base de queso fundido', price: 199 },
      { name: 'Pizza Fogosa de la Semana', desc: 'Recetas que cambian, sabores que sorprenden. Pregunta a tu mesero por la fogosa disponible', price: 199 },
      { name: 'La Mexa', desc: 'Sabor intenso y picosito: chorizo, jamón, cebolla y chile que le dan ese toque bien mexicano', price: 219 },
      { name: 'Y la Queso', desc: 'Para los amantes del queso: mezcla cremosa de mozzarella, parmesano, provolone y queso azul', price: 239 },
      { name: 'Miss Metepec', desc: 'La que le gusta a todos: combinación de pepperoni, arrachera, chile morrón y champiñones', price: 259 },
      { name: 'Messi contra Ronaldo', desc: 'El clásico dividido: mitad chorizo argentino, mitad salami portugués. Tú decides el ganador', price: 259 },
      { name: 'La Traficante', desc: 'Potente y sin filtros: arrachera, tocino, chorizo argentino y lomo ahumado, con orilla rellena de queso', price: 329 },
    ],
  },
  {
    id: 'burgers',
    name: 'Burguers',
    tag: 'Para paladares exigentes',
    note: 'Incluye una ración de papas, jitomate, cebolla y lechuga fresca.',
    items: [
      { name: 'La Hawaiana', desc: 'Nuestra niña consentida: burguer con jamón de pavo y piña asada, cubiertos de queso gouda y tocino estilo polaco, cebolla caramelizada y aderezo honey mustard especial de la casa', price: 185 },
      { name: 'La Fogostina', desc: 'La más pedida. Burguer al sartén con doble carne en pan brioche, queso cheddar derretido, mermelada de tocino, cebolla caramelizada y aderezo especial', price: 235, star: true },
    ],
  },
  {
    id: 'jochos',
    name: 'Jochos',
    tag: 'Metrodogs',
    note: 'Incluye una ración de papas, rodajas de chile jalapeño y salsa receta secreta de la casa.',
    items: [
      { name: 'Metrodog Bellagio', desc: 'Como si estuvieras en Las Vegas. Salchicha con trocitos de tocino estilo holandés, bañada en queso cheddar derretido calientito y cebolla caramelizada', price: 135 },
      { name: 'Metrodog Estilo Mexa', desc: 'El favorito del Norte. Salchicha envuelta con tocino estilo holandés, acompañada de chorizo doradito y una sábana de queso cheddar bien derretido', price: 149 },
      { name: 'Metrodog Estilo Nathan’s', desc: 'El más pedido. Como si estuvieras en New York: salchicha abrazada con tocino estilo holandés, bañada de queso cheddar, acompañada con chili y crujientes de papa spice', price: 159, star: true },
    ],
  },
  {
    id: 'ribs',
    name: 'Ribs',
    tag: 'Baby back ribs',
    note: 'Incluye una ración de papas con extra queso y tocino, aderezadas con cualquiera de nuestras salsas.',
    items: [
      { name: 'Tira de Ribs', desc: 'Porción individual ¿Prohibido compartir? 260 grs. de jugosa baby back rib, bañadas en salsa bbq y pasadas dos veces por el horno, hasta desprenderse del hueso', price: 349 },
      { name: 'Jenga de Costillas', desc: 'El más pedido. ¡Placer para compartir en familia y amigos! 1 kilo de jugosas baby back ribs bañadas en salsa bbq y pasadas dos veces por el horno', price: 679, star: true },
    ],
  },
  {
    id: 'conos',
    name: 'Conos',
    tag: 'Papas al full',
    items: [
      { name: 'Sencillo', desc: 'Papas, tocino y queso', price: 95 },
      { name: 'Doble', desc: 'Papas + boneless, tocino y queso', price: 175 },
      { name: 'Triple', desc: 'Dos capas de boneless + papas, tocino y queso', price: 215 },
      { name: 'Cono Fogoso', desc: 'El más pedido. Tres capas de boneless + papas, tocino y queso', price: 225, star: true },
    ],
  },
  {
    id: 'kids',
    name: 'Kids',
    tag: 'Para los peques',
    sauces: true,
    items: [
      { name: 'Palomitas de Pollo', desc: '100 grs. de palomitas de pollo, acompañadas de 100 grs. de papas', price: 155 },
      { name: 'Alitas', desc: 'Alitas bañadas de cualquiera de nuestras salsas, acompañadas de 100 grs. de papas', price: 155 },
    ],
  },
  {
    id: 'sin-alcohol',
    name: 'Sin alcohol',
    tag: 'Bebidas y cafetería',
    items: [
      { name: 'Refresco', desc: '355 ml.', price: 50 },
      { name: 'Agua natural', desc: '355 ml.', price: 50 },
      { name: 'Agua mineral', desc: '355 ml.', price: 50 },
      { name: 'Soda italiana', desc: '355 ml. Para niños', price: 55 },
      { name: 'Café', desc: 'Cápsula Nespresso · 355 ml.', price: 45 },
      { name: 'Té', desc: 'Infusión herbal o frutal · 355 ml.', price: 45 },
    ],
  },
  {
    id: 'frescas',
    name: 'Bebidas frescas',
    tag: 'S/A y C/A',
    note: 'S/A = sin alcohol · C/A = con alcohol. Precios por presentación.',
    items: [
      { name: 'Limonada', desc: 'Con agua mineral · S/A: 355 ml $55 · 1 L $85', price: 55 },
      { name: 'Naranjada', desc: 'Con agua mineral · S/A: 355 ml $55 · 1 L $75', price: 55 },
      { name: 'Pepinada', desc: 'Con agua mineral · S/A: 355 ml $55 · 1 L $85 · C/A: 355 ml $85 · 1 L $145', price: 55 },
      { name: 'Piña Colada', desc: 'Jugo de piña, leche de coco, clavel y Bacardi · S/A: 355 ml $65 · 1 L $115 · C/A: 355 ml $85 · 1 L $145', price: 65 },
      { name: 'Eyakudrink', desc: 'Yakult, leche clavel, lechera y vodka · S/A: 355 ml $55 · C/A: 355 ml $90', price: 55 },
      { name: 'ICE', desc: 'Cereza o frambuesa, Bacardi si es con alcohol · S/A: 500 ml $75 · 1 L $105 · C/A: 500 ml $95 · 1 L $140', price: 75 },
    ],
  },
  {
    id: 'cocteles',
    name: 'Cócteles de la casa',
    tag: 'Mojitos y más',
    note: 'S/A = sin alcohol · C/A = con alcohol. Precios por presentación.',
    items: [
      { name: 'Vaso Fogoso', desc: 'El más pedido. Bebida frapeada · Opción 1: Malibú y Ron · Opción 2: Pepino y Ginebra o Vodka · Opción 3: Tamarindo con Mezcal o Tequila · C/A: 1 L $170', price: 170, star: true },
      { name: 'Mojito Cubano', desc: 'Bacardi, limón, hierbabuena y agua mineral · S/A: 600 ml $75 · 1 L $110 · C/A: 600 ml $90 · 1 L $195', price: 75 },
      { name: 'Mojito Frutos Rojos', desc: 'Frutos rojos, Bacardi, limón, hierbabuena, sirope de frutos rojos y agua mineral · S/A: 600 ml $75 · 1 L $110 · C/A: 600 ml $90 · 1 L $170', price: 75 },
      { name: 'Mojito de Cereza', desc: 'Cereza, Bacardi, limón, hierbabuena, sirope de frutos rojos y agua mineral · S/A: 600 ml $75 · 1 L $110 · C/A: 600 ml $90 · 1 L $170', price: 75 },
      { name: 'Azulito', desc: 'Vodka, Volt, agua mineral y Sprite · S/A: 600 ml $75 · 1 L $110 · C/A: 600 ml $90 · 1 L $170', price: 75 },
      { name: 'Cantarito', desc: 'Bebida receta tradicional de Tequila Jalisco. ¡El cantarito es tuyo! · C/A: 500 ml $85 · 1 L $160', price: 85 },
    ],
  },
  {
    id: 'cheladas',
    name: 'Cheladas y cervezas',
    tag: 'Nacional y premium',
    note: 'Precios por presentación: 355 ml y 1.2 L, salvo donde se indique.',
    items: [
      { name: 'Cerveza Artesanal', desc: 'El más pedido. ¡Cerveza de la casa! Hecha con proceso artesanal, el envase es coleccionable · 355 ml $75', price: 75, star: true },
      { name: 'Cerveza Nacional', desc: 'Corona, Pacífico, Victoria, XX Lager, Tecate o Indio · 355 ml $59 · 1.2 L $95', price: 59 },
      { name: 'Michelada Nacional', desc: 'Con escarchado de chamoy de sabor y Tajín · 355 ml $75 · 1.2 L $110', price: 75 },
      { name: 'Momochela Nacional', desc: 'Mezcla de salsas, clamato, sal y limón · 1.2 L $195', price: 195 },
      { name: 'Gomichela Nacional', desc: 'Mezcla de salsas, clamato, sal y limón · 1.2 L $185', price: 185 },
      { name: 'Michelada Resurrección', desc: 'Salsa original de la casa, mango habanero gourmet, salsas negras, limón, sal y cerveza de tu elección · 355 ml $75 · 1.2 L $185', price: 75 },
      { name: 'Moradito', desc: 'Vino tinto, jarabe natural, sirope de uva y cerveza · 600 ml $90 · 1 L $165', price: 90 },
      { name: 'Cerveza Premium', desc: 'Stella Artois, Heineken, Ultra, Miller y Modelo Especial · 355 ml $75 · 1.2 L $105', price: 75 },
      { name: 'Michelada Premium', desc: 'Stella Artois, Heineken, Miller y Modelo Especial. Con escarchado de chamoy y Tajín o sal · 355 ml $59 · 1.2 L $95', price: 59 },
      { name: 'Venenosa Fogosa', desc: 'El más pedido. Salsas negras, clamato, limón y cerveza premium · 355 ml $70', price: 70 },
    ],
  },
  {
    id: 'entre-amigos',
    name: 'Entre amigos',
    tag: 'Cubetazos de 6',
    note: 'Cubetazos de 6 piezas.',
    items: [
      { name: 'Cubetazo Cerveza Nacional', desc: '6 pzas · Corona, Pacífico, Victoria, XX Lager, Tecate o Indio', price: 289 },
      { name: 'Cubetazo Cerveza Premium', desc: '6 pzas · Stella Artois, Heineken, Ultra, Miller y Modelo Especial', price: 319 },
    ],
  },
]

// ─── SALSAS (heat: 1 = suave · 3 = para valientes; color = swatch visual) ──
// Orden y nombres según la escala de picor del menú oficial (izq. suave → der. fogosa).
export const sauces = [
  { name: 'Ajo Parmesano', desc: 'Cremosa y deliciosa como en ningún otro lugar', heat: 1, popular: true, color: '#F3E4C8' },
  { name: 'Lemon Pepper', desc: 'Lo acidito del limón con un toque de pimienta', heat: 1, popular: true, color: '#C7CE6E' },
  { name: 'BBQ Original', desc: 'La que nunca falla, con auténtico sabor a barbacoa', heat: 1, popular: true, color: '#6B4327' },
  { name: 'Smoky BBQ', desc: 'BBQ con humo de verdad, profunda y adictiva', heat: 1, color: '#8E1F1C' },
  { name: 'Hot BBQ', desc: 'La barbacoa con su buen empujón de picor', heat: 2, color: '#3F2A15' },
  { name: 'Tamarindo Habanero', desc: 'Dulce, ácido y con su buen toque de fuego', heat: 2, popular: true, color: '#A5551F' },
  { name: 'Original de la Casa', desc: 'El sabor que nos hizo famosos', heat: 2, popular: true, color: '#5A0E12' },
  { name: 'Red Hot', desc: 'Picante clásico, directo y sin rodeos', heat: 2, color: '#D62617' },
  { name: 'Mango Habanero', desc: 'Tropical y picosa, una mezcla con experiencia', heat: 3, popular: true, color: '#E8842A' },
  { name: 'Jalapeño Fogoso', desc: 'El mero mero sabor mexicano', heat: 3, color: '#D9631A' },
  { name: 'Habanero Fogoso', desc: 'La de los valientes. Atrévete a probarla', heat: 3, popular: true, color: '#E3231D' },
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
