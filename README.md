# Alitas Fogosas 🔥

Sitio web moderno para Alitas Fogosas. React 19 + Vite + Tailwind v4.
Diseño oscuro y fogoso, 100% responsive (móvil, tablet, PC) y funciona en Chrome, Safari, Firefox y Edge.

## Correr el proyecto

```bash
npm install       # solo la primera vez
npm run dev       # servidor de desarrollo (http://localhost:5173)
npm run build     # genera la versión final en /dist
npm run preview   # previsualiza el build
```

## ✏️ Qué editar (todo en un solo lugar)

Casi todo el contenido vive en **`src/data.js`**. Abre ese archivo y cambia:

| Quieres cambiar… | Edita en `src/data.js` |
|---|---|
| **Número de WhatsApp** | `WHATSAPP` (solo dígitos con lada país, ej. México `52` + 10 dígitos) |
| **Teléfono, dirección, ciudad, mapa** | objeto `business` |
| **Horarios** | `business.hours` |
| **Redes sociales** | `business.social` |
| **Precios y platillos del menú** | array `menu` |
| **Salsas y nivel de picor** | array `sauces` (`heat`: 1 = suave, 2 = picosa, 3 = valientes) |
| **Bebidas** | array `drinks` |
| **Reseñas** | array `testimonials` |

### ✔ Datos reales ya cargados
- **WhatsApp**: 729 142 9080 (todos los botones de pedido).
- **Precios**: tomados de los tableros oficiales del menú.
- **Sucursales**: La Magdalena y Av. Lerma (San Mateo Atenco) con horarios y Uber Eats.

### ⚠️ Verificar antes de publicar
- Direcciones exactas de las sucursales y links de Google Maps.
- El email de contacto (`business.email` es provisional).

## Imágenes

Las fotos reales están en `public/img/` (se descargaron del sitio original).
Para cambiar una foto, reemplaza el archivo o actualiza las rutas en `img` dentro de `src/data.js`.

## Estructura

```
src/
  data.js              ← CONTENIDO EDITABLE (empieza aquí)
  index.css            ← tokens de diseño y efectos de fuego
  App.jsx              ← ensambla las secciones
  components/
    ui.jsx             ← iconos SVG, logo, medidor de picor, reveal
    Nav, Hero, Marquee, Categories, Menu, Sauces,
    Drinks, Testimonials, Visit, FinalCTA, Footer
```

## Publicar (deploy)

`npm run build` genera la carpeta `dist/`. Súbela a cualquier hosting estático
(Netlify, Vercel, Cloudflare Pages, o el mismo servidor donde está el WordPress).
