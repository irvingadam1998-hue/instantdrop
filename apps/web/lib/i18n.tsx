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
    'app.no_devices': 'Ningún otro dispositivo en tu red',
    'app.devices_one': 'dispositivo en tu red',
    'app.devices_many': 'dispositivos en tu red',
    'app.selected': 'seleccionado',
    'app.send': 'enviar',
    'app.tip_reload': '¿no ves tu dispositivo? recarga la página en ambos',
    'app.text_link': 'Texto ¶',
    'app.received': 'Recibidos',
    'app.max': 'máx',
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
    'app.incoming_title': '¡te llegó algo!',
    'app.incoming_vibe_default': 'vaya a saber qué es esto 🎲',
    'app.reject': '😤 Nah',
    'app.accept': '🎁 ¡Lo quiero!',
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
    'about.title': 'Comparte sin fricción, sin la nube.',
    'about.lead':
      'InstantDrop conecta los dispositivos de tu misma red WiFi para mover archivos y texto al instante, directo entre navegadores, sin subir nada a ningún servidor.',
    'about.f1.title': 'Hasta 500 MB',
    'about.f1.body': 'Envía archivos grandes sin límites artificiales de plan gratuito.',
    'about.f2.title': 'Texto instantáneo',
    'about.f2.body': 'Pega texto y aparece en todos los dispositivos de tu red al momento.',
    'about.f3.title': 'Cualquier dispositivo',
    'about.f3.body': 'Android, iOS, Windows, Mac o Linux — solo necesitas un navegador.',
    'about.f4.title': '100% privado',
    'about.f4.body': 'Los archivos nunca tocan un servidor: viajan directo entre equipos.',
    'about.f5.title': 'Máxima velocidad',
    'about.f5.body': 'Al ir P2P, la transferencia usa toda la velocidad de tu red local.',
    'about.f6.title': 'Sin instalar nada',
    'about.f6.body': 'Abre una URL y listo. Nada de apps, cuentas ni configuración.',
    'about.how.title': 'Cómo funciona por dentro',
    'about.how.p1':
      'Cuando abres InstantDrop, tu navegador se registra en una "sala" — determinada por tu red o por un código que compartas — y aparece frente a los demás dispositivos conectados a esa misma sala.',
    'about.how.p2':
      'Al elegir un destinatario, los dos navegadores negocian una conexión directa vía WebRTC. El servidor solo ayuda a intercambiar esa negociación inicial (señalización); una vez conectados, los datos viajan de dispositivo a dispositivo sin pasar por ningún servidor intermedio.',
    'about.who.title': '¿Para quién es útil?',
    'about.who.p1':
      'Para oficinas y aulas que necesitan pasar archivos entre equipos sin depender de USBs o de subir todo a la nube.',
    'about.who.p2':
      'Para cualquiera que quiera mandar una foto del celular a la computadora, o un texto largo entre dispositivos, sin cables ni cuentas.',
    'about.cta': 'Ir a la app',
    'help.title': 'Cómo usar InstantDrop',
    'help.files.title': 'Enviar un archivo',
    'help.files.s1': 'Abre InstantDrop en ambos dispositivos, conectados a la misma red WiFi.',
    'help.files.s2': 'Toca el dispositivo destino en la fila de dispositivos detectados.',
    'help.files.s3': 'Toca el botón + o arrastra el archivo sobre el diamante central (o directo sobre el dispositivo).',
    'help.files.s4': 'El otro dispositivo verá una solicitud y podrá aceptar o rechazar la descarga.',
    'help.text.title': 'Enviar texto',
    'help.text.s1': 'Selecciona el dispositivo destino.',
    'help.text.s2': 'Toca el ícono ¶ o "Texto", escribe o pega tu contenido.',
    'help.text.s3': 'Envía — el texto llega directo, sin pasar por servidores de terceros.',
    'help.limits.title': 'Límites',
    'help.limits.size': 'Tamaño máximo por archivo',
    'help.limits.sizeVal': '500 MB',
    'help.limits.text': 'Longitud máxima de texto',
    'help.limits.textVal': '10.000 caracteres',
    'help.limits.browsers': 'Navegadores compatibles',
    'help.limits.browsersVal': 'Cualquiera con soporte WebRTC (Chrome, Firefox, Safari, Edge)',
    'help.limits.network': 'Requisito de red',
    'help.limits.networkVal': 'Misma red WiFi, o misma sala compartida por código',
    'help.install.title': 'Instalar como app en Manjaro/Arch Linux',
    'help.install.body':
      'Si usas Arch o Manjaro, hay un paquete AUR que empaqueta un lanzador de escritorio para InstantDrop.',
    'help.install.aur': 'Desde AUR:',
    'help.install.manual': 'O de forma manual, clonando el repositorio y construyendo el paquete:',
    'help.faq.title': 'Preguntas frecuentes',
    'help.faq.q1': '¿Los archivos pasan por algún servidor?',
    'help.faq.a1': 'No. Solo la negociación inicial de conexión (WebRTC) pasa por el servidor; los datos viajan directo entre navegadores.',
    'help.faq.q2': '¿Necesito internet?',
    'help.faq.a2': 'Necesitas que ambos dispositivos puedan llegar al servidor de señalización, y estar en la misma red para el emparejamiento local.',
    'help.faq.q3': '¿Qué pasa si cierro la pestaña durante una transferencia?',
    'help.faq.a3': 'La transferencia se interrumpe — no hay reanudación automática todavía.',
    'help.faq.q4': '¿Se guardan mis archivos en algún lado?',
    'help.faq.a4': 'No, nunca. El servidor jamás recibe ni almacena el contenido de tus archivos.',
    'help.faq.q5': '¿Puedo compartir con alguien fuera de mi red?',
    'help.faq.a5': 'Sí, usando el mismo código de sala en ambos dispositivos, aunque estén en redes distintas.',
    'help.faq.q6': '¿Por qué no veo el otro dispositivo?',
    'help.faq.a6': 'Recarga la página en ambos, confirma que estén en la misma sala/red, y espera unos segundos al ciclo de detección.',
    'help.cta': 'Ir a la app',
    'privacy.title': 'Privacidad',
    'privacy.summary':
      'InstantDrop no requiere cuentas, no almacena tus archivos y no los ve nunca: viajan directo entre tus dispositivos.',
    'privacy.s1.title': '1. Qué datos manejamos',
    'privacy.s1.body':
      'Un identificador de dispositivo aleatorio, un token de sesión y un emoji — todo generado sin datos personales, y solo mientras tu dispositivo está activo en la red.',
    'privacy.s2.title': '2. Qué NO manejamos',
    'privacy.s2.body':
      'No pedimos registro, correo ni contraseña. No almacenamos el contenido de tus archivos ni los leemos: se transfieren peer-to-peer.',
    'privacy.s3.title': '3. Transferencia P2P',
    'privacy.s3.body':
      'Los archivos viajan directo entre navegadores vía WebRTC. El servidor solo reenvía los mensajes de señalización necesarios para establecer esa conexión.',
    'privacy.s4.title': '4. Cookies y almacenamiento local',
    'privacy.s4.body':
      'Usamos localStorage en tu navegador para recordar tu identidad de dispositivo, idioma y sala — nunca se envía a terceros.',
    'privacy.s5.title': '5. Servicios de terceros',
    'privacy.s5.body':
      'En producción pueden cargarse scripts de analítica/anuncios (Google Tag Manager, AdSense, GoatCounter, CountAPI) para medir uso agregado del sitio.',
    'privacy.s6.title': '6. Menores de edad',
    'privacy.s6.body': 'El servicio no está dirigido a menores de 13 años.',
    'privacy.s7.title': '7. Cambios a esta política',
    'privacy.s7.body': 'Podemos actualizar esta página; los cambios relevantes se reflejarán aquí con nueva fecha.',
    'privacy.contact': 'Contacto',
  },
  en: {
    'app.me': 'me',
    'app.choose_device': 'choose a device',
    'app.drag_or_tap': 'drag or tap +',
    'app.ready': 'ready · drag or tap +',
    'app.searching': 'Searching…',
    'app.no_devices': 'No other devices on your network',
    'app.devices_one': 'device on your network',
    'app.devices_many': 'devices on your network',
    'app.selected': 'selected',
    'app.send': 'send',
    'app.tip_reload': "don't see your device? reload the page on both",
    'app.text_link': 'Text ¶',
    'app.received': 'Received',
    'app.max': 'max',
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
    'app.incoming_title': 'something arrived!',
    'app.incoming_vibe_default': 'who knows what this is 🎲',
    'app.reject': '😤 Nah',
    'app.accept': '🎁 I want it!',
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
    'about.title': "Share without friction, without the cloud.",
    'about.lead':
      'InstantDrop connects devices on your WiFi network to move files and text instantly, straight between browsers, without uploading anything to any server.',
    'about.f1.title': 'Up to 500 MB',
    'about.f1.body': 'Send large files without artificial free-plan limits.',
    'about.f2.title': 'Instant text',
    'about.f2.body': 'Paste text and it shows up on every device on your network right away.',
    'about.f3.title': 'Any device',
    'about.f3.body': 'Android, iOS, Windows, Mac or Linux — you only need a browser.',
    'about.f4.title': '100% private',
    'about.f4.body': 'Files never touch a server: they travel straight between machines.',
    'about.f5.title': 'Full speed',
    'about.f5.body': 'Being P2P, the transfer uses the full speed of your local network.',
    'about.f6.title': 'Nothing to install',
    'about.f6.body': 'Open a URL and go. No apps, no accounts, no setup.',
    'about.how.title': 'How it works under the hood',
    'about.how.p1':
      'When you open InstantDrop, your browser registers in a "room" — determined by your network or by a code you share — and shows up to the other devices connected to that same room.',
    'about.how.p2':
      'When you pick a recipient, both browsers negotiate a direct connection via WebRTC. The server only helps exchange that initial negotiation (signaling); once connected, data travels device-to-device without passing through any server in between.',
    'about.who.title': 'Who is this useful for?',
    'about.who.p1':
      'Offices and classrooms that need to move files between machines without relying on USB drives or uploading everything to the cloud.',
    'about.who.p2':
      'Anyone who wants to send a phone photo to their computer, or a long text between devices, without cables or accounts.',
    'about.cta': 'Go to the app',
    'help.title': 'How to use InstantDrop',
    'help.files.title': 'Send a file',
    'help.files.s1': 'Open InstantDrop on both devices, connected to the same WiFi network.',
    'help.files.s2': 'Tap the destination device in the row of detected devices.',
    'help.files.s3': 'Tap the + button or drag the file onto the central diamond (or straight onto the device).',
    'help.files.s4': 'The other device will see a request and can accept or reject the download.',
    'help.text.title': 'Send text',
    'help.text.s1': 'Select the destination device.',
    'help.text.s2': 'Tap the ¶ icon or "Text", write or paste your content.',
    'help.text.s3': "Send — the text arrives directly, without going through third-party servers.",
    'help.limits.title': 'Limits',
    'help.limits.size': 'Max size per file',
    'help.limits.sizeVal': '500 MB',
    'help.limits.text': 'Max text length',
    'help.limits.textVal': '10,000 characters',
    'help.limits.browsers': 'Supported browsers',
    'help.limits.browsersVal': 'Any with WebRTC support (Chrome, Firefox, Safari, Edge)',
    'help.limits.network': 'Network requirement',
    'help.limits.networkVal': 'Same WiFi network, or same room shared via code',
    'help.install.title': 'Install as an app on Manjaro/Arch Linux',
    'help.install.body': 'If you use Arch or Manjaro, there is an AUR package that bundles a desktop launcher for InstantDrop.',
    'help.install.aur': 'From AUR:',
    'help.install.manual': 'Or manually, cloning the repo and building the package:',
    'help.faq.title': 'Frequently asked questions',
    'help.faq.q1': 'Do files go through a server?',
    'help.faq.a1': 'No. Only the initial connection negotiation (WebRTC) goes through the server; data travels directly between browsers.',
    'help.faq.q2': 'Do I need internet?',
    'help.faq.a2': 'Both devices need to reach the signaling server, and be on the same network for local pairing.',
    'help.faq.q3': 'What happens if I close the tab during a transfer?',
    'help.faq.a3': "The transfer is interrupted — there's no automatic resume yet.",
    'help.faq.q4': 'Are my files stored anywhere?',
    'help.faq.a4': 'Never. The server never receives or stores your file contents.',
    'help.faq.q5': 'Can I share with someone outside my network?',
    'help.faq.a5': 'Yes, by using the same room code on both devices, even on different networks.',
    'help.faq.q6': "Why can't I see the other device?",
    'help.faq.a6': 'Reload the page on both, confirm they are in the same room/network, and wait a few seconds for the discovery cycle.',
    'help.cta': 'Go to the app',
    'privacy.title': 'Privacy',
    'privacy.summary': "InstantDrop doesn't require accounts, doesn't store your files, and never sees them: they travel directly between your devices.",
    'privacy.s1.title': '1. What data we handle',
    'privacy.s1.body':
      'A random device identifier, a session token, and an emoji — all generated without personal data, and only while your device is active on the network.',
    'privacy.s2.title': "2. What we DON'T handle",
    'privacy.s2.body': "We don't ask for sign-up, email or password. We don't store your file contents or read them: they transfer peer-to-peer.",
    'privacy.s3.title': '3. P2P transfer',
    'privacy.s3.body': 'Files travel directly between browsers via WebRTC. The server only relays the signaling messages needed to establish that connection.',
    'privacy.s4.title': '4. Cookies and local storage',
    'privacy.s4.body': 'We use localStorage in your browser to remember your device identity, language and room — never sent to third parties.',
    'privacy.s5.title': '5. Third-party services',
    'privacy.s5.body': 'In production, analytics/ad scripts may load (Google Tag Manager, AdSense, GoatCounter, CountAPI) to measure aggregate site usage.',
    'privacy.s6.title': '6. Minors',
    'privacy.s6.body': 'The service is not directed at children under 13.',
    'privacy.s7.title': '7. Changes to this policy',
    'privacy.s7.body': 'We may update this page; relevant changes will be reflected here with a new date.',
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
