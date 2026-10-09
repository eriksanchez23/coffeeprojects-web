import type { CollectionConfig, Field, GlobalConfig } from 'payload'
import { sanitizeConfig } from 'payload'
import { describe, expect, it } from 'vitest'
import { Contacts } from '@/collections/Contacts'
import { Faqs } from '@/collections/Faqs'
import { Media } from '@/collections/Media'
import { Projects } from '@/collections/Projects'
import { Services } from '@/collections/Services'
import { TeamMembers } from '@/collections/TeamMembers'
import { Users } from '@/collections/Users'
import { Home } from '@/globals/Home'
import { Legal } from '@/globals/Legal'
import { Partners } from '@/globals/Partners'
import { Pricing } from '@/globals/Pricing'
import { SiteSettings } from '@/globals/SiteSettings'

/**
 * S11: role × operation matrix. `integration` (API-key users: Discord bot, internal panel) may only read
 * contacts, update their status/assignedTo/internalNotes and read users to assign them. Editors and admins
 * keep their previous rights.
 */

type RoleName = 'anonymous' | 'integration' | 'editor' | 'admin'
const users: Record<RoleName, { id: number; role: string; collection: string } | null> = {
  anonymous: null,
  integration: { id: 30, role: 'integration', collection: 'users' },
  editor: { id: 20, role: 'editor', collection: 'users' },
  admin: { id: 10, role: 'admin', collection: 'users' },
}
const roles = Object.keys(users) as RoleName[]
const args = (role: RoleName) => ({ req: { user: users[role] } }) as never

const published = { _status: { equals: 'published' } }
const own = (role: RoleName) => ({ id: { equals: users[role]!.id } })

// Expected result per role, in order: anonymous, integration, editor, admin.
type Row = [unknown, unknown, unknown, unknown]
const T: Row = [true, true, true, true]
const NONE: Row = [false, false, false, false]
const TEAM: Row = [false, false, true, true]
const ADMIN: Row = [false, false, false, true]
const CONTACT_MANAGERS: Row = [false, true, true, true]
const PUBLISHED_OR_TEAM: Row = [published, published, true, true]

const collectionMatrix: [CollectionConfig, Record<string, Row>][] = [
  [Contacts, { create: NONE, read: CONTACT_MANAGERS, update: CONTACT_MANAGERS, delete: ADMIN }],
  [Services, { create: TEAM, read: PUBLISHED_OR_TEAM, readVersions: TEAM, update: TEAM, delete: TEAM }],
  [Projects, { create: TEAM, read: PUBLISHED_OR_TEAM, readVersions: TEAM, update: TEAM, delete: TEAM }],
  [TeamMembers, { create: TEAM, read: PUBLISHED_OR_TEAM, readVersions: TEAM, update: TEAM, delete: TEAM }],
  [Faqs, { create: TEAM, read: T, update: TEAM, delete: TEAM }],
  [Media, { create: TEAM, read: T, update: TEAM, delete: TEAM }],
  [
    Users,
    {
      create: ADMIN,
      read: CONTACT_MANAGERS,
      update: [false, false, own('editor'), true],
      delete: ADMIN,
      unlock: TEAM,
      admin: TEAM,
    },
  ],
]

const globalMatrix: [GlobalConfig, Record<string, Row>][] = [
  [Home, { read: PUBLISHED_OR_TEAM, readVersions: TEAM, update: TEAM }],
  [Pricing, { read: PUBLISHED_OR_TEAM, readVersions: TEAM, update: TEAM }],
  [Partners, { read: PUBLISHED_OR_TEAM, readVersions: TEAM, update: TEAM }],
  [SiteSettings, { read: T, update: TEAM }],
  [Legal, { read: T, update: TEAM }],
]

type AccessFn = (a: never) => unknown

describe.each(collectionMatrix.map(([c, m]) => [c.slug, c, m] as const))('collection %s', (_slug, c, matrix) => {
  it.each(Object.entries(matrix))('%s', async (op, expected) => {
    // Undefined access falls back to Payload's "any logged-in user" default: every operation must be explicit.
    const fn = (c.access as Record<string, AccessFn | undefined>)[op]
    expect(fn, op).toBeTypeOf('function')
    for (const [i, role] of roles.entries()) expect(await fn!(args(role)), `${op} as ${role}`).toEqual(expected[i])
  })
})

