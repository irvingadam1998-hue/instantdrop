import type { Metadata } from 'next'
import Script from 'next/script'
import { Onest, DM_Mono } from 'next/font/google'
import { I18nProvider } from '@/lib/i18n'
import { IS_PRODUCTION, SITE_URL } from '@/lib/seo'
import './globals.css'

// Keep this publisher ID aligned with the AdSense account and public/ads.txt.
const ADSENSE_PUBLISHER_ID = 'ca-pub-7739241937608835'
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
const analyticsEnabled = IS_PRODUCTION && /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID)

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
    index: IS_PRODUCTION,
    follow: IS_PRODUCTION,
    googleBot: { index: IS_PRODUCTION, follow: IS_PRODUCTION, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'es_PA',
    siteName: 'InstantDrop',
    url: '/',
    title: 'InstantDrop — compartir archivos entre dispositivos',
    description: 'Envía archivos entre móvil y computadora con una conexión WebRTC desde el navegador.',
    images: ['/logo-instantdrop-v5.png'],
  },
  twitter: { card: 'summary_large_image', images: ['/logo-instantdrop-v5.png'] },
  icons: {
    icon: [{ url: '/logo-instantdrop-v5.png', type: 'image/png' }],
    shortcut: '/logo-instantdrop-v5.png',
  },
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
    <html lang="es" data-theme="instantdrop" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        {analyticsEnabled && <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_MEASUREMENT_ID}');`}
          </Script>
        </>}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
