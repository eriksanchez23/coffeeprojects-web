import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  ASSIGNED_LIMIT,
  AssignedRequests,
  OPEN_STATUSES,
  assignedCopy,
  assignedListHref,
  relativeAge,
} from '@/components/admin/assigned-requests'

const now = new Date('2026-10-09T12:00:00.000Z')

describe('assigned requests helpers (S20)', () => {
  it('treats new and in-progress as open', () => {
    expect(OPEN_STATUSES).toEqual(['new', 'in-progress'])
  })

  it('links to the contacts list filtered by assignedTo = me and the open statuses', () => {
    expect(decodeURIComponent(assignedListHref(7))).toBe(
      '/admin/collections/contacts?where[or][0][and][0][assignedTo][equals]=7&where[or][0][and][1][status][in][0]=new&where[or][0][and][1][status][in][1]=in-progress',
    )
    expect(assignedListHref(7, '/panel')).toMatch(/^\/panel\/collections\/contacts\?/)
  })

  it('formats the age relative to now, in the admin language', () => {
    expect(relativeAge('2026-10-06T12:00:00.000Z', now, 'es')).toBe('hace 3 días')
    expect(relativeAge('2026-10-09T09:00:00.000Z', now, 'en')).toBe('3 hours ago')
    expect(relativeAge('2026-10-09T11:59:30.000Z', now, 'en')).toBe('now')
  })

  it('is bilingual and pluralised', () => {
    expect(assignedCopy(1, 'es').count).toBe('1 abierta')
    expect(assignedCopy(3, 'en').count).toBe('3 open')
    expect(assignedCopy(0, 'es').empty).toMatch(/No tienes solicitudes/)
    expect(assignedCopy(0, 'en').title).toBe('My open requests')
  })
})

describe('AssignedRequests (sidebar)', () => {
  const docs = [
    { id: 11, name: 'Ana', status: 'new', createdAt: '2026-10-01T10:00:00.000Z' },
    { id: 12, name: 'Luis', status: 'in-progress', createdAt: '2026-10-08T10:00:00.000Z' },
  ]
  const payloadWith = (find: ReturnType<typeof vi.fn>) => ({ find, config: { routes: { admin: '/admin' } } }) as never

  it('renders nothing for anonymous users', async () => {
    const find = vi.fn()
    expect(await AssignedRequests({ payload: payloadWith(find), user: null })).toBeNull()
    expect(find).not.toHaveBeenCalled()
  })

  it('lists my open requests oldest first, with the user access, linking to each', async () => {
    const find = vi.fn().mockResolvedValue({ docs, totalDocs: 2 })
    const user = { id: 5, role: 'editor' } as never
    const html = renderToStaticMarkup((await AssignedRequests({ payload: payloadWith(find), user, i18n: { language: 'es' } }))!)
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'contacts',
        where: { and: [{ assignedTo: { equals: 5 } }, { status: { in: ['new', 'in-progress'] } }] },
        sort: 'createdAt',
        limit: ASSIGNED_LIMIT,
        user,
        overrideAccess: false,
      }),
    )
    expect(html).toContain('Mis solicitudes abiertas')
    expect(html).toContain('2 abiertas')
    expect(html.indexOf('Ana')).toBeLessThan(html.indexOf('Luis'))
    expect(html).toContain('href="/admin/collections/contacts/11"')
    expect(html).toContain('Nueva')
    expect(html).toContain('En curso')
    expect(html).toContain('Ver todas')
  })

  it('shows an empty state instead of breaking when nothing is assigned or the query fails', async () => {
    const user = { id: 5, role: 'editor' } as never
    const empty = renderToStaticMarkup((await AssignedRequests({ payload: payloadWith(vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 })), user, i18n: { language: 'en' } }))!)
    expect(empty).toContain('No requests assigned to you')
    expect(await AssignedRequests({ payload: payloadWith(vi.fn().mockRejectedValue(new Error('db'))), user })).toBeNull()
  })
})
