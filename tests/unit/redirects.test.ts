import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { legacyRedirects } from '@/lib/http-headers'

describe('legacy redirects', () => {
  it('301-redirects the old site legal URLs', () => {
    expect(legacyRedirects).toEqual([
      { source: '/legal', destination: '/aviso-legal', statusCode: 301 },
      { source: '/en/legal', destination: '/en/legal-notice', statusCode: 301 },
      { source: '/presupuestos', destination: '/precios', statusCode: 301 },
      { source: '/gana-dinero', destination: '/colaboradores', statusCode: 301 },
      { source: '/en/earn-with-us', destination: '/en/partners', statusCode: 301 },
      { source: '/fr/gagnez-avec-nous', destination: '/fr/partenaires', statusCode: 301 },
    ])
  })
  // next.config.ts cannot be imported in unit tests (Payload/SWC native bindings), so assert the wiring textually.
  it('is wired into next.config redirects()', () => {
    const cfg = readFileSync('next.config.ts', 'utf8')
    expect(cfg).toMatch(/async redirects\(\)\s*\{\s*return legacyRedirects\s*\}/)
  })
})
