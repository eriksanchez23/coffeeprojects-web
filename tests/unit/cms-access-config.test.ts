import type { CollectionConfig, Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { isAdminOrSelf, nobody, publishedOrTeam } from '@/access'
import { Contacts } from '@/collections/Contacts'
import { Projects } from '@/collections/Projects'
import { Services } from '@/collections/Services'
import { TeamMembers } from '@/collections/TeamMembers'
import { Users } from '@/collections/Users'
import { Home } from '@/globals/Home'

const args = (user?: { id: number; role: 'admin' | 'editor' }) => ({ req: { user } }) as never
const editor = { id: 2, role: 'editor' as const }
const admin = { id: 1, role: 'admin' as const }

const flatten = (fields: Field[]): Field[] =>
  fields.flatMap((f) => ('fields' in f && Array.isArray(f.fields) ? flatten(f.fields) : [f]))

const named = (fields: Field[]) =>
  Object.fromEntries(flatten(fields).flatMap((f) => ('name' in f ? [[f.name, f]] : [])))

describe('Contacts access config', () => {
  it('create is nobody', () => {
    expect(Contacts.access?.create).toBe(nobody)
  })
  it('read and update deny anonymous', async () => {
    expect(await Contacts.access?.read?.(args())).toBe(false)
    expect(await Contacts.access?.update?.(args())).toBe(false)
  })
  it('only status, assignedTo and internalNotes are updatable', async () => {
    const editable = ['status', 'assignedTo', 'internalNotes']
    for (const [name, field] of Object.entries(named(Contacts.fields))) {
      // `ui` fields (the "Responder" box) store no data.
      if ((field as { type?: string }).type === 'ui') continue
      const update = (field as { access?: { update?: (a: never) => unknown } }).access?.update
      if (editable.includes(name)) expect(update, name).toBeUndefined()
      else expect(await update?.(args(admin)), name).toBe(false)
    }
  })
})

describe('Users access config', () => {
  const update = Users.access!.update!
  it('editor may only update self', async () => {
    expect(await update(args(editor))).toEqual({ id: { equals: 2 } })
  })
  it('admin may update anyone, anonymous nobody', async () => {
    expect(await update(args(admin))).toBe(true)
    expect(await update(args())).toBe(false)
  })
  it('uses isAdminOrSelf', () => {
    expect(update).toBe(isAdminOrSelf)
  })
})

describe('versioned content', () => {
  const versioned: CollectionConfig[] = [Projects, Services, TeamMembers]
  it.each(versioned.map((c) => [c.slug, c] as const))('%s read is publishedOrTeam', (_slug, c) => {
    expect(c.versions).toBeTruthy()
    expect(c.access?.read).toBe(publishedOrTeam)
    expect(c.access?.readVersions).toBeDefined()
  })
  it('Home reads and versions are not public', async () => {
    expect(Home.access?.read).toBe(publishedOrTeam)
    expect(await Home.access?.readVersions?.(args())).toBe(false)
  })
})
