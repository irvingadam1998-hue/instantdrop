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
- Los dispositivos de la misma **room** (o de la misma red local como fallback) se descubren entre sí.
- Los archivos viajan **directo entre navegadores vía WebRTC (P2P)** — el servidor nunca los toca ni los almacena.
- El servidor solo hace **señalización** (intercambio de ofertas/respuestas SDP e ICE por SSE) y guarda **clips de texto en memoria**, agrupados por room.
- Un código QR permite unirse rápido desde otro dispositivo escaneando la URL del frontend.

## Estabilidad de la room en producción

La resolución de room (`apps/server/src/config.js#getRoomKey`) sigue este orden, para que nunca dependa de forma insegura de la IP del cliente:

1. `roomId` explícito en la petición (código compartido por el usuario).
2. `APP_ROOM_ID` — fija todo el tráfico de este deployment a una sola room, sin importar el dominio.
3. Un identificador derivado del **hostname del backend** (`Host`/`X-Forwarded-Host`), estable en cualquier dominio público.
4. Como último recurso, el subnet del cliente (uso puramente LAN, sin dominio ni `APP_ROOM_ID`).

`X-Forwarded-For` **nunca** se usa para decidir la room — solo se usa (de forma segura, detrás del proxy de Render) para rate limiting y para el fallback LAN del punto 4.

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
| `APP_ROOM_ID`  | Fija la room de todo el deployment. Recomendado en producción.               |
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
3. Configura `APP_ROOM_ID` (opcional pero recomendado) y `FRONTEND_URL` en `instantdrop-server` con la URL pública que Render asigne a `instantdrop-web`.
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

## Empaquetado Arch/Manjaro (`packaging/arch`)

El paquete AUR existente (`packaging/arch/PKGBUILD`) asume el layout anterior (`server.js` + `public/` en la raíz sirviendo también el frontend) y **no está actualizado** para esta nueva estructura de dos apps. Si vas a seguir manteniendo ese lanzador de escritorio, hay que actualizar el `PKGBUILD` y el script `instantdrop` para construir `apps/web` y ejecutar `apps/server` por separado (o apuntar a una instancia ya desplegada). Se dejó fuera de esta migración a propósito para no mezclar ambos cambios.
