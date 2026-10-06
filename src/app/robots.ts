import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

// Parity with the previous site: AI crawlers are explicitly welcome on public pages.
const AI_CRAWLERS = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended']
const PRIVATE_PATHS = ['/admin', '/api', '/next']

export default function robots(): MetadataRoute.Robots {
  if (!env.isProduction) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: ['*', ...AI_CRAWLERS].map((userAgent) => ({ userAgent, allow: '/', disallow: PRIVATE_PATHS })),
    sitemap: `${env.SITE_URL}/sitemap.xml`,
    host: env.SITE_URL,
  }
}
