import type { Metadata } from 'next'
import { Onest, DM_Mono } from 'next/font/google'
import { I18nProvider } from '@/lib/i18n'
import { SITE_URL } from '@/lib/seo'
import './globals.css'

// Keep this publisher ID aligned with the AdSense account and public/ads.txt.
const ADSENSE_PUBLISHER_ID = 'ca-pub-7739241937608835'

const dmSans = Onest({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: 'InstantDrop — compartir archivos entre dispositivos',
    template: '%s | InstantDrop',
  },
  description:
    'Envía archivos entre móvil y computadora con InstantDrop. Conecta dispositivos cercanos y transfiere por WebRTC desde el navegador, sin crear una cuenta.',
  applicationName: 'InstantDrop',
  category: 'utilities',
  alternates: { canonical: '/' },
  robots: {
    index: process.env.NODE_ENV === 'production',
    follow: process.env.NODE_ENV === 'production',
    googleBot: { index: process.env.NODE_ENV === 'production', follow: process.env.NODE_ENV === 'production', 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'es_PA',
    siteName: 'InstantDrop',
    url: '/',
    title: 'InstantDrop — compartir archivos entre dispositivos',
    description: 'Envía archivos entre móvil y computadora con una conexión WebRTC desde el navegador.',
    images: ['/logo.png'],
  },
  twitter: { card: 'summary_large_image', images: ['/logo.png'] },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
  referrer: 'strict-origin-when-cross-origin',
  // AdSense supports this meta tag as a site-ownership verification method.
  other: { 'google-adsense-account': ADSENSE_PUBLISHER_ID },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: 'InstantDrop', url: SITE_URL.toString(), inLanguage: 'es' },
    {
      '@type': 'SoftwareApplication',
      name: 'InstantDrop',
      url: SITE_URL.toString(),
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any device with a modern web browser',
      browserRequirements: 'JavaScript and WebRTC support',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: 'Aplicación web gratuita para compartir archivos entre navegadores mediante WebRTC.',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
