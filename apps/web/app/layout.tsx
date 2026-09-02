import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import { I18nProvider } from '@/lib/i18n'
import './globals.css'

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
  robots: process.env.NODE_ENV === 'production' ? 'index,follow' : 'noindex,nofollow,noarchive',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
