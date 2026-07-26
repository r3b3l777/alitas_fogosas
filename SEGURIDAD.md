# Seguridad — Alitas Fogosas

Qué protege qué, qué ya está hecho en el código y qué falta activar en los
paneles de Supabase y Vercel (eso no se puede hacer desde el repo).

## Qué hay en juego

El sitio **no guarda datos de clientes ni pedidos**: el pedido se arma en el
navegador y se manda por WhatsApp. No hay base de datos de clientes que robar,
ni cobros en línea. Lo único con sesión es el panel del personal, y lo único
que se puede tocar desde ahí es una bandera de "mucha demanda" por sucursal.

O sea: el peor caso realista no es un robo de datos, es una **molestia** —
que alguien encienda el letrero de demanda para fastidiar, o que tire la
página a base de basura. Contra eso es todo lo de abajo.

## Ya hecho en el código

| Riesgo | Defensa |
| --- | --- |
| Probar contraseñas a mano en el panel | Bloqueo progresivo tras 3 fallos: 30 s, 1 min, 2 min… hasta 15 min. Sobrevive a recargar la página (`StaffPanel.jsx`) |
| Adivinar qué correo existe | El error de login es siempre el mismo, no dice si falló el correo o la contraseña |
| Escribir en la base sin permiso | RLS en Postgres: lectura pública, escritura sólo con sesión. Verificado: un anónimo que hace PATCH recibe `[]` y no cambia nada |
| Que un empleado deje una nota kilométrica y rompa el aviso | Nota acotada a 80 caracteres al guardar y a 120 al pintarla (`status.jsx`) |
| Filas sembradas en la tabla para inventar sucursales | Sólo se aceptan `slug` que existan en `data.js` |
| Editar el carrito desde la consola para colgar la pestaña | El carrito de `localStorage` se reconstruye campo por campo con topes: máx. 60 renglones, cantidades 1–99, precios numéricos, textos recortados, blobs > 200 KB descartados (`cart.jsx`) |
| Textos gigantes en el pedido | Nombre 60, notas 400, mensaje de WhatsApp 1 600 caracteres |
| Un error de JS deja la página en blanco | `ErrorBoundary`: pantalla de "recarga o pídenos por WhatsApp" con teléfono a la vista |
| Robo de la llave del navegador | La `anon key` es pública por diseño; sin sesión no escribe nada |

## Falta activar (3 cosas, en los paneles)

Esto es lo que de verdad frena un ataque automatizado. El código del navegador
no puede hacerlo: se configura en el proveedor.

### 1. Captcha en el login — Supabase

Authentication → Settings → **Enable Captcha protection** (Cloudflare Turnstile
es gratis). Es lo que corta un script que prueba miles de contraseñas: el
bloqueo del navegador que ya programamos no lo detiene, porque un script no
usa el navegador. Al activarlo hay que pasarle el token del captcha al
`signInWithPassword` — son ~10 líneas en `StaffPanel.jsx`, dime y lo hago.

Supabase además ya limita por su cuenta los intentos por IP.

### 2. Protección de contraseñas filtradas y MFA — Supabase

Authentication → Settings:
- **Leaked password protection**: rechaza contraseñas que ya aparecieron en
  filtraciones conocidas.
- **MFA**: si algún día el panel hace algo más delicado que un letrero, vale
  la pena exigir segundo factor.

Y lo básico: `Alitas2026` es cómoda para dictarla en la barra, pero es corta y
adivinable. Si el panel crece, cámbiala por una larga.

### 3. Escudo anti-DDoS — Vercel

Project → Settings → **Firewall**:
- **Attack Challenge Mode**: enciéndelo si alguna vez notas la página lenta o
  caída por tráfico raro. Pone un reto de navegador a todo el mundo.
- **Rate limiting**: opcional, limita peticiones por IP.

Vercel ya trae mitigación de DDoS de base en el plan gratuito. La página es
estática (HTML, CSS, JS e imágenes), así que aguanta muchísimo tráfico sin
despeinarse: no hay servidor propio que tumbar.

## Si algo pasa

- **Encendieron el letrero de demanda sin permiso** → entra al panel y apágalo.
  En Supabase, la columna `updated_by` de `branch_status` dice con qué cuenta se
  hizo el cambio.
- **Se filtró la contraseña del personal** → Supabase → Authentication → Users →
  el usuario → *Reset password*. Las sesiones abiertas se pueden cerrar desde
  ahí mismo.
- **La página no carga** → el sitio funciona sin Supabase: si la base falla,
  el menú, el carrito y WhatsApp siguen operando y el modo demanda queda
  apagado. No hay un solo punto de falla para vender.
