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
  it('finds no marker in the approved seed texts', () => {
    expect(hasPendingMarkers(seeded.es.legalNotice)).toBe(false)
    expect(hasPendingMarkers(seeded.fr.cookiePolicy)).toBe(false)
  })
})

describe('legalPagesToIndex', () => {
  const finished = { legalNotice: done, privacyPolicy: done, cookiePolicy: done }
  it('lists a legal page only when every locale has content without markers', () => {
    expect(legalPagesToIndex([finished, finished, finished])).toEqual(['/legal-notice', '/privacy', '/cookies'])
    const pending = lexical([{ p: 'Owner: [PENDING: legal name].' }])
    expect(legalPagesToIndex([finished, { ...finished, privacyPolicy: pending }, finished])).toEqual([
      '/legal-notice',
      '/cookies',
    ])
    expect(legalPagesToIndex([{ ...finished, cookiePolicy: null }])).toEqual(['/legal-notice', '/privacy'])
  })
  it('lists all three with the approved seed texts', () => {
    expect(legalPagesToIndex([seeded.es, seeded.en, seeded.fr])).toEqual(['/legal-notice', '/privacy', '/cookies'])
  })
})
