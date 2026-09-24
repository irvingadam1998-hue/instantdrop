'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { langStorage } from './storage'

export type Lang = 'es' | 'en'

// One shared translation table for the whole site (main app + about/help/privacy),
// so the language choice is consistent across client-side navigation instead of
// resetting per page like the old multi-HTML-file version did.
export const TRANSLATIONS = {
  es: {
    'app.me': 'yo',
    'app.choose_device': 'elige un dispositivo',
    'app.drag_or_tap': 'arrastra o toca +',
    'app.ready': 'listo · arrastra o toca +',
    'app.searching': 'Buscando…',
    'app.offline': 'Conectando con InstantDrop…',
    'app.no_devices': 'Todavía no hay otro equipo conectado',
    'app.devices_one': 'equipo disponible',
    'app.devices_many': 'equipos disponibles',
    'app.selected': 'seleccionado',
    'app.send': 'enviar',
    'app.tip_reload': 'Abre InstantDrop en otro equipo para verlo aquí.',
    'app.text_link': 'Texto ¶',
    'app.received': 'Recibidos',
    'app.max': 'máx',
    'app.workspace_kicker': 'COMPARTIR EN PRIVADO',
    'app.workspace_title': 'Tus archivos, al otro lado.',
    'app.workspace_subtitle': 'Un espacio sencillo para mover cosas entre tus dispositivos.',
    'app.stage_label': 'ÁREA DE ENVÍO',
    'app.private_label': 'privado',
    'app.stage_prompt': 'Suelta archivos aquí o elige un equipo',
    'app.devices_eyebrow': 'CERCA DE TI',
    'app.devices_title': 'Dispositivos',
    'app.room_code': 'Código de sala',
    'app.room_apply': 'Cambiar sala',
    'footer.about': 'Acerca',
    'footer.help': 'Ayuda',
    'footer.privacy': 'Privacidad',
    'footer.contact': 'Contacto',
    'app.qr_hint': 'Abre esta URL en otro dispositivo.<br>Misma red WiFi requerida.',
    'app.close': 'Cerrar',
    'app.close_lower': 'cerrar',
    'app.recv_title': '📋 texto recibido',
    'app.copy_text': 'copiar texto',
    'app.copied': 'copiado ✓',
    'app.text_placeholder': 'escribe o pega el texto aquí…',
    'app.cancel': 'cancelar',
    'app.send_to_net': 'enviar a la red',
    'app.incoming_title': 'Te quieren compartir algo',
    'app.incoming_vibe_default': 'vaya a saber qué es esto 🎲',
    'app.reject': 'Ahora no',
    'app.accept': 'Aceptar y descargar',
    'toast.busy': 'hay una transferencia en progreso…',
    'toast.choose_first': 'toca un dispositivo primero',
    'toast.cancelled': 'transferencia cancelada',
    'toast.no_connect': 'no se pudo conectar con el dispositivo',
    'toast.rejected': 'el receptor rechazó el archivo 🚫',
    'toast.proto_err': 'error de protocolo',
    'toast.transfer_err': 'error en la transferencia',
    'toast.text_sent': 'texto enviado ✓',
    'toast.sent': 'enviado ✓',
    'toast.sender_cancel': 'el remitente canceló el envío',
    'toast.interrupted': 'transferencia interrumpida por el remitente',
    'toast.downloading': 'descargando… 📥',
    'toast.file_rejected': 'archivo rechazado 🗑️',
    'toast.text_shared': 'texto compartido en la red',
    'toast.copied_clip': 'copiado al portapapeles',
    'toast.copy_fail': 'no se pudo copiar',
    'toast.no_device': 'no hay dispositivo seleccionado',
    'toast.oversized': 'archivo demasiado grande (máx 500 MB)',
    'overlay.connecting': 'conectando con dispositivo…',
    'overlay.waiting': 'esperando confirmación…',
    'overlay.sending': 'enviando',
    'overlay.receiving': 'recibiendo',
    'app.text_panel_title': 'enviar texto',
    'app.text_panel_to': 'enviar texto a',
    'vibe.pdf': 'parece documento importante... o no 🤷',
    'vibe.doc': 'cuidado, puede tener tareas 😬',
    'vibe.xls': 'números. muchos números 🔢',
    'vibe.jpg': 'a ver qué fotazo te mandaron 👀',
    'vibe.png': 'imagen misteriosa del espacio exterior 🌌',
    'vibe.gif': 'definitivamente un meme 🐸',
    'vibe.mp4': 'una peli para el finde 🍿',
    'vibe.mp3': 'nueva canción para tu playlist 🎶',
    'vibe.zip': 'caja sorpresa digital 🎁',
    'vibe.rar': 'arqueología digital 🦕',
    'vibe.exe': 'esto se ve MUY sospechoso 🚨',
    'vibe.dmg': 'hmm... ¿de verdad confías? 🤔',
    'vibe.txt': 'texto plano. minimalista. elegante 🧘',
    'vibe.json': 'datos en crudo, para valientes 🤓',
    'vibe.py': 'código python... espero que no sea skynet 🤖',
    'vibe.js': 'javascript: el caos hecho arte 🎨',
    'vibe.default': '¿qué será? vaya a saber 🎲',
    'files.more': 'más',
    'files.files': 'archivos',
    'nav.title': 'InstantDrop',
    'nav.app': 'Abrir app',
    'about.title': 'Compartir archivos entre dispositivos, sin subirlos a la nube',
    'about.lead':
      'Envía fotos y documentos entre teléfono y computadora desde el navegador. Los archivos se transfieren entre los equipos mediante WebRTC cuando la conexión directa se establece; InstantDrop coordina el descubrimiento y el inicio de la conexión.',
    'about.f1.title': 'Hasta 500 MB por archivo',
    'about.f1.body': 'Ese es el máximo que acepta la aplicación por archivo.',
    'about.f2.title': 'Clips de texto',
    'about.f2.body': 'Los clips se comparten con la sala y se conservan temporalmente en memoria del servicio hasta borrarlos o reiniciar el servidor.',
    'about.f3.title': 'Teléfono y computadora',
    'about.f3.body': 'Android, iOS, Windows, Mac o Linux — solo necesitas un navegador.',
    'about.f4.title': 'Archivos por WebRTC',
    'about.f4.body': 'El contenido de los archivos no se carga al servidor de InstantDrop durante una transferencia directa entre navegadores.',
    'about.f5.title': 'Conexión directa',
    'about.f5.body': 'La velocidad depende de la red, el navegador y la conexión que WebRTC logre establecer.',
    'about.f6.title': 'Sin instalar nada',
    'about.f6.body': 'Abre una URL y listo. Nada de apps, cuentas ni configuración.',
    'about.how.title': 'Cómo funciona por dentro',
    'about.how.p1':
      'Al abrir InstantDrop, el servicio registra temporalmente el navegador activo en una sala. Por defecto, la sala se calcula a partir de la red; también puedes escribir un código para reunir equipos en una misma sala.',
    'about.how.p2':
      'Al elegir un destinatario, el servidor intercambia los mensajes de señalización necesarios para que ambos navegadores negocien WebRTC. Si se establece el canal directo, los bytes del archivo viajan entre los dispositivos mediante el canal cifrado de WebRTC. La red puede impedir esa conexión directa.',
    'about.who.title': '¿Para quién es útil?',
    'about.who.p1':
      'Para oficinas y aulas que necesitan pasar archivos entre equipos sin depender de USBs o de subir todo a la nube.',
    'about.who.p2':
      'Para cualquiera que quiera mandar una foto del celular a la computadora, o un texto largo entre dispositivos, sin cables ni cuentas.',
    'about.cta': 'Ir a la app',
    'help.title': 'Cómo usar InstantDrop',
    'help.lead': 'Pasos para compartir archivos y texto entre un teléfono, una computadora u otro navegador compatible.',
    'help.files.title': 'Enviar un archivo',
    'help.files.s1': 'Abre InstantDrop en ambos dispositivos, conectados a la misma red WiFi.',
    'help.files.s2': 'Toca el dispositivo destino en la fila de dispositivos detectados.',
    'help.files.s3': 'Usa el botón para subir un archivo o arrástralo sobre el área de envío o el dispositivo destino.',
    'help.files.s4': 'El otro dispositivo verá una solicitud y podrá aceptar o rechazar la descarga.',
    'help.text.title': 'Enviar texto',
    'help.text.s1': 'Selecciona el dispositivo destino.',
    'help.text.s2': 'Toca el ícono ¶ o "Texto", escribe o pega tu contenido.',
    'help.text.s3': 'Envía el clip. Se comparte con la sala y se conserva temporalmente en memoria del servicio.',
    'help.connection.title': 'Red local y salas compartidas',
    'help.connection.p1': 'La lista muestra otros navegadores activos en tu sala. En la misma red, InstantDrop asigna automáticamente una sala de red. Si los equipos están en redes diferentes, escribe el mismo código de sala en ambos y asegúrate de que puedan acceder al servicio de señalización.',
    'help.connection.p2': 'El código de sala solo agrupa dispositivos; no garantiza que todas las redes permitan una conexión WebRTC directa. VPN, redes de invitados, firewalls o aislamiento de clientes WiFi pueden bloquear el descubrimiento o el envío.',
    'help.limits.title': 'Límites',
    'help.limits.size': 'Tamaño máximo por archivo',
    'help.limits.sizeVal': '500 MB',
    'help.limits.text': 'Longitud máxima de texto',
    'help.limits.textVal': '10.000 caracteres',
    'help.limits.browsers': 'Navegadores compatibles',
    'help.limits.browsersVal': 'Cualquiera con soporte WebRTC (Chrome, Firefox, Safari, Edge)',
    'help.limits.network': 'Requisito de red',
    'help.limits.networkVal': 'Misma red o mismo código de sala y conexión WebRTC disponible',
    'help.troubleshooting.title': 'Si un dispositivo no aparece',
    'help.troubleshooting.p1': 'Confirma que InstantDrop esté abierto en ambos navegadores, que estén en la misma sala y que la conexión a internet o a la red local esté activa. La lista se actualiza mientras los dispositivos mantienen una conexión viva.',
    'help.troubleshooting.p2': 'En redes WiFi de invitados o empresariales puede estar activado el aislamiento entre dispositivos. Prueba una red local sin aislamiento, desactiva temporalmente una VPN o comparte un código de sala si ambos equipos usan redes diferentes.',
    'help.faq.title': 'Preguntas frecuentes',
    'help.faq.q1': '¿Los archivos pasan por algún servidor?',
    'help.faq.a1': 'Los bytes del archivo van entre navegadores por WebRTC cuando el canal directo se establece. La señalización pasa por el servicio. Los clips de texto sí se envían al servidor y quedan en memoria temporal.',
    'help.faq.q2': '¿Necesito internet?',
    'help.faq.a2': 'Ambos dispositivos necesitan llegar al servicio de señalización. WebRTC también necesita una ruta de red compatible; estar en la misma WiFi suele ayudar, pero algunos routers aíslan equipos.',
    'help.faq.q3': '¿Qué pasa si cierro la pestaña durante una transferencia?',
    'help.faq.a3': 'La transferencia se interrumpe — no hay reanudación automática todavía.',
    'help.faq.q4': '¿Se guardan mis archivos en algún lado?',
    'help.faq.a4': 'Los archivos no se guardan en el servidor de InstantDrop durante una conexión WebRTC directa. Los clips de texto sí se guardan temporalmente en memoria; se eliminan al borrarlos o cuando se reinicia el servidor.',
    'help.faq.q5': '¿Puedo compartir con alguien fuera de mi red?',
    'help.faq.a5': 'Puedes usar el mismo código de sala, pero ambos deben alcanzar el servicio y sus redes deben permitir que WebRTC conecte los navegadores.',
    'help.faq.q6': '¿Por qué no veo el otro dispositivo?',
    'help.faq.a6': 'Comprueba que ambos estén en la misma sala y que la red no tenga aislamiento de clientes. Algunas VPN, firewalls y WiFi de invitados bloquean la comunicación entre equipos.',
    'help.cta': 'Ir a la app',
    'privacy.title': 'Privacidad',
    'privacy.updated': 'Última actualización: 24 de septiembre de 2026',
    'privacy.summary':
      'InstantDrop no necesita una cuenta y no almacena los archivos enviados por una conexión WebRTC directa. El servicio sí procesa datos de conexión y conserva clips de texto temporalmente en memoria.',
    'privacy.s1.title': '1. Datos de conexión',
    'privacy.s1.body':
      'El navegador envía al servicio un identificador aleatorio, un token de autorización, un nombre de dispositivo, un emoji, el código de sala y datos de sesión. El servidor también recibe solicitudes de red, que pueden incluir tu dirección IP. La presencia se conserva en memoria mientras está conectado y vence al cerrar la conexión o tras 15 segundos sin actividad.',
    'privacy.s2.title': '2. Archivos y texto compartido',
    'privacy.s2.body':
      'Cuando WebRTC establece una conexión directa, los bytes de los archivos se envían entre navegadores y no se guardan en el servidor de InstantDrop. Los clips de texto se envían al servicio y se mantienen en memoria para los dispositivos de la sala hasta que se borran o se reinicia el servidor. No envíes por clips información que no quieras compartir con esa sala.',
    'privacy.s3.title': '3. Conexión WebRTC y red',
    'privacy.s3.body':
      'El servidor transmite mensajes de señalización para establecer la conexión. WebRTC cifra el canal de datos, pero la conexión puede revelar a los participantes información de red necesaria para conectarse. InstantDrop usa el servicio STUN público de Google para ayudar a descubrir rutas de red; Google y el proveedor de alojamiento pueden procesar metadatos de conexión conforme a sus propias políticas.',
    'privacy.s4.title': '4. Cookies y almacenamiento del navegador',
    'privacy.s4.body':
      'La aplicación no establece cookies propias. El navegador guarda en almacenamiento local las credenciales aleatorias del dispositivo, el emoji y el idioma; un código de sala se conserva para sincronizar pestañas y se restablece al recargar. Puedes borrar estos datos desde la configuración del navegador; al hacerlo se creará otra identidad de dispositivo.',
    'privacy.s5.title': '5. Servicios de terceros',
    'privacy.s5.body':
      'El alojamiento procesa las solicitudes web y de señalización. La aplicación no carga actualmente el script de anuncios de AdSense ni los scripts de Vercel Analytics; la verificación de AdSense usa una etiqueta meta y el archivo ads.txt, que no muestran anuncios ni recopilan datos por sí solos. Las fuentes tipográficas se sirven desde el propio sitio.',
    'privacy.s6.title': '6. Menores de edad',
    'privacy.s6.body': 'El servicio no está dirigido a menores de 13 años.',
    'privacy.s7.title': '7. Cambios a esta política',
    'privacy.s7.body': 'Esta política puede cambiar cuando cambien el servicio o los proveedores. La fecha de actualización aparece al inicio de la página.',
    'privacy.contact': 'Contacto',
  },
  en: {
    'app.me': 'me',
    'app.choose_device': 'choose a device',
    'app.drag_or_tap': 'drag or tap +',
    'app.ready': 'ready · drag or tap +',
    'app.searching': 'Searching…',
    'app.offline': 'Connecting to InstantDrop…',
    'app.no_devices': 'No other devices are connected yet',
    'app.devices_one': 'device available',
    'app.devices_many': 'devices available',
    'app.selected': 'selected',
    'app.send': 'send',
    'app.tip_reload': 'Open InstantDrop on another device to see it here.',
    'app.text_link': 'Text ¶',
    'app.received': 'Received',
    'app.max': 'max',
    'app.workspace_kicker': 'PRIVATE SHARING',
    'app.workspace_title': 'Your files, over there.',
    'app.workspace_subtitle': 'A simple space to move things between your devices.',
    'app.stage_label': 'SEND AREA',
    'app.private_label': 'private',
    'app.stage_prompt': 'Drop files here or choose a device',
    'app.devices_eyebrow': 'AROUND YOU',
    'app.devices_title': 'Devices',
    'app.room_code': 'Room code',
    'app.room_apply': 'Change room',
    'footer.about': 'About',
    'footer.help': 'Help',
    'footer.privacy': 'Privacy',
    'footer.contact': 'Contact',
    'app.qr_hint': 'Open this URL on another device.<br>Same WiFi network required.',
    'app.close': 'Close',
    'app.close_lower': 'close',
    'app.recv_title': '📋 received text',
    'app.copy_text': 'copy text',
    'app.copied': 'copied ✓',
    'app.text_placeholder': 'write or paste text here…',
    'app.cancel': 'cancel',
    'app.send_to_net': 'send to network',
    'app.incoming_title': 'Someone wants to share a file',
    'app.incoming_vibe_default': 'who knows what this is 🎲',
    'app.reject': 'Not now',
    'app.accept': 'Accept and download',
    'toast.busy': 'transfer in progress…',
    'toast.choose_first': 'tap a device first',
    'toast.cancelled': 'transfer cancelled',
    'toast.no_connect': 'could not connect to device',
    'toast.rejected': 'receiver rejected the file 🚫',
    'toast.proto_err': 'protocol error',
    'toast.transfer_err': 'transfer error',
    'toast.text_sent': 'text sent ✓',
    'toast.sent': 'sent ✓',
    'toast.sender_cancel': 'sender cancelled the transfer',
    'toast.interrupted': 'transfer interrupted by sender',
    'toast.downloading': 'downloading… 📥',
    'toast.file_rejected': 'file rejected 🗑️',
    'toast.text_shared': 'text shared on the network',
    'toast.copied_clip': 'copied to clipboard',
    'toast.copy_fail': 'could not copy',
    'toast.no_device': 'no device selected',
    'toast.oversized': 'file too large (max 500 MB)',
    'overlay.connecting': 'connecting to device…',
    'overlay.waiting': 'waiting for confirmation…',
    'overlay.sending': 'sending',
    'overlay.receiving': 'receiving',
    'app.text_panel_title': 'send text',
    'app.text_panel_to': 'send text to',
    'vibe.pdf': 'looks like an important document... maybe 🤷',
    'vibe.doc': 'careful, might have homework 😬',
    'vibe.xls': 'numbers. lots of numbers 🔢',
    'vibe.jpg': "let's see what photo they sent you 👀",
    'vibe.png': 'mysterious image from outer space 🌌',
    'vibe.gif': 'definitely a meme 🐸',
    'vibe.mp4': 'a movie for the weekend 🍿',
    'vibe.mp3': 'new song for your playlist 🎶',
    'vibe.zip': 'digital surprise box 🎁',
    'vibe.rar': 'digital archaeology 🦕',
    'vibe.exe': 'this looks VERY suspicious 🚨',
    'vibe.dmg': 'hmm... do you really trust this? 🤔',
    'vibe.txt': 'plain text. minimalist. elegant 🧘',
    'vibe.json': 'raw data, for the brave 🤓',
    'vibe.py': "python code... hope it's not skynet 🤖",
    'vibe.js': 'javascript: chaos made art 🎨',
    'vibe.default': 'who knows? 🎲',
    'files.more': 'more',
    'files.files': 'files',
    'nav.title': 'InstantDrop',
    'nav.app': 'Open app',
    'about.title': 'Share files between devices without uploading them to the cloud',
    'about.lead':
      'Send photos and documents between a phone and computer from the browser. Files transfer between devices over WebRTC when a direct connection can be established; InstantDrop coordinates discovery and connection setup.',
    'about.f1.title': 'Up to 500 MB per file',
    'about.f1.body': 'That is the maximum file size accepted by the app.',
    'about.f2.title': 'Text clips',
    'about.f2.body': 'Clips are shared with the room and temporarily kept in service memory until deleted or the server restarts.',
    'about.f3.title': 'Phones and computers',
    'about.f3.body': 'Android, iOS, Windows, Mac or Linux — you only need a browser.',
    'about.f4.title': 'Files over WebRTC',
    'about.f4.body': 'File contents are not uploaded to the InstantDrop server during a direct browser-to-browser transfer.',
    'about.f5.title': 'Direct connection',
    'about.f5.body': 'Transfer speed depends on your network, browser and the connection WebRTC can establish.',
    'about.f6.title': 'Nothing to install',
    'about.f6.body': 'Open a URL and go. No apps, no accounts, no setup.',
    'about.how.title': 'How it works under the hood',
    'about.how.p1':
      'When you open InstantDrop, the service temporarily registers your active browser in a room. By default, the room is derived from the network; you can also enter a code to bring devices together.',
    'about.how.p2':
      'When you choose a recipient, the server relays the signaling messages both browsers need to negotiate WebRTC. If a direct channel is established, file bytes travel between devices over WebRTC’s encrypted data channel. Some networks may prevent a direct connection.',
    'about.who.title': 'Who is this useful for?',
    'about.who.p1':
      'Offices and classrooms that need to move files between machines without relying on USB drives or uploading everything to the cloud.',
    'about.who.p2':
      'Anyone who wants to send a phone photo to their computer, or a long text between devices, without cables or accounts.',
    'about.cta': 'Go to the app',
    'help.title': 'How to use InstantDrop',
    'help.lead': 'Steps for sharing files and text between a phone, computer or another compatible browser.',
    'help.files.title': 'Send a file',
    'help.files.s1': 'Open InstantDrop on both devices, connected to the same WiFi network.',
    'help.files.s2': 'Tap the destination device in the row of detected devices.',
    'help.files.s3': 'Use the upload button or drag the file onto the send area or destination device.',
    'help.files.s4': 'The other device will see a request and can accept or reject the download.',
    'help.text.title': 'Send text',
    'help.text.s1': 'Select the destination device.',
    'help.text.s2': 'Tap the ¶ icon or "Text", write or paste your content.',
    'help.text.s3': 'Send the clip. It is shared with the room and temporarily kept in the service memory.',
    'help.connection.title': 'Local networks and shared rooms',
    'help.connection.p1': 'The list shows other active browsers in your room. On the same network, InstantDrop assigns a network room automatically. If devices are on different networks, enter the same room code on both and make sure they can reach the signaling service.',
    'help.connection.p2': 'A room code only groups devices; it cannot guarantee that every network allows a direct WebRTC connection. VPNs, guest networks, firewalls or WiFi client isolation can block discovery or sending.',
    'help.limits.title': 'Limits',
    'help.limits.size': 'Max size per file',
    'help.limits.sizeVal': '500 MB',
    'help.limits.text': 'Max text length',
    'help.limits.textVal': '10,000 characters',
    'help.limits.browsers': 'Supported browsers',
    'help.limits.browsersVal': 'Any with WebRTC support (Chrome, Firefox, Safari, Edge)',
    'help.limits.network': 'Network requirement',
    'help.limits.networkVal': 'Same network, or same room code with a working WebRTC connection',
    'help.troubleshooting.title': 'If a device does not appear',
    'help.troubleshooting.p1': 'Check that InstantDrop is open in both browsers, that they are in the same room, and that the local network or internet connection is active. The list updates while devices keep a live connection.',
    'help.troubleshooting.p2': 'Guest or corporate WiFi may isolate devices from each other. Try a local network without client isolation, temporarily turn off a VPN, or use a shared room code if the devices are on different networks.',
    'help.faq.title': 'Frequently asked questions',
    'help.faq.q1': 'Do files go through a server?',
    'help.faq.a1': 'File bytes travel between browsers over WebRTC when a direct channel is established. Signaling goes through the service. Text clips are sent to the server and temporarily kept in memory.',
    'help.faq.q2': 'Do I need internet?',
    'help.faq.a2': 'Both devices need to reach the signaling service. WebRTC also needs a compatible network route; the same WiFi usually helps, but some routers isolate devices.',
    'help.faq.q3': 'What happens if I close the tab during a transfer?',
    'help.faq.a3': "The transfer is interrupted — there's no automatic resume yet.",
    'help.faq.q4': 'Are my files stored anywhere?',
    'help.faq.a4': 'Files are not stored by the InstantDrop server during a direct WebRTC connection. Text clips are temporarily kept in memory and removed when deleted or when the server restarts.',
    'help.faq.q5': 'Can I share with someone outside my network?',
    'help.faq.a5': 'You can use the same room code, but both devices must reach the service and their networks must allow WebRTC to connect the browsers.',
    'help.faq.q6': "Why can't I see the other device?",
    'help.faq.a6': 'Check that both are in the same room and that the network does not isolate clients. Some VPNs, firewalls and guest WiFi networks block device-to-device communication.',
    'help.cta': 'Go to the app',
    'privacy.title': 'Privacy',
    'privacy.updated': 'Last updated: September 24, 2026',
    'privacy.summary': 'InstantDrop does not require an account and does not store files sent over a direct WebRTC connection. The service does process connection data and temporarily keeps text clips in memory.',
    'privacy.s1.title': '1. Connection data',
    'privacy.s1.body':
      'The browser sends the service a random identifier, authorization token, device name, emoji, room code and session data. The server also receives network requests, which may include your IP address. Device presence is kept in memory while connected and expires when the connection closes or after 15 seconds without activity.',
    'privacy.s2.title': '2. Files and shared text',
    'privacy.s2.body': 'When WebRTC establishes a direct connection, file bytes are sent between browsers and are not stored by the InstantDrop server. Text clips are sent to the service and kept in memory for devices in the room until deleted or the server restarts. Do not share clip content that you do not want visible to that room.',
    'privacy.s3.title': '3. WebRTC connection and network',
    'privacy.s3.body': 'The server relays signaling messages to establish the connection. WebRTC encrypts its data channel, but the connection can reveal network information needed to connect to participants. InstantDrop uses Google’s public STUN service to help discover network routes; Google and the hosting provider may process connection metadata under their own policies.',
    'privacy.s4.title': '4. Cookies and browser storage',
    'privacy.s4.body': 'The application does not set its own cookies. The browser stores random device credentials, emoji and language in local storage; a room code is retained to synchronize tabs and resets when you reload the page. You can clear this data in your browser settings; doing so creates a new device identity.',
    'privacy.s5.title': '5. Third-party services',
    'privacy.s5.body': 'The hosting provider processes web and signaling requests. The application does not currently load the AdSense advertising script or Vercel Analytics scripts; AdSense verification uses a meta tag and ads.txt file, which do not display ads or collect data by themselves. Fonts are served from this site.',
    'privacy.s6.title': '6. Minors',
    'privacy.s6.body': 'The service is not directed at children under 13.',
    'privacy.s7.title': '7. Changes to this policy',
    'privacy.s7.body': 'This policy may change when the service or its providers change. The update date appears at the top of this page.',
    'privacy.contact': 'Contact',
  },
} as const

export type TranslationKey = keyof (typeof TRANSLATIONS)['es']

interface I18nContextValue {
  lang: Lang
  t: (key: TranslationKey) => string
  toggleLang: () => void
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function detectInitialLang(): Lang {
  const saved = langStorage.get()
  if (saved === 'es' || saved === 'en') return saved
  if (typeof navigator !== 'undefined') {
    return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en'
  }
  return 'es'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    setLangState(detectInitialLang())
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    langStorage.set(next)
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'es' ? 'en' : 'es'
      langStorage.set(next)
      return next
    })
  }, [])

  const t = useCallback((key: TranslationKey) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.es[key] ?? key, [lang])

  const value = useMemo(() => ({ lang, t, toggleLang, setLang }), [lang, t, toggleLang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
