import { describe, expect, it } from 'vitest'
import { toContactRecord } from '@/features/contact/record'
import type { ContactInput } from '@/features/contact/schema'

const input = {
  name: 'Ana',
  email: 'ana@example.com',
  projectType: 'web',
  message: 'A long enough project description.',
  nda: true,
  privacy: true,
  marketingConsent: true, // what the (forgeable) form field said
  locale: 'es',
  sourcePath: '/contacto',
  ipHash: 'h',
} as ContactInput & { ipHash: string }

describe('toContactRecord', () => {
  it('stores the consent read from the cookie on the server, never the form field', () => {
    expect(toContactRecord(input, { marketing: false, attribution: null }).marketingConsent).toBe(false)
    expect(toContactRecord({ ...input, marketingConsent: false }, { marketing: true, attribution: null }).marketingConsent).toBe(true)
  })
  it('maps the form checkboxes, sets status new and keeps the ip hash', () => {
    const record = toContactRecord(input, { marketing: false, attribution: null })
    expect(record).toMatchObject({ privacyAccepted: true, ndaRequested: true, status: 'new', ipHash: 'h', email: 'ana@example.com' })
    expect(record).not.toHaveProperty('privacy')
    expect(record).not.toHaveProperty('nda')
  })
  it('adds campaign attribution only when given', () => {
    expect(toContactRecord(input, { marketing: true, attribution: { utmSource: 'meta', fbclid: 'x' } })).toMatchObject({
      utmSource: 'meta',
      fbclid: 'x',
    })
    expect(toContactRecord(input, { marketing: false, attribution: null })).not.toHaveProperty('utmSource')
  })
})
