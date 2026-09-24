import type { Metadata } from 'next'

export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || 'https://instantdrop.site'
)

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'InstantDrop',
      locale: 'es_PA',
      url: path,
      title,
      description,
      images: ['/logo.png'],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/logo.png'] },
  }
}
