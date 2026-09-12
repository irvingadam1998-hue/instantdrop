import type { Metadata } from 'next'
import Script from 'next/script'
import { DM_Sans, DM_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { I18nProvider } from '@/lib/i18n'
import './globals.css'

// Same publisher ID that's declared in public/ads.txt. Keeping both in sync
// matters: AdSense's "Misrepresentative content" review flags ads.txt entries
// that don't correspond to an actual, verifiable ad implementation on the
// live site — which was the case here (ads.txt existed, but no adsbygoogle
// script or verification tag was ever present on the deployed page).
const ADSENSE_PUBLISHER_ID = 'ca-pub-7739241937608835'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
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
  title: 'InstantDrop — Compartir archivos por WiFi sin instalación',
  description:
    'Comparte archivos y texto entre cualquier dispositivo en la misma red WiFi. Sin cuentas, sin cables, sin nube.',
  robots:
    process.env.NODE_ENV === 'production'
      ? 'index,follow'
      : 'noindex,nofollow,noarchive',
  // Google's preferred, crawler-visible way to confirm this site belongs to
  // the AdSense account in ads.txt — doesn't depend on JS executing at all.
  other: { 'google-adsense-account': ADSENSE_PUBLISHER_ID },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <I18nProvider>{children}</I18nProvider>
        <Analytics />
        <SpeedInsights />
        {process.env.NODE_ENV === 'production' && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
