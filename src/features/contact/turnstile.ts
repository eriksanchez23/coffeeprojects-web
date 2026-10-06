import 'server-only'
import { env } from '@/lib/env'
import { type SiteverifyResult, isTestSecret, isValidTurnstileResult } from './turnstile-check'

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret || !token) return false
  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: AbortSignal.timeout(5000) })
    const data = (await res.json()) as SiteverifyResult
    return isValidTurnstileResult(data, { siteUrl: env.SITE_URL, isProduction: env.isProduction, testSecret: isTestSecret(secret) })
  } catch {
    return false
  }
}
