import { lookup as dnsLookup } from 'node:dns/promises'
import http from 'node:http'
import https from 'node:https'
import { BlockList, isIP, type LookupFunction } from 'node:net'
import { pipeline, Readable } from 'node:stream'
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib'

/**
 * S23: SSRF-safe GET for user-supplied URLs (the project import fetches whatever URL a team member types).
 * - http(s) only, no credentials in the URL;
 * - every address a host resolves to must be public (no loopback, RFC 1918, link-local, CGNAT, unique-local,
 *   multicast, reserved or metadata ranges; IPv4-mapped / NAT64 / 6to4 IPv6 are checked as the IPv4 they embed).
 *   The check runs inside the socket's `lookup`, so the address we validate is the one we connect to (no DNS
 *   rebinding window); IP literals, which skip `lookup`, are checked up front;
 * - redirects are followed by hand (max 5) and every hop goes through the same checks; custom headers (API keys)
 *   are dropped when a redirect leaves the origin;
 * - one timeout for the whole exchange and a byte cap enforced while streaming, after decompression.
 */

export type SafeFetchErrorCode = 'invalidUrl' | 'blockedAddress' | 'tooManyRedirects' | 'timeout' | 'tooLarge' | 'httpStatus' | 'network'

export class SafeFetchError extends Error {
  constructor(
    readonly code: SafeFetchErrorCode,
    readonly status?: number,
  ) {
    super(`safe fetch: ${code}${status ? ` (${status})` : ''}`)
    this.name = 'SafeFetchError'
  }
}

export const MAX_REDIRECTS = 5

const blocked = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8],
  ['100.64.0.0', 10], // CGNAT (also Alibaba's metadata 100.100.100.200)
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // link-local, cloud metadata 169.254.169.254
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + broadcast
] as const) {
  blocked.addSubnet(net, prefix, 'ipv4')
}
for (const [net, prefix] of [
  ['::', 128], // unspecified
  ['::1', 128],
  ['100::', 64], // discard
  ['2001:db8::', 32], // documentation
  ['fc00::', 7], // unique-local (AWS metadata fd00:ec2::254)
  ['fe80::', 10], // link-local
  ['fec0::', 10], // old site-local
  ['ff00::', 8], // multicast
] as const) {
  blocked.addSubnet(net, prefix, 'ipv6')
}

/** The 8 hextets of an IPv6 address (zone id dropped, a trailing dotted IPv4 folded in), or null. */
function ipv6Groups(ip: string): number[] | null {
  let s = ip.split('%')[0].toLowerCase()
  const dotted = s.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (dotted) {
    const [a, b, c, d] = dotted.slice(1).map(Number)
    s = `${s.slice(0, -dotted[0].length)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const parts = s.split('::')
  if (parts.length > 2) return null
  const head = parts[0] ? parts[0].split(':') : []
  const tail = parts.length === 2 && parts[1] ? parts[1].split(':') : []
  const groups = parts.length === 2 ? [...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail] : head
  return groups.length === 8 ? groups.map((g) => parseInt(g, 16)) : null
}

/** The IPv4 address an IPv6 one carries (mapped ::ffff:a.b.c.d, compatible ::a.b.c.d, NAT64 64:ff9b::/96, 6to4 2002::/16). */
function embeddedIpv4(ip: string): string | null {
  const g = ipv6Groups(ip)
  if (!g) return null
  const v4 = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`
  const zeros = (n: number) => g.slice(0, n).every((x) => x === 0)
  if (zeros(5) && g[5] === 0xffff) return v4(g[6], g[7])
  if (zeros(6) && (g[6] !== 0 || g[7] > 1)) return v4(g[6], g[7])
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return v4(g[6], g[7])
  if (g[0] === 0x2002) return v4(g[1], g[2])
  return null
}

/** True for any address we must not connect to; anything that is not a valid IP counts as blocked. */
export function isBlockedIp(ip: string): boolean {
  const bare = ip.split('%')[0]
  const kind = isIP(bare)
  if (kind === 4) return blocked.check(bare, 'ipv4')
  if (kind !== 6) return true
  const v4 = embeddedIpv4(bare)
  return v4 ? isBlockedIp(v4) : blocked.check(bare, 'ipv6')
}

const bareHost = (url: URL) => url.hostname.replace(/^\[|\]$/g, '')

/** Parses `raw` and refuses non-http(s) schemes, credentials and private IP literals (host names are checked at connect). */
export function assertPublicUrl(raw: string | URL): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new SafeFetchError('invalidUrl')
  }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password || !url.hostname) {
    throw new SafeFetchError('invalidUrl')
  }
  const host = bareHost(url)
  if (isIP(host) && isBlockedIp(host)) throw new SafeFetchError('blockedAddress')
  return url
}

export type Resolver = (hostname: string) => Promise<{ address: string; family: number }[]>
export interface RawResponse {
  status: number
  headers: Record<string, string | undefined>
  body: AsyncIterable<Uint8Array>
}
export type Transport = (url: URL, init: { headers: Record<string, string>; signal: AbortSignal; lookup: LookupFunction }) => Promise<RawResponse>

