import { isIP } from 'node:net'
import { gzipSync } from 'node:zlib'
import { describe, expect, it, vi } from 'vitest'
import {
  assertPublicUrl,
  isBlockedIp,
  type RawResponse,
  safeFetch,
  SafeFetchError,
  type Transport,
} from '@/features/project-import/fetch-safe'

// No real network: DNS answers come from this table and responses from `routes`.
const dns: Record<string, string[]> = {
  'site.example': ['93.184.216.34'],
  'cdn.example': ['2606:4700::6810:84e5'],
  'evil.example': ['93.184.216.34', '10.0.0.5'],
  'rebind.example': ['169.254.169.254'],
  'mapped.example': ['::ffff:127.0.0.1'],
}
const resolve = vi.fn(async (host: string) => {
  const list = dns[host]
  if (!list) throw Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' })
  return list.map((address) => ({ address, family: isIP(address) }))
})

const body = (text: string | Buffer): AsyncIterable<Uint8Array> => (async function* () {
  yield typeof text === 'string' ? Buffer.from(text) : text
})()

/** A transport that "connects" through the guarded lookup, like http.request does for host names. */
function fakeTransport(routes: Record<string, RawResponse | (() => RawResponse)>): Transport & { calls: URL[] } {
  const calls: URL[] = []
  const transport = (async (url, init) => {
    calls.push(url)
    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (!isIP(host)) {
      await new Promise<void>((ok, fail) => init.lookup(host, { all: true }, (err) => (err ? fail(err) : ok())))
    }
    const route = routes[url.href]
    if (!route) throw new Error(`unexpected request ${url.href}`)
    return typeof route === 'function' ? route() : route
  }) as Transport & { calls: URL[] }
  transport.calls = calls
  return transport
}

const ok = (text: string | Buffer, headers: Record<string, string> = {}): RawResponse => ({ status: 200, headers, body: body(text) })
const redirect = (location: string): RawResponse => ({ status: 302, headers: { location }, body: body('') })
const opts = { timeoutMs: 1_000, maxBytes: 1_000, resolve }

async function codeOf(p: Promise<unknown>) {
  try {
    await p
    return 'resolved'
  } catch (e) {
    return e instanceof SafeFetchError ? e.code : `other: ${(e as Error).message}`
  }
}

describe('isBlockedIp (S23 SSRF guard)', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1',
    '100.100.100.200', '0.0.0.0', '224.0.0.1', '255.255.255.255', '::', '::1', 'fe80::1', 'fe80::1%eth0', 'fc00::1',
    'fd00:ec2::254', 'ff02::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1', '::ffff:a9fe:a9fe',
    '64:ff9b::a00:1', '2002:c0a8:101::1', 'not-an-ip',
  ])('refuses %s', (ip) => expect(isBlockedIp(ip)).toBe(true))

  it.each(['93.184.216.34', '8.8.8.8', '172.32.0.1', '100.128.0.1', '2606:4700::6810:84e5', '::ffff:8.8.8.8'])('allows %s', (ip) =>
    expect(isBlockedIp(ip)).toBe(false),
  )
})

describe('assertPublicUrl', () => {
  it.each(['ftp://site.example/', 'file:///etc/passwd', 'javascript:alert(1)', 'gopher://site.example', 'not a url', 'https://user:pw@site.example/'])(
    'rejects %s as invalid',
    (raw) => expect(() => assertPublicUrl(raw)).toThrow(expect.objectContaining({ code: 'invalidUrl' })),
  )

  it.each(['http://127.0.0.1/', 'http://2130706433/', 'http://0x7f.1/', 'http://[::1]/', 'http://[::ffff:169.254.169.254]/', 'http://10.0.0.1:8080/'])(
    'rejects the private IP literal %s',
    (raw) => expect(() => assertPublicUrl(raw)).toThrow(expect.objectContaining({ code: 'blockedAddress' })),
  )

  it('accepts a public http(s) URL', () => {
    expect(assertPublicUrl('https://site.example/a?b=1').href).toBe('https://site.example/a?b=1')
  })
})

