import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata(
  '/terms',
  'Términos de uso',
  'Reglas de uso de InstantDrop para compartir archivos y texto entre dispositivos cercanos.'
)

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children
}
