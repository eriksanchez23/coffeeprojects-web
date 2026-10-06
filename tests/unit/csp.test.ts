import { describe, expect, it } from 'vitest'
import { buildCsp } from '@/lib/csp'

const directive = (csp: string, name: string) => csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? ''

describe('buildCsp', () => {
  const csp = buildCsp({ dev: false })
  it('allows only required third parties for scripts', () => {
    const s = directive(csp, 'script-src')
    expect(s).toContain("'self'")
    expect(s).toContain('https://connect.facebook.net')
    expect(s).toContain('https://challenges.cloudflare.com')
    expect(s).not.toContain("'unsafe-eval'")
  })
  it('allows Turnstile frames and forbids being framed', () => {
    expect(directive(csp, 'frame-src')).toContain('https://challenges.cloudflare.com')
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'")
  })
  it('allows Meta and Vercel endpoints for connect', () => {
    const c = directive(csp, 'connect-src')
    expect(c).toContain('https://www.facebook.com')
    expect(c).toContain('https://vitals.vercel-insights.com')
  })
  it('enables eval only in development (React Refresh)', () => {
    expect(directive(buildCsp({ dev: true }), 'script-src')).toContain("'unsafe-eval'")
  })

  // Extensions beyond the brief, from the inputs collected in T07/T12/T14.
  it('allows the Meta Pixel noscript/tracking image and the image hosts the site uses', () => {
    const i = directive(csp, 'img-src')
    for (const host of ['https://www.facebook.com', 'https://*.public.blob.vercel-storage.com', 'https://avatars.githubusercontent.com', 'data:', 'blob:']) {
      expect(i).toContain(host)
    }
    expect(i).not.toMatch(/\s\*(\s|$)/)
  })
  it('loads Vercel Analytics/Speed Insights debug scripts only in development', () => {
    expect(directive(csp, 'script-src')).not.toContain('https://va.vercel-scripts.com')
    expect(directive(csp, 'connect-src')).not.toContain('https://va.vercel-scripts.com')
    expect(directive(buildCsp({ dev: true }), 'script-src')).toContain('https://va.vercel-scripts.com')
  })
  it('keeps websockets and upgrade-insecure-requests environment-specific', () => {
    expect(directive(buildCsp({ dev: true }), 'connect-src')).toContain('ws:')
    expect(directive(csp, 'connect-src')).not.toContain('ws:')
    expect(csp).toContain('upgrade-insecure-requests')
    expect(buildCsp({ dev: true })).not.toContain('upgrade-insecure-requests')
  })
  it('locks down objects, base uri and form targets and has no wildcard script/default source', () => {
    expect(directive(csp, 'object-src')).toBe("object-src 'none'")
    expect(directive(csp, 'base-uri')).toBe("base-uri 'self'")
    expect(directive(csp, 'form-action')).toBe("form-action 'self'")
    expect(directive(csp, 'default-src')).toBe("default-src 'self'")
    expect(directive(csp, 'script-src')).not.toMatch(/\s\*(\s|$)/)
  })
})