describe('safeFetch', () => {
  it('fetches a public page and returns its body', async () => {
    const transport = fakeTransport({ 'https://site.example/': ok('<html>hi</html>', { 'content-type': 'text/html' }) })
    const res = await safeFetch('https://site.example/', { ...opts, transport })
    expect(res.body.toString()).toBe('<html>hi</html>')
    expect(res.headers['content-type']).toBe('text/html')
  })

  it('refuses a host whose DNS answer contains any private address', async () => {
    const transport = fakeTransport({ 'https://evil.example/': ok('x') })
    expect(await codeOf(safeFetch('https://evil.example/', { ...opts, transport }))).toBe('blockedAddress')
    expect(await codeOf(safeFetch('https://rebind.example/', { ...opts, transport }))).toBe('blockedAddress')
    expect(await codeOf(safeFetch('https://mapped.example/', { ...opts, transport }))).toBe('blockedAddress')
  })

  it('follows redirects manually and re-checks every hop', async () => {
    const transport = fakeTransport({
      'https://site.example/': redirect('/es'),
      'https://site.example/es': redirect('https://cdn.example/final'),
      'https://cdn.example/final': ok('done'),
    })
    const res = await safeFetch('https://site.example/', { ...opts, transport })
    expect(res.body.toString()).toBe('done')
    expect(res.url.href).toBe('https://cdn.example/final')
  })

  it('refuses a redirect to a private IP or host, and to a non-http scheme', async () => {
    const toIp = fakeTransport({ 'https://site.example/': redirect('http://169.254.169.254/latest/meta-data/') })
    expect(await codeOf(safeFetch('https://site.example/', { ...opts, transport: toIp }))).toBe('blockedAddress')
    expect(toIp.calls).toHaveLength(1)

    const toHost = fakeTransport({ 'https://site.example/': redirect('https://rebind.example/'), 'https://rebind.example/': ok('x') })
    expect(await codeOf(safeFetch('https://site.example/', { ...opts, transport: toHost }))).toBe('blockedAddress')

    const toFile = fakeTransport({ 'https://site.example/': redirect('file:///etc/passwd') })
    expect(await codeOf(safeFetch('https://site.example/', { ...opts, transport: toFile }))).toBe('invalidUrl')
  })

  it('stops after 5 redirects', async () => {
    const routes: Record<string, RawResponse | (() => RawResponse)> = {}
    for (let i = 0; i < 7; i++) routes[`https://site.example/${i}`] = () => redirect(`/${i + 1}`)
    const transport = fakeTransport(routes)
    expect(await codeOf(safeFetch('https://site.example/0', { ...opts, transport }))).toBe('tooManyRedirects')
    expect(transport.calls).toHaveLength(6)
  })

  it('drops custom headers when a redirect leaves the origin', async () => {
    const seen: Record<string, string | undefined>[] = []
    const base = fakeTransport({ 'https://site.example/': redirect('https://cdn.example/'), 'https://cdn.example/': ok('x') })
    const transport: Transport = (url, init) => {
      seen.push({ ...init.headers })
      return base(url, init)
    }
    await safeFetch('https://site.example/', { ...opts, transport, headers: { 'x-api-key': 'secret' } })
    expect(seen[0]['x-api-key']).toBe('secret')
    expect(seen[1]['x-api-key']).toBeUndefined()
  })

  it('enforces the size cap while streaming, on the declared length and after decompression', async () => {
    const big = fakeTransport({ 'https://site.example/': ok('x'.repeat(1_001)) })
    expect(await codeOf(safeFetch('https://site.example/', { ...opts, transport: big }))).toBe('tooLarge')

    const declared = fakeTransport({ 'https://site.example/': ok('small', { 'content-length': '5000' }) })
    expect(await codeOf(safeFetch('https://site.example/', { ...opts, transport: declared }))).toBe('tooLarge')

    const bomb = fakeTransport({ 'https://site.example/': ok(gzipSync('x'.repeat(50_000)), { 'content-encoding': 'gzip' }) })
    expect(await codeOf(safeFetch('https://site.example/', { ...opts, transport: bomb }))).toBe('tooLarge')

    const gz = fakeTransport({ 'https://site.example/': ok(gzipSync('hello'), { 'content-encoding': 'gzip' }) })
    expect((await safeFetch('https://site.example/', { ...opts, transport: gz })).body.toString()).toBe('hello')
  })

  it('blocks a host name that resolves to loopback through the real http transport (no request leaves the machine)', async () => {
    const lookups: string[] = []
    const local = async (host: string) => {
      lookups.push(host)
      return [{ address: '127.0.0.1', family: 4 }]
    }
    expect(await codeOf(safeFetch('http://intranet.example:1/', { ...opts, resolve: local }))).toBe('blockedAddress')
    expect(lookups).toEqual(['intranet.example'])
  })

  it('times out', async () => {
    const transport: Transport = (_url, init) =>
      new Promise((_ok, fail) => init.signal.addEventListener('abort', () => fail(Object.assign(new Error('aborted'), { name: 'AbortError' }))))
    expect(await codeOf(safeFetch('https://93.184.216.34/', { ...opts, timeoutMs: 20, transport }))).toBe('timeout')
  })

  it('reports non-2xx answers as httpStatus', async () => {
    const transport = fakeTransport({ 'https://site.example/': { status: 404, headers: {}, body: body('') } })
    const err = await safeFetch('https://site.example/', { ...opts, transport }).catch((e) => e)
    expect(err).toBeInstanceOf(SafeFetchError)
    expect(err).toMatchObject({ code: 'httpStatus', status: 404 })
  })
})
