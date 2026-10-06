import { describe, expect, it } from 'vitest'
import { hasPendingMarkers, legalPagesToIndex } from '@/lib/legal'
import { lexical } from '@/seed/lexical'
import { legal as seeded } from '@/seed/data/legal'

const done = lexical([{ h2: 'Datos' }, { p: 'Titular: Coffee Projects S.L. NIF: B12345678.' }])

describe('hasPendingMarkers', () => {
  it.each([
    ['es', 'Titular: [PENDIENTE: razón social].'],
    ['en', 'Owner: [PENDING: legal name].'],
    ['fr', 'Éditeur : [EN ATTENTE : raison sociale].'],
  ])('finds the %s marker in the rendered text', (_l, text) => {
    expect(hasPendingMarkers(lexical([{ p: text }]))).toBe(true)
  })
  it('is false for finished text, and for missing content', () => {
    expect(hasPendingMarkers(done)).toBe(false)
    expect(hasPendingMarkers(null)).toBe(false)
  })
  it('flags the current seed texts (company data still pending)', () => {
    expect(hasPendingMarkers(seeded.es.legalNotice)).toBe(true)
    expect(hasPendingMarkers(seeded.fr.cookiePolicy)).toBe(true)
  })
})

describe('legalPagesToIndex', () => {
  const finished = { legalNotice: done, privacyPolicy: done, cookiePolicy: done }
  it('lists a legal page only when every locale has content without markers', () => {
    expect(legalPagesToIndex([finished, finished, finished])).toEqual(['/legal-notice', '/privacy', '/cookies'])
    expect(legalPagesToIndex([finished, { ...finished, privacyPolicy: seeded.en.privacyPolicy }, finished])).toEqual([
      '/legal-notice',
      '/cookies',
    ])
    expect(legalPagesToIndex([{ ...finished, cookiePolicy: null }])).toEqual(['/legal-notice', '/privacy'])
  })
  it('lists none with the seeded drafts', () => {
    expect(legalPagesToIndex([seeded.es, seeded.en, seeded.fr])).toEqual([])
  })
})
