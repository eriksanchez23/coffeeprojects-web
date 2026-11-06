import { describe, expect, it } from 'vitest'
import { isExistingSiteType } from '@/features/contact/options'
import { toContactRecord } from '@/features/contact/record'
import { contactSchema, formDataToObject, normalizeSiteUrl } from '@/features/contact/schema'

const base = {
  name: 'Ana',
  email: 'ana@example.com',
  privacy: true,
  marketingConsent: false,
  nda: false,
  locale: 'es',
  sourcePath: '/contacto',
}

const issuesOf = (r: ReturnType<typeof contactSchema.safeParse>) =>
  Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path[0], i.message]))

describe('redesign / free review paths', () => {
  it('only redesign and audit ask for an existing website', () => {
    expect(isExistingSiteType('redesign')).toBe(true)
    expect(isExistingSiteType('audit')).toBe(true)
    expect(isExistingSiteType('web')).toBe(false)
  })

  it('requires the current website URL, but not a description', () => {
    expect(issuesOf(contactSchema.safeParse({ ...base, projectType: 'audit', message: '' }))).toEqual({ currentUrl: 'required' })
    const ok = contactSchema.safeParse({ ...base, projectType: 'audit', message: '', currentUrl: 'miweb.es' })
    expect(ok.success).toBe(true)
    expect(ok.data?.currentUrl).toBe('https://miweb.es/')
  })

  it('keeps the 20-character description rule for the other paths', () => {
    expect(issuesOf(contactSchema.safeParse({ ...base, projectType: 'web', message: '' }))).toEqual({ message: 'required' })
    expect(issuesOf(contactSchema.safeParse({ ...base, projectType: 'web', message: 'corto' }))).toEqual({ message: 'tooShort' })
  })

  it('rejects addresses that are not public http(s) websites', () => {
    for (const bad of ['javascript:alert(1)', 'ftp://miweb.es', 'localhost', 'https://user:pass@miweb.es', 'no es una web'])
      expect(issuesOf(contactSchema.safeParse({ ...base, projectType: 'redesign', currentUrl: bad })), bad).toMatchObject({ currentUrl: 'invalidUrl' })
    expect(normalizeSiteUrl('  HTTP://Mi-Web.es/inicio ')).toBe('http://mi-web.es/inicio')
    expect(normalizeSiteUrl('   ')).toBeUndefined()
  })

  it('reads every checked issue from the form and ignores unknown ones', () => {
    const fd = new FormData()
    fd.set('projectType', 'redesign')
    fd.set('currentUrl', 'miweb.es')
    fd.append('websiteIssues', 'slow')
    fd.append('websiteIssues', 'mobile')
    const parsed = contactSchema.safeParse({ ...base, ...formDataToObject(fd) })
    expect(parsed.data?.websiteIssues).toEqual(['slow', 'mobile'])
    expect(contactSchema.safeParse({ ...base, projectType: 'redesign', currentUrl: 'miweb.es', websiteIssues: ['hacked'] }).success).toBe(false)
  })

  it('stores a placeholder message when the visitor left it empty (the column is required)', () => {
    const data = contactSchema.parse({ ...base, projectType: 'audit', message: '', currentUrl: 'miweb.es' })
    const record = toContactRecord({ ...data, ipHash: 'x' }, { marketing: false, attribution: null })
    expect(record.message).toBe('—')
    expect(record.currentUrl).toBe('https://miweb.es/')
  })
})
