import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { Contacts } from '@/collections/Contacts'
import { changedFieldNames, logIntegrationAction } from '@/lib/security/integration-audit'

const integration = { id: 21, email: 'bot@coffeeprojects.es', collection: 'users', role: 'integration' }
const editor = { id: 3, email: 'erik@coffeeprojects.es', collection: 'users', role: 'editor' }

const reqFor = (user: unknown) => {
  const info = vi.fn()
  return { req: { user, payload: { logger: { info } } } as unknown as PayloadRequest, info }
}

describe('changedFieldNames', () => {
  it('lists only names of top-level fields whose value changed (never values), ignoring timestamps', () => {
    const before = { id: 1, status: 'new', internalNotes: 'a', assignedTo: 3, replies: [{ body: 'x' }], updatedAt: 'a' }
    const after = { id: 1, status: 'answered', internalNotes: 'a', assignedTo: 4, replies: [{ body: 'x' }, { body: 'y' }], updatedAt: 'b' }
    expect(changedFieldNames(before, after).sort()).toEqual(['assignedTo', 'replies', 'status'])
  })
  it('treats a missing previous doc as no known baseline: every present field except system ones', () => {
    expect(changedFieldNames(undefined, { id: 1, status: 'new', createdAt: 'x', updatedAt: 'y' })).toEqual(['status'])
  })
})

describe('logIntegrationAction', () => {
  it('writes one structured line for an integration user: event, user id/email, operation, contact id, field names only', () => {
    const { req, info } = reqFor(integration)
    logIntegrationAction(req, { event: 'contact_changed', operation: 'update', contactId: 7, fields: ['status'] })
    expect(info).toHaveBeenCalledTimes(1)
    expect(info.mock.calls[0]![0]).toEqual({
      event: 'integration_contact_changed',
      userId: 21,
      userEmail: 'bot@coffeeprojects.es',
      operation: 'update',
      contactId: 7,
      fields: ['status'],
    })
  })
  it('logs nothing for team users or anonymous requests', () => {
    for (const user of [editor, null, undefined]) {
      const { req, info } = reqFor(user)
      logIntegrationAction(req, { event: 'contact_changed', operation: 'update', contactId: 7, fields: ['status'] })
      expect(info).not.toHaveBeenCalled()
    }
  })
})

describe('Contacts afterChange audit hook', () => {
  const hook = Contacts.hooks?.afterChange?.[0]

  it('is registered', () => expect(hook).toBeTypeOf('function'))

  it('logs integration changes with changed field names and returns the doc untouched (no side effects)', async () => {
    const { req, info } = reqFor(integration)
    const doc = { id: 7, status: 'answered', message: 'private text', email: 'c@example.com' }
    const previousDoc = { id: 7, status: 'new', message: 'private text', email: 'c@example.com' }
    const out = await hook!({ doc, previousDoc, operation: 'update', req, collection: Contacts, context: {} } as never)
    expect(out).toBe(doc)
    expect(info).toHaveBeenCalledTimes(1)
    const entry = info.mock.calls[0]![0]
    expect(entry).toMatchObject({ event: 'integration_contact_changed', userId: 21, operation: 'update', contactId: 7, fields: ['status'] })
    expect(JSON.stringify(entry)).not.toContain('private text')
    expect(JSON.stringify(entry)).not.toContain('c@example.com')
  })

  it('stays silent for team users', async () => {
    const { req, info } = reqFor(editor)
    await hook!({ doc: { id: 7, status: 'a' }, previousDoc: { id: 7, status: 'b' }, operation: 'update', req, collection: Contacts, context: {} } as never)
    expect(info).not.toHaveBeenCalled()
  })
})
