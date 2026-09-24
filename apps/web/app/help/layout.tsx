import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata(
  '/help',
  'Ayuda para enviar archivos entre dispositivos',
  'Guía de InstantDrop: enviar archivos y texto, usar una sala compartida y solucionar problemas de conexión.'
)

export default function HelpLayout({ children }: { children: ReactNode }) {
  return children
}
