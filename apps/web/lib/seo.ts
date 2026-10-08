import type { Metadata } from 'next'

export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || 'https://instantdrop.site'
)

// A production Next build is also used by preview hosts. Indexing therefore
// requires an explicit public environment flag, rather than NODE_ENV alone.
export const IS_PRODUCTION = ['production', 'prod'].includes(
  (
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.NEXT_PUBLIC_ENVIRONMENT ||
    process.env.APP_ENV ||
    process.env.ENVIRONMENT ||
    ''
  ).toLowerCase()
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
      images: ['/logo-instantdrop-v5.png'],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/logo-instantdrop-v5.png'] },
  }
}
