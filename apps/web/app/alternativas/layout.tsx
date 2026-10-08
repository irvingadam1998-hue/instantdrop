import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata(
  '/alternativas',
  'Alternativas a AirDrop, LocalSend y ShareDrop para compartir archivos',
  'Compara AirDrop, LocalSend, ShareDrop e InstantDrop: descubre qué opción conviene según tus dispositivos, tu red y si quieres instalar una app.'
)

export default function AlternativesLayout({ children }: { children: React.ReactNode }) {
  return children
}
