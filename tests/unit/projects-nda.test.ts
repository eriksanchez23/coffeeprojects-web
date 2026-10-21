import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { clearNdaUrl, ndaUrlReadAccess, Projects } from '@/collections/Projects'

const user = { id: 1, role: 'editor' as const }
const read = (doc: Record<string, unknown> | undefined, withUser = false) =>
  ndaUrlReadAccess({ req: { user: withUser ? user : null }, doc } as never)
const change = (data: Record<string, unknown>, originalDoc?: Record<string, unknown>) =>
  clearNdaUrl({ data, originalDoc, operation: originalDoc ? 'update' : 'create' } as never) as Record<string, unknown>

describe('Projects NDA url', () => {
  it('clears url when a project is saved as NDA', () => {
    expect(change({ nda: true, url: 'https://client.example' }).url).toBeNull()
  })

  it('clears url on a partial update of a project that is already NDA', () => {
    expect(change({ url: 'https://client.example' }, { nda: true }).url).toBeNull()
  })

  it('keeps url for non-NDA projects', () => {
    expect(change({ nda: false, url: 'https://client.example' }).url).toBe('https://client.example')
    expect(change({ nda: false, url: 'https://client.example' }, { nda: true }).url).toBe('https://client.example')
  })

  it('hides url of NDA projects from anonymous readers', () => {
    expect(read({ nda: true, url: 'https://client.example' })).toBe(false)
  })

  it('shows url of NDA projects to the team and of public projects to everyone', () => {
    expect(read({ nda: true }, true)).toBe(true)
    expect(read({ nda: false })).toBe(true)
    expect(read(undefined)).toBe(true)
  })

  it('is wired into the collection config', () => {
    const url = Projects.fields.find((f): f is Field & { name: string } => 'name' in f && f.name === 'url')
    expect((url as { access?: { read?: unknown } }).access?.read).toBe(ndaUrlReadAccess)
    expect(Projects.hooks?.beforeChange).toContain(clearNdaUrl)
  })
})
