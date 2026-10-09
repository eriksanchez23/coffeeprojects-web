import { createHmac } from 'node:crypto'

const HASH_CONTEXT = 'coffeeprojects:contact:ip:v1'

/** HMAC-SHA256 keyed with the salt over a fixed context + the IP. 64 hex chars; the raw IP is never stored. */
export function hashIp(ip: string, salt: string): string {
  return createHmac('sha256', salt).update(`${HASH_CONTEXT}:${ip}`).digest('hex')
}

/**
 * Client IP from `x-real-ip` only. Behind Cloudflare -> Nginx Proxy Manager, NPM overwrites that header
 * with the real client IP (resolved from CF-Connecting-IP), so it cannot be forged by the visitor.
 * `x-forwarded-for` is never read: its first hop is client-controlled. Null when the header is absent;
 * the caller then skips rate limiting for that request (Turnstile still gates it).
 */
export function clientIp(h: { get(name: string): string | null }): string | null {
  return h.get('x-real-ip')?.trim() || null
}
