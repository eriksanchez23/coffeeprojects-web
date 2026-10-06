import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
})

export type Env = {
  SITE_URL: string
  SITE_ENV: 'development' | 'staging' | 'production'
  isStaging: boolean
  isProduction: boolean
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = schema.parse(source)
  const SITE_ENV = parsed.NEXT_PUBLIC_SITE_ENV
  return {
    SITE_URL: parsed.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''),
    SITE_ENV,
    isStaging: SITE_ENV === 'staging',
    isProduction: SITE_ENV === 'production',
  }
}

// NEXT_PUBLIC_* must be referenced literally so Next.js inlines them in client bundles.
export const env = parseEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_ENV: process.env.NEXT_PUBLIC_SITE_ENV,
})
