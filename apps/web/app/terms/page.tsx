import { ContentPage } from '@/components/ContentPage'

export default function TermsPage() {
  return (
    <ContentPage>
      <div className="content-hero">
        <h1>Términos de uso</h1>
        <p>Reglas claras para usar InstantDrop de forma segura y respetuosa.</p>
      </div>

      <div className="summary-box">
        InstantDrop facilita transferencias directas entre navegadores. Al usarlo, aceptas estos términos y nuestra política de privacidad.
      </div>

      <section className="section">
        <h2>Uso permitido</h2>
        <p>Usa el servicio únicamente para compartir contenido que tengas derecho a enviar. No lo uses para distribuir malware, material ilegal, contenido que vulnere derechos de terceros ni para intentar interferir con el servicio.</p>
      </section>
      <section className="section">
        <h2>Tu responsabilidad</h2>
        <p>Antes de aceptar una transferencia, verifica que reconoces el dispositivo emisor. Tú decides qué archivos enviar o aceptar y eres responsable del contenido que compartes.</p>
      </section>
      <section className="section">
        <h2>Disponibilidad y límites</h2>
        <p>Las transferencias usan WebRTC y dependen de la red, el navegador y los dispositivos participantes. El servicio se ofrece tal cual, sin garantía de disponibilidad ininterrumpida ni de entrega de cada transferencia.</p>
      </section>
      <section className="section">
        <h2>Cambios y contacto</h2>
        <p>Podemos actualizar estas reglas para mejorar la seguridad o el funcionamiento del servicio. Si tienes dudas, escríbenos a <a href="mailto:instantdropweb@gmail.com">instantdropweb@gmail.com</a>.</p>
      </section>
    </ContentPage>
  )
}
