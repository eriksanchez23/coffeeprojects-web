import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  if (!env.isProduction) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] },
    sitemap: `${env.SITE_URL}/sitemap.xml`,
    host: env.SITE_URL,
  }
}
