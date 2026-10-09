import { validations } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import {
  ANONYMIZED,
  anonymizeContacts,
  anonymizedContactData,
  anonymizedEmail,
  isAnonymized,
  isDryRun,
  retentionCutoff,
} from '@/lib/retention/contacts'

// S12: contacts are anonymized 24 months after their last activity (`updatedAt`).

const contact = {
  id: 7,
  status: 'answered',
  assignedTo: 3,
  internalNotes: 'Llamar a Ana al 600 000 000',
  name: 'Ana López',
  email: 'ana@example.com',
  phone: '+34 600 000 000',
  projectType: 'web',
  plan: 'pro',
  quotedSummary: '1.200 € · 4 semanas',
  message: 'Quiero una web',
  howFound: 'Un amigo',
  ndaRequested: false,
  privacyAccepted: true,
  marketingConsent: true,
  locale: 'es',
  sourcePath: '/es/contacto?utm_source=ig',
  utmSource: 'ig',
  utmMedium: 'paid',
  utmCampaign: 'otono',
  utmContent: 'reel',
  utmTerm: 'web',
  fbclid: 'fb.1.abc',
  ipHash: 'deadbeef',
  replies: [
    { id: 'r1', sentAt: '2024-01-02T10:00:00.000Z', author: { id: 3 }, subject: 'Re: tu web', body: 'Hola Ana', channel: 'panel', inboundId: null },
    { id: 'r2', sentAt: '2024-01-03T10:00:00.000Z', author: 3, subject: 'Re: Re', body: 'Gracias Ana', channel: 'email', inboundId: 'msg_1' },
  ],
  createdAt: '2024-01-01T09:00:00.000Z',
  updatedAt: '2024-01-03T10:00:00.000Z',
}

describe('retentionCutoff', () => {
  it('is 24 months before now (UTC)', () => {
    expect(retentionCutoff(new Date('2026-10-09T03:00:00.000Z')).toISOString()).toBe('2024-10-09T03:00:00.000Z')
  })
  it('clamps to the last day of the month instead of rolling over', () => {
    expect(retentionCutoff(new Date('2028-02-29T12:00:00.000Z')).toISOString()).toBe('2026-02-28T12:00:00.000Z')
  })
})

describe('anonymizedContactData', () => {
  const data = anonymizedContactData(contact)

  it('clears personal, free-text and campaign data', () => {
    expect(data).toMatchObject({
      name: ANONYMIZED,
      email: 'anonymized+7@invalid.invalid',
      message: ANONYMIZED,
      phone: null,
      howFound: null,
      internalNotes: null,
      sourcePath: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      fbclid: null,
      ipHash: null,
    })
    expect(JSON.stringify(data)).not.toMatch(/Ana|600 000|"ig"|utm_source|otono|reel|paid|fb\.1|deadbeef|amigo|Re: /)
  })

  it('keeps id, dates, project type, status and the request facts by not touching them', () => {
    for (const key of ['id', 'createdAt', 'updatedAt', 'projectType', 'status', 'plan', 'quotedSummary', 'assignedTo', 'locale', 'privacyAccepted']) {
      expect(data, key).not.toHaveProperty(key)
    }
  })

  it('keeps the reply rows (ids, dates, authors, channel) but clears subject and body', () => {
    expect(data.replies).toEqual([
      { id: 'r1', sentAt: '2024-01-02T10:00:00.000Z', author: 3, subject: ANONYMIZED, body: ANONYMIZED, channel: 'panel', inboundId: null },
      { id: 'r2', sentAt: '2024-01-03T10:00:00.000Z', author: 3, subject: ANONYMIZED, body: ANONYMIZED, channel: 'email', inboundId: 'msg_1' },
    ])
  })

  it('uses placeholders that pass the field validators of required fields', () => {
    const req = { payload: { collections: { contacts: { config: { auth: {} } } }, config: { collections: [] } }, t: (k: string) => k }
    expect(validations.email(data.email, { collectionSlug: 'contacts', req, required: true } as never)).toBe(true)
    expect(validations.text(data.name, { req, required: true } as never)).toBe(true)
    expect(validations.textarea(data.message, { req, required: true } as never)).toBe(true)
  })
})

