# Empaquetado para Manjaro / Arch

Paquete `instantdrop-git` (no hay releases con tag, se compila desde el HEAD de `main`).

## Construir e instalar

```bash
cd packaging/arch
makepkg -si
```

Esto clona el repo, corre `npm install --omit=dev` y arma un paquete `.pkg.tar.zst` que instala:

- `/usr/share/webapps/instantdrop/` — código de la app + `node_modules`
- `/usr/bin/instantdrop` — arranca un servidor **local propio** (`node server.js`)
- `/usr/bin/instantdrop-open` — abre InstantDrop en una ventana de app (sin barra de direcciones ni pestañas)
- `/usr/lib/systemd/user/instantdrop.service` — unidad systemd de usuario para el servidor local
- `/usr/share/applications/instantdrop.desktop` — entrada de menú
- `/usr/share/pixmaps/instantdrop.png` — icono

## Uso tras instalar

**Icono del menú / `instantdrop-open`**: abre la instancia **pública** (`https://instantdrop.site`)
en una ventana de app. Es la forma recomendada de uso — todos los dispositivos que abren esa
misma instancia (desde el icono, desde el navegador, desde el celular) se detectan entre sí,
porque comparten el mismo servidor.

**Servidor local propio (opcional, avanzado)**: levanta tu propia instancia aislada, útil sin
internet. Al ser un servidor separado, **no comparte dispositivos** con la instancia pública ni
con el servidor local de otra persona — para verse entre sí, todos los demás dispositivos deben
conectarse a la IP de *este* equipo.

```bash
# solo por esta sesión
instantdrop

# como servicio de usuario (persiste entre reinicios de sesión)
systemctl --user enable --now instantdrop.service
```

Para apuntar `instantdrop-open` a tu servidor local en vez de la instancia pública:

```bash
INSTANTDROP_URL="http://$(hostname -I | awk '{print $1}'):3000" instantdrop-open
```

Para cambiar el puerto del servidor local:

```bash
systemctl --user edit instantdrop.service
# agregar bajo [Service]:
# Environment=PORT=8080
```

## Actualizar el paquete a un commit nuevo

```bash
cd packaging/arch
makepkg -sf
```

`pkgver()` recalcula automáticamente la versión (`r<nº de commits>.<hash corto>`) y reescribe el `pkgver` del PKGBUILD.

## Nota de seguridad de la cadena de suministro

El repo no versiona `package-lock.json` (está en `.gitignore`), así que `build()` resuelve
versiones vía rangos de `package.json` en cada compilación. Antes de actualizar este paquete:

- Revisar cambios de dependencias con `npm audit` / Socket.dev / GitHub Advisory Database.
- Confirmar que ninguna dependencia nueva agregó scripts `preinstall`/`postinstall`/`install`
  o un `binding.gyp` (al momento de escribir este README, ninguna de las dependencias directas
  ni de primer nivel transitivo los tiene).
