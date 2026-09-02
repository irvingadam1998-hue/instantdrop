# Empaquetado para Manjaro / Arch

Paquete `instantdrop-git` (no hay releases con tag, se compila desde el HEAD de `main`).

## Construir e instalar

```bash
cd packaging/arch
makepkg -si
```

Esto clona el repo, corre `npm install --omit=dev` y arma un paquete `.pkg.tar.zst` que instala:

- `/usr/share/webapps/instantdrop/` — código de la app + `node_modules`
- `/usr/bin/instantdrop` — arranca el servidor (`node server.js`)
- `/usr/bin/instantdrop-open` — arranca el servicio si no corre y abre el navegador
- `/usr/lib/systemd/user/instantdrop.service` — unidad systemd de usuario
- `/usr/share/applications/instantdrop.desktop` — entrada de menú
- `/usr/share/pixmaps/instantdrop.png` — icono

## Uso tras instalar

Arrancar solo por esta sesión:

```bash
instantdrop
```

Arrancar como servicio de usuario (persiste entre reinicios de sesión) y habilitarlo:

```bash
systemctl --user enable --now instantdrop.service
```

O abrir el icono **InstantDrop** en el menú de aplicaciones — arranca el servicio si hace falta y abre `http://localhost:3000`.

Para cambiar el puerto:

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
