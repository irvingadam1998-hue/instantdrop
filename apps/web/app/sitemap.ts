import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/about', '/help', '/privacy'].map((path) => ({
    url: new URL(path || '/', SITE_URL).toString(),
  }))
}