describe('isAnonymized', () => {
  it('recognises the placeholder email marker', () => {
    expect(isAnonymized({ email: anonymizedEmail(7) })).toBe(true)
    expect(isAnonymized({ email: 'ana@example.com' })).toBe(false)
    expect(isAnonymized({ email: 'anonymized+7@example.com' })).toBe(false)
  })
})

describe('isDryRun', () => {
  it('reads --dry-run (argv) or ANONYMIZE_DRY_RUN=1 (env)', () => {
    expect(isDryRun(['node', 'x', '--dry-run'], {})).toBe(true)
    expect(isDryRun(['node', 'x'], { ANONYMIZE_DRY_RUN: '1' })).toBe(true)
    expect(isDryRun(['node', 'x'], { ANONYMIZE_DRY_RUN: '0' })).toBe(false)
    expect(isDryRun(['node', 'x'], {})).toBe(false)
  })
})

function fakePayload(docs: Record<string, unknown>[]) {
  const sorted = [...docs].sort((a, b) => Number(a.id) - Number(b.id))
  const find = vi.fn(async (args: { where: { and: Record<string, Record<string, unknown>>[] }; limit: number }) => {
    const cutoff = args.where.and.find((w) => 'updatedAt' in w)!.updatedAt!.less_than as string
    const after = (args.where.and.find((w) => 'id' in w)?.id?.greater_than as number | undefined) ?? 0
    const matching = sorted.filter((d) => String(d.updatedAt) < cutoff && Number(d.id) > after)
    return { docs: matching.slice(0, args.limit), hasNextPage: matching.length > args.limit }
  })
  const update = vi.fn(async (_args: unknown) => ({}))
  const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
  return { payload: { find, update, logger }, find, update, logger }
}

describe('anonymizeContacts', () => {
  const now = new Date('2026-10-09T03:00:00.000Z')
  const old = (id: number, email = `c${id}@example.com`) => ({ ...contact, id, email, updatedAt: '2024-10-08T00:00:00.000Z' })
  const recent = (id: number) => ({ ...contact, id, updatedAt: '2024-10-10T00:00:00.000Z' })

  it('anonymizes contacts inactive for 24 months in batches, skipping anonymized and recent ones', async () => {
    const f = fakePayload([old(1), old(2), recent(3), old(4, anonymizedEmail(4)), old(5)])
    const result = await anonymizeContacts(f.payload as never, { now, batchSize: 2 })

    expect(result).toEqual({ cutoff: '2024-10-09T03:00:00.000Z', matched: 4, anonymized: 3, alreadyAnonymized: 1, dryRun: false })
    expect(f.update.mock.calls.map(([a]) => (a as { id: number }).id)).toEqual([1, 2, 5])
    for (const [args] of f.update.mock.calls as unknown as [Record<string, unknown>][]) {
      // Local API without access checks (locked fields), no hooks of interest, nothing returned beyond the id.
      expect(args).toMatchObject({ collection: 'contacts', overrideAccess: true, depth: 0, data: { name: ANONYMIZED } })
      expect(args.context).toMatchObject({ contactRetention: true })
    }
    // Batches: ids > 0, then > 2, then > 5 (empty) — limited by batchSize, sorted by id.
    expect(f.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'contacts', limit: 2, sort: 'id', overrideAccess: true, depth: 0 }))
  })

  it('changes nothing in dry-run mode but reports the same counts', async () => {
    const f = fakePayload([old(1), old(2), old(4, anonymizedEmail(4))])
    const result = await anonymizeContacts(f.payload as never, { now, batchSize: 1, dryRun: true })
    expect(result).toMatchObject({ matched: 3, anonymized: 2, alreadyAnonymized: 1, dryRun: true })
    expect(f.update).not.toHaveBeenCalled()
  })

  it('never logs personal data', async () => {
    const f = fakePayload([old(1)])
    await anonymizeContacts(f.payload as never, { now })
    const logged = JSON.stringify([...f.logger.info.mock.calls, ...f.logger.error.mock.calls, ...f.logger.warn.mock.calls])
    expect(logged).not.toMatch(/example\.com|Ana/)
  })
})
