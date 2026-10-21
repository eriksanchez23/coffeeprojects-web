import { describe, expect, it } from 'vitest'
import { Projects } from '@/collections/Projects'
import { TeamMembers } from '@/collections/TeamMembers'
import { SiteSettings } from '@/globals/SiteSettings'
import { MAX_UPLOAD_BYTES } from '@/lib/security/upload'
import { isSafeUrl, safeUrlValidator } from '@/lib/security/url'

const req = { payload: { config: {} }, t: (k: string) => k }
const opts = (extra: Record<string, unknown> = {}) => ({ req, siblingData: {}, ...extra }) as never

describe('isSafeUrl', () => {
  it('accepts absolute http(s) URLs', () => {
    expect(isSafeUrl('https://coffeeprojects.es/x?y=1')).toBe(true)
    expect(isSafeUrl('http://example.com')).toBe(true)
  })

  it('rejects script, data and relative/protocol-relative URLs', () => {
    for (const bad of ['javascript:alert(1)', 'JAVASCRIPT:alert(1)', 'data:text/html,x', '//evil.example', '/admin', 'example.com', 'https://', 'https://exa mple.com']) {
      expect(isSafeUrl(bad), bad).toBe(false)
    }
  })

  it('accepts mailto only when allowed', () => {
    expect(isSafeUrl('mailto:contact@coffeeprojects.es')).toBe(false)
    expect(isSafeUrl('mailto:contact@coffeeprojects.es', { allowMailto: true })).toBe(true)
    expect(isSafeUrl('mailto:javascript:alert(1)', { allowMailto: true })).toBe(false)
  })
})

describe('safeUrlValidator', () => {
  it('rejects an unsafe value with a message and keeps the built-in required check', () => {
    const validate = safeUrlValidator()
    expect(validate('javascript:alert(1)', opts())).toEqual(expect.any(String))
    expect(validate('https://ok.example', opts())).toBe(true)
    expect(validate(undefined, opts())).toBe(true)
    expect(validate(undefined, opts({ required: true }))).not.toBe(true)
  })

  it('lets the team "email" social keep its mailto: link', () => {
    const validate = safeUrlValidator({ allowMailto: (s) => s?.network === 'email' })
    expect(validate('mailto:contact@coffeeprojects.es', opts({ siblingData: { network: 'email' } }))).toBe(true)
    expect(validate('mailto:contact@coffeeprojects.es', opts({ siblingData: { network: 'github' } }))).not.toBe(true)
  })
})

const findField = (fields: unknown[], name: string): { validate?: unknown; fields?: unknown[] } | undefined =>
  (fields as { name?: string }[]).find((f) => f.name === name) as never

describe('CMS URL fields are validated', () => {
  it('wires the validator into projects, team socials and site settings', () => {
    expect(findField(Projects.fields, 'url')?.validate).toEqual(expect.any(Function))
    expect(findField(findField(TeamMembers.fields, 'socials')!.fields!, 'url')?.validate).toEqual(expect.any(Function))
    expect(findField(SiteSettings.fields, 'chatUrl')?.validate).toEqual(expect.any(Function))
    expect(findField(findField(SiteSettings.fields, 'socials')!.fields!, 'url')?.validate).toEqual(expect.any(Function))
  })
})

describe('upload size limit', () => {
  it('is 10 MB', () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024)
  })
})
