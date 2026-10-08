import type { MetadataRoute } from 'next'
import { IS_PRODUCTION, SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: IS_PRODUCTION
      ? { userAgent: '*', allow: '/', disallow: ['/api/'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
    host: SITE_URL.host,
  }
}
