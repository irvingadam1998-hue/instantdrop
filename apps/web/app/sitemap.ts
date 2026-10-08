import type { MetadataRoute } from 'next'
import { IS_PRODUCTION, SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  if (!IS_PRODUCTION) return []
  return ['', '/about', '/help', '/privacy', '/terms'].map((path) => ({
    url: new URL(path || '/', SITE_URL).toString(),
  }))
}
