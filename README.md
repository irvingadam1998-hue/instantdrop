# InstantDrop

Comparte archivos y texto entre dispositivos en la misma red WiFi — sin login, sin base de datos, sin nube.

Monorepo con dos aplicaciones independientes:

```
apps/
  server/   Backend Node.js + Express — señalización WebRTC y clips de texto en memoria
  web/      Frontend Next.js (App Router) — toda la UI e interacción con el usuario
```

## Cómo funciona

- Cada dispositivo se registra con un `deviceId`, un `token` aleatorio, un `emoji` y una `roomId`.
- Los dispositivos que comparten una red aparecen al conectarse. Las pestañas de cada navegador comparten su identidad.
- Los archivos viajan **directo entre navegadores vía WebRTC (P2P)** — el servidor nunca los toca ni los almacena.
- El servidor solo hace **señalización** (intercambio de ofertas/respuestas SDP e ICE por SSE) y guarda **clips de texto en memoria**, agrupados por room.
- Un código QR permite unirse rápido desde otro dispositivo escaneando la URL del frontend.

## Detección de dispositivos

La lista solo incluye navegadores con una conexión activa. Se actualiza al instante al abrirse o cerrarse una pestaña; una comprobación frecuente retira las conexiones que se pierden junto con la red. Las pestañas del mismo navegador comparten su identidad y aparecen como un único dispositivo.

La detección automática usa la dirección de red de cada equipo. En redes públicas o compartidas, escribe el mismo código de sala en ambos dispositivos para encontrarlos. No configures una sala global para todos los visitantes del sitio.

## Requisitos

- Node.js 18+
- npm 9+ (usa [workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces))

## Desarrollo local

```bash
npm install          # instala ambos workspaces
npm run dev          # levanta server (puerto 4000) y web (puerto 3000) en paralelo
```

Abre `http://localhost:3000` — o `http://<tu-IP-local>:3000` desde otro dispositivo en la misma WiFi. El frontend detecta automáticamente la IP del backend a partir del hostname con el que abriste la página (ver `apps/web/lib/config.ts`), así que no hace falta configurar nada para probar en red local.

## Variables de entorno

### `apps/server/.env`

| Variable       | Descripción                                                                 |
|----------------|------------------------------------------------------------------------------|
| `PORT`         | Puerto del servidor (Render lo define automáticamente)                       |
| `NODE_ENV`     | `production` \| `development`                                                |
| `FRONTEND_URL` | Origen(es) del frontend desplegado, separados por coma — usado para CORS.    |

### `apps/web/.env`

| Variable                  | Descripción                                                                 |
|---------------------------|------------------------------------------------------------------------------|
| `NEXT_PUBLIC_SERVER_URL`  | URL pública del backend. **Requerido en producción** (se inyecta en build).  |
| `NEXT_PUBLIC_SERVER_PORT` | Puerto del backend, solo como fallback en desarrollo/LAN (default `4000`).   |

Copia `apps/server/.env.example` y `apps/web/.env.example` a `.env` en cada carpeta para empezar.

## Deploy en Render (prioritario)

Este proyecto **no usa Vercel** ni variables específicas de Railway. Usa `render.yaml` en la raíz para desplegar ambos servicios de una vez ([Render Blueprints](https://render.com/docs/blueprint-spec)):

1. Conecta el repo en Render y crea el Blueprint a partir de `render.yaml`.
2. Se crean dos Web Services: `instantdrop-server` y `instantdrop-web`.
3. Configura `FRONTEND_URL` en `instantdrop-server` con la URL pública que Render asigne a `instantdrop-web`.
4. Configura `NEXT_PUBLIC_SERVER_URL` en `instantdrop-web` con la URL pública de `instantdrop-server`.
5. Redeploy manual de `instantdrop-web` para que el build tome el nuevo `NEXT_PUBLIC_SERVER_URL` (Next.js lo inyecta en build time, no en runtime).

También puedes crear los dos servicios a mano sin Blueprint, usando los `buildCommand`/`startCommand` que aparecen en `render.yaml` como referencia.

### Alternativa: Docker

Cada app tiene su propio `Dockerfile` (opcional), pensado para construirse desde la raíz del repo:

```bash
docker build -f apps/server/Dockerfile -t instantdrop-server .
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_SERVER_URL=https://tu-backend.onrender.com -t instantdrop-web .
```

### Despliegue del frontend en Vercel (opcional, no prioritario)

Si en algún momento se despliega `apps/web` en Vercel, solo hace falta apuntar `NEXT_PUBLIC_SERVER_URL` al backend en Render — no hay código dependiente de Vercel. El backend (`apps/server`) debe seguir en Render u otro host Node; no está pensado para correr como función serverless.

## Seguridad

- Cada dispositivo tiene un token único (`crypto.randomBytes`) — nadie puede suplantar a otro.
- El servidor valida token + room antes de aceptar una conexión SSE o reenviar una señal WebRTC.
- Rate limiting básico en `/register`, `/signal` y `/clips` (sin dependencias externas).
- Headers de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, CSP, HSTS en producción).
- CORS explícito por origen (`FRONTEND_URL`), sin comodines en producción.
- El servidor jamás recibe ni almacena el contenido de archivos — solo señalización y clips de texto efímeros en memoria.

## Indexación y AdSense

- `NEXT_PUBLIC_SITE_URL` define el dominio canónico y alimenta los metadatos, `robots.txt` y `sitemap.xml`; por defecto es `https://instantdrop.site`.
- Tras desplegar el dominio definitivo, verifica la propiedad en Google Search Console y envía `https://instantdrop.site/sitemap.xml`. El sitemap incluye solo páginas públicas; las salas y la API no se indexan.
- La etiqueta meta de AdSense y `apps/web/public/ads.txt` permiten la verificación del sitio. Confirma que el publisher ID coincida exactamente con la cuenta que solicita aprobación.
- No se cargan anuncios en la herramienta de transferencia: el intercambio de archivos y mensajes privados es la función principal de la pantalla, y AdSense restringe anuncios en pantallas centradas en comunicación privada. Antes de mostrar anuncios en páginas editoriales, se requiere aprobación de AdSense; para anuncios personalizados en EEE, Reino Unido o Suiza, configura una CMP certificada por Google.
- La indexación técnica no garantiza posiciones concretas. El posicionamiento depende de la utilidad y originalidad del contenido, la experiencia y las señales de confianza; evita crear páginas repetidas solo para captar palabras clave.

## Empaquetado Arch/Manjaro (`packaging/arch`)

El paquete AUR existente (`packaging/arch/PKGBUILD`) asume el layout anterior (`server.js` + `public/` en la raíz sirviendo también el frontend) y **no está actualizado** para esta nueva estructura de dos apps. Si vas a seguir manteniendo ese lanzador de escritorio, hay que actualizar el `PKGBUILD` y el script `instantdrop` para construir `apps/web` y ejecutar `apps/server` por separado (o apuntar a una instancia ya desplegada). Se dejó fuera de esta migración a propósito para no mezclar ambos cambios.
