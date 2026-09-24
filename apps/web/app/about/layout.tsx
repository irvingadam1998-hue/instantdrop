import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata(
  '/about',
  'Acerca de InstantDrop',
  'Conoce cómo InstantDrop detecta dispositivos cercanos y transfiere archivos entre navegadores con WebRTC.'
)

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children
}
