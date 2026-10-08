# InstantDrop Mobile

Aplicación nativa para Android e iOS con React Native CLI. No usa Expo.

## Requisitos

- Node.js 22.11 o superior
- Android Studio y Android SDK para Android
- macOS, Xcode y CocoaPods para iOS

## Instalar y ejecutar

Desde la raíz del monorepo:

```sh
npm install
npm run mobile:start
```

En otra terminal, inicia la plataforma:

```sh
npm run mobile:android
# o en macOS
npm run mobile:ios
```

En la app, toca el engranaje para configurar la URL del backend Express. Usa el mismo backend que `NEXT_PUBLIC_SERVER_URL` en la web. Para desarrollo local, configura la IP LAN del equipo que ejecuta `apps/server`, por ejemplo `http://192.168.1.20:4000`; `localhost` desde el teléfono apuntaría al propio teléfono. Opcionalmente, introduce un código de sala para conectar redes diferentes.

## Qué incluye

- Registro y descubrimiento de dispositivos con las rutas actuales del servidor.
- Actualizaciones de presencia por Server-Sent Events y negociación WebRTC compatible con la web.
- Selección nativa de varios archivos, solicitud de aceptación en el dispositivo receptor y transferencia P2P.
- Envío y recepción de texto con confirmación del destinatario.
- Archivos recibidos guardados en el directorio Documents de la app. En iOS ese directorio aparece en Archivos.
- Estado de conexión y órbita de dispositivos animada con React Native Animated.

En Android los archivos quedan en el directorio de documentos de la app.
