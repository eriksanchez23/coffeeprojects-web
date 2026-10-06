import { createHmac } from 'node:crypto'

const HASH_CONTEXT = 'coffeeprojects:contact:ip:v1'

/** HMAC-SHA256 keyed with the salt over a fixed context + the IP. 64 hex chars; the raw IP is never stored. */
export function hashIp(ip: string, salt: string): string {
  return createHmac('sha256', salt).update(`${HASH_CONTEXT}:${ip}`).digest('hex')
}

/** `x-real-ip` first, then the first `x-forwarded-for` hop. Null when the platform gives neither. */
export function clientIp(h: { get(name: string): string | null }): string | null {
  const real = h.get('x-real-ip')?.trim()
  if (real) return real
  const first = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return first || null
}