describe.each(globalMatrix.map(([g, m]) => [g.slug, g, m] as const))('global %s', (_slug, g, matrix) => {
  it.each(Object.entries(matrix))('%s', async (op, expected) => {
    const fn = (g.access as Record<string, AccessFn | undefined>)[op]
    expect(fn, op).toBeTypeOf('function')
    for (const [i, role] of roles.entries()) expect(await fn!(args(role)), `${op} as ${role}`).toEqual(expected[i])
  })
})

const flatten = (fields: Field[]): Field[] =>
  fields.flatMap((f) => ('fields' in f && Array.isArray(f.fields) ? flatten(f.fields) : [f]))
const named = (fields: Field[]) =>
  Object.fromEntries(flatten(fields).flatMap((f) => ('name' in f ? [[f.name, f]] : []))) as Record<
    string,
    Field & { access?: Record<string, AccessFn | undefined> }
  >

describe('Contacts fields for integration', () => {
  const fields = named(Contacts.fields)
  it('only status, assignedTo and internalNotes are writable (collection update decides who)', async () => {
    const writable = Object.entries(fields)
      .filter(([, f]) => (f as { type?: string }).type !== 'ui')
      .filter(([, f]) => f.access?.update === undefined)
      .map(([name]) => name)
      .sort()
    expect(writable).toEqual(['assignedTo', 'internalNotes', 'status'])
    for (const name of Object.keys(fields).filter((n) => !writable.includes(n) && n !== 'replyAction')) {
      expect(await fields[name]!.access?.update?.(args('integration')), name).toBe(false)
    }
  })
  it('the IP hash stays admin-only', async () => {
    expect(await fields.ipHash!.access?.read?.(args('integration'))).toBe(false)
    expect(await fields.ipHash!.access?.read?.(args('admin'))).toBe(true)
  })
})

describe('Users fields', () => {
  const config = sanitizeConfig({
    secret: 'test-secret',
    collections: [Users],
    admin: { user: 'users' },
    db: { defaultIDType: 'number', init: () => ({}) } as never,
  } as never)

  it('enables Payload API keys on users', () => {
    expect(Users.auth).toMatchObject({ useAPIKey: true })
  })

  it('offers the integration role after the existing ones, default editor', () => {
    const role = named(Users.fields).role as unknown as { options: { value: string }[]; defaultValue: string }
    expect(role.options.map((o) => o.value)).toEqual(['admin', 'editor', 'integration'])
    expect(role.defaultValue).toBe('editor')
  })

  it('role is readable by the team only and writable by admins only', async () => {
    const role = named(Users.fields).role!
    expect(await role.access?.read?.(args('integration'))).toBe(false)
    expect(await role.access?.read?.(args('editor'))).toBe(true)
    for (const op of ['create', 'update'] as const) {
      expect(await role.access?.[op]?.(args('integration')), op).toBe(false)
      expect(await role.access?.[op]?.(args('editor')), op).toBe(false)
      expect(await role.access?.[op]?.(args('admin')), op).toBe(true)
    }
  })

  it('only admins can set, rotate or see the state of API keys (sanitized Payload fields)', async () => {
    const sanitized = (await config).collections.find((c) => c.slug === 'users')!
    const fields = named(sanitized.fields)
    const cases: [string, string][] = [
      ['enableAPIKey', 'create'],
      ['enableAPIKey', 'update'],
      ['enableAPIKey', 'read'],
      ['apiKey', 'create'],
      ['apiKey', 'update'],
      ['apiKeyIndex', 'create'],
      ['apiKeyIndex', 'update'],
      ['hasAPIKey', 'read'],
    ]
    for (const [name, op] of cases) {
      const fn = fields[name]?.access?.[op]
      expect(fn, `${name}.${op}`).toBeTypeOf('function')
      expect(await fn!(args('anonymous')), `${name}.${op} anonymous`).toBe(false)
      expect(await fn!(args('integration')), `${name}.${op} integration`).toBe(false)
      expect(await fn!(args('editor')), `${name}.${op} editor`).toBe(false)
      expect(await fn!(args('admin')), `${name}.${op} admin`).toBe(true)
    }
    // The stored (encrypted) key and its index are never returned by the API.
    expect(await fields.apiKey!.access?.read?.(args('admin'))).toBe(false)
    expect(await fields.apiKeyIndex!.access?.read?.(args('admin'))).toBe(false)
    // Payload's own hooks (encryption, index) survive the access override.
    expect((fields.apiKey as { hooks?: { beforeChange?: unknown[] } }).hooks?.beforeChange).toHaveLength(1)
  })
})
