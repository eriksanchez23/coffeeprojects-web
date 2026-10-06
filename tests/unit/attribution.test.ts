import { describe, expect, it } from 'vitest'
import { attributionCookieString, extractAttribution, mergeAttribution, parseAttributionCookie } from '@/features/tracking/attribution'

describe('attribution', () => {
  it('extracts UTM params and fbclid', () => {
    const a = extractAttribution(new URLSearchParams('utm_source=facebook&utm_campaign=webs-oct&fbclid=ABC&x=1'), 1000)
    expect(a).toEqual({ utmSource: 'facebook', utmCampaign: 'webs-oct', fbclid: 'ABC', fbclidTs: 1000 })
  })
  it('returns null when nothing is present', () => {
    expect(extractAttribution(new URLSearchParams('x=1'), 1)).toBeNull()
  })
  it('caps values at 150 chars', () => {
    const a = extractAttribution(new URLSearchParams(`utm_campaign=${'x'.repeat(300)}`), 1)
    expect(a?.utmCampaign).toHaveLength(150)
  })
  it('drops an oversized fbclid (and its timestamp) instead of truncating it', () => {
    expect(extractAttribution(new URLSearchParams(`fbclid=${'a'.repeat(500)}`), 1)?.fbclid).toHaveLength(500)
    expect(extractAttribution(new URLSearchParams(`utm_source=fb&fbclid=${'a'.repeat(501)}`), 1)).toEqual({ utmSource: 'fb' })
    expect(extractAttribution(new URLSearchParams(`fbclid=${'a'.repeat(501)}`), 1)).toBeNull()
    expect(parseAttributionCookie(JSON.stringify({ utmSource: 's', fbclid: 'a'.repeat(501), fbclidTs: 5 }))).toEqual({ utmSource: 's' })
  })
  it('last non-empty touch wins', () => {
    expect(mergeAttribution({ utmSource: 'a', utmCampaign: 'c1' }, { utmCampaign: 'c2' })).toEqual({ utmSource: 'a', utmCampaign: 'c2' })
  })
  it('round-trips the cookie', () => {
    const a = { utmSource: 'facebook', fbclid: 'X', fbclidTs: 5 }
    const raw = attributionCookieString(a).split(';')[0]!.split('=').slice(1).join('=')
    expect(parseAttributionCookie(raw)).toEqual(a)
    expect(parseAttributionCookie('garbage')).toBeNull()
  })
  it('parses a cookie value that the framework already URL-decoded', () => {
    expect(parseAttributionCookie('{"utmSource":"facebook"}')).toEqual({ utmSource: 'facebook' })
  })
  it('drops unknown keys and wrongly typed or oversized values from an untrusted cookie', () => {
    const raw = JSON.stringify({ utmSource: 'x'.repeat(500), utmMedium: 7, evil: 'y', fbclid: 'F', fbclidTs: 'now' })
    expect(parseAttributionCookie(raw)).toEqual({ utmSource: 'x'.repeat(150), fbclid: 'F' })
    expect(parseAttributionCookie('[1,2]')).toBeNull()
    expect(parseAttributionCookie('{}')).toBeNull()
  })
})
