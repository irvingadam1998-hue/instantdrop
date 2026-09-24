import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata(
  '/privacy',
  'Privacidad y tratamiento de datos',
  'Qué datos procesa InstantDrop, cómo funcionan las transferencias WebRTC y cuánto tiempo se conservan los clips de texto.'
)

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children
}
