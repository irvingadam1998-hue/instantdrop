import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-card card" aria-labelledby="not-found-title">
        <div className="not-found-copy">
          <span className="badge not-found-badge">Error 404</span>
          <p className="not-found-kicker">Parece que este archivo se nos escapó</p>
          <h1 id="not-found-title">Esta ruta no existe.</h1>
          <p>La página que buscas pudo haberse movido o el enlace no es correcto. Vuelve a InstantDrop para seguir compartiendo.</p>
          <Link href="/" className="btn btn-primary not-found-action">
            Volver a InstantDrop
          </Link>
        </div>
        <div className="not-found-mascot-wrap" aria-hidden="true">
          <span className="not-found-orbit not-found-orbit-one" />
          <span className="not-found-orbit not-found-orbit-two" />
          <Image
            src="/instantdrop-mascot-404.png"
            alt=""
            width={800}
            height={800}
            priority
            className="not-found-mascot"
          />
        </div>
      </section>
    </main>
  )
}
