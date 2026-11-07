import { createHmac } from 'node:crypto'
import { isIPv6 } from 'node:net'

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

/**
 * The address the rate limit counts. One IPv6 subscriber usually gets a whole /64, so counting single IPv6
 * addresses would let one person rotate through billions of them: IPv6 is reduced to its /64 prefix. IPv4 (also
 * IPv4-mapped IPv6) is kept whole; anything unparseable is returned as is.
 */
export function rateLimitKey(ip: string): string {
  const addr = ip.trim().replace(/%.*$/, '')
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(addr)
  if (mapped) return mapped[1]!
  if (!isIPv6(addr)) return addr
  const [head = '', tail = ''] = addr.split('::')
  const left = head ? head.split(':') : []
  const right = addr.includes('::') ? (tail ? tail.split(':') : []) : []
  // An embedded IPv4 tail never reaches the first 64 bits, so it can be dropped before expanding.
  const groups = addr.includes('::') ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right] : left
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(':')}::/64`
}
