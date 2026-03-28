# InstantDrop

Comparte archivos y texto entre dispositivos en la misma red WiFi — sin cables, sin cuentas, sin subir nada a la nube.

## Como funciona

- Los dispositivos en la misma red (mismo subnet) se descubren automaticamente.
- Cada dispositivo recibe un emoji unico como identificador.
- Las transferencias de archivos van **directamente de dispositivo a dispositivo (WebRTC P2P)** — el servidor nunca toca los archivos.
- Los clips de texto se almacenan en memoria en el servidor y son visibles para todos en la misma red.
- Un codigo QR permite a otros unirse rapidamente escaneando desde la app.

## Requisitos

- Node.js 18+
- npm

## Instalacion

```bash
npm install
```

## Uso

```bash
npm start
```

Abre `http://<tu-IP-local>:3000` en el navegador, o escanea el QR que aparece en la consola.

## Variables de entorno

| Variable               | Descripcion                                      |
|------------------------|--------------------------------------------------|
| `PORT`                 | Puerto del servidor (default: `3000`)            |
| `RAILWAY_PUBLIC_DOMAIN`| Dominio publico al desplegar en Railway          |

## Deploy en Railway

El proyecto detecta automaticamente `RAILWAY_PUBLIC_DOMAIN` para generar el QR y las URLs correctas.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com)

## Stack

- **Backend:** Node.js + Express
- **Transferencia:** WebRTC (datos P2P, servidor solo hace señalizacion via SSE)
- **Frontend:** HTML/CSS/JS vanilla
- **QR:** libreria `qrcode`

## Seguridad

- Cada dispositivo tiene un token unico generado con `crypto.randomBytes` — nadie puede suplantar a otro.
- El servidor valida que emisor y receptor esten en la misma subred antes de reenviar senales WebRTC.
- Rate limiting integrado en los endpoints criticos.
- Headers de seguridad basicos (`X-Content-Type-Options`, `X-Frame-Options`, etc.).
