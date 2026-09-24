import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const production = process.env.NODE_ENV === 'production'
  return {
    rules: production
      ? { userAgent: '*', allow: '/', disallow: ['/api/'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
    host: SITE_URL.host,
  }
}