const systemResolver: Resolver = (hostname) => dnsLookup(hostname, { all: true, verbatim: true })

/** A socket `lookup` that refuses the host when ANY of its addresses is private (a mixed answer is a rebinding smell). */
export function guardedLookup(resolve: Resolver): LookupFunction {
  return (hostname, options, callback) => {
    resolve(hostname).then(
      (all) => {
        const wanted = options.family === 4 || options.family === 6 ? all.filter((a) => a.family === options.family) : all
        if (!all.length || !wanted.length) return callback(new SafeFetchError('network'), '', 0)
        if (all.some((a) => isBlockedIp(a.address))) return callback(new SafeFetchError('blockedAddress'), '', 0)
        if (options.all) return (callback as unknown as (e: null, a: typeof wanted) => void)(null, wanted)
        callback(null, wanted[0].address, wanted[0].family)
      },
      () => callback(new SafeFetchError('network'), '', 0),
    )
  }
}

const flatHeaders = (h: http.IncomingHttpHeaders) =>
  Object.fromEntries(Object.entries(h).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v]))

/** Node's http(s).request: no redirects, no pooled sockets (each request runs its own guarded lookup). */
const nodeTransport: Transport = (url, { headers, signal, lookup }) =>
  new Promise((resolve, reject) => {
    const request = (url.protocol === 'https:' ? https : http).request(url, { method: 'GET', headers, signal, lookup, agent: false }, (res) =>
      resolve({ status: res.statusCode ?? 0, headers: flatHeaders(res.headers), body: res }),
    )
    request.on('error', reject)
    request.end()
  })

const discard = (body: AsyncIterable<Uint8Array>) => (body as { destroy?: () => void }).destroy?.()

async function readCapped(res: RawResponse, maxBytes: number): Promise<Buffer> {
  if (Number(res.headers['content-length'] ?? 0) > maxBytes) {
    discard(res.body)
    throw new SafeFetchError('tooLarge')
  }
  const encoding = (res.headers['content-encoding'] ?? '').trim().toLowerCase()
  const decoder =
    encoding === 'gzip' || encoding === 'x-gzip'
      ? createGunzip()
      : encoding === 'deflate'
        ? createInflate()
        : encoding === 'br'
          ? createBrotliDecompress()
          : null
  if (encoding && encoding !== 'identity' && !decoder) {
    discard(res.body)
    throw new SafeFetchError('network')
  }
  const stream: AsyncIterable<Uint8Array> = decoder ? pipeline(Readable.from(res.body), decoder, () => {}) : res.body
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of stream) {
    total += chunk.length
    if (total > maxBytes) {
      discard(res.body)
      throw new SafeFetchError('tooLarge')
    }
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export interface SafeFetchOptions {
  timeoutMs: number
  maxBytes: number
  headers?: Record<string, string>
  /** Test seams; production uses the system resolver and Node's http(s). */
  resolve?: Resolver
  transport?: Transport
}
export interface SafeResponse {
  url: URL
  status: number
  headers: Record<string, string | undefined>
  body: Buffer
}

const REDIRECTS = new Set([301, 302, 303, 307, 308])
const BASE_HEADERS = { 'user-agent': 'CoffeeProjectsBot/1.0 (+https://coffeeprojects.es)', 'accept-encoding': 'gzip, deflate, br' }

export async function safeFetch(raw: string, opts: SafeFetchOptions): Promise<SafeResponse> {
  const transport = opts.transport ?? nodeTransport
  const lookup = guardedLookup(opts.resolve ?? systemResolver)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs)
  let url = assertPublicUrl(raw)
  const origin = url.origin
  try {
    for (let hop = 0; ; hop++) {
      // Custom headers (an API key) only travel to the origin they were meant for.
      const headers = { ...BASE_HEADERS, ...(url.origin === origin ? opts.headers : {}) }
      const res = await transport(url, { headers, signal: controller.signal, lookup })
      if (REDIRECTS.has(res.status)) {
        discard(res.body)
        if (!res.headers.location) throw new SafeFetchError('httpStatus', res.status)
        if (hop >= MAX_REDIRECTS) throw new SafeFetchError('tooManyRedirects')
        url = assertPublicUrl(new URL(res.headers.location, url))
        continue
      }
      if (res.status < 200 || res.status >= 300) {
        discard(res.body)
        throw new SafeFetchError('httpStatus', res.status)
      }
      return { url, status: res.status, headers: res.headers, body: await readCapped(res, opts.maxBytes) }
    }
  } catch (e) {
    if (controller.signal.aborted) throw new SafeFetchError('timeout')
    if (e instanceof SafeFetchError) throw e
    // http.request wraps lookup errors; keep ours.
    const cause = (e as { cause?: unknown })?.cause
    throw cause instanceof SafeFetchError ? cause : new SafeFetchError('network')
  } finally {
    clearTimeout(timer)
  }
}
