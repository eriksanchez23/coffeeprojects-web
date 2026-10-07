import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { InboxBanner, inboxCopy, inboxHref } from '@/components/admin/inbox-banner'
import { StatusCell, statusColors } from '@/components/admin/status-cell'
import { contactStatuses } from '@/features/contact/options'

describe('inbox banner', () => {
  it('pluralises the copy and supports Spanish', () => {
    expect(inboxCopy(1, 'en').title).toBe('1 new contact request')
    expect(inboxCopy(3, 'en').title).toBe('3 new contact requests')
    expect(inboxCopy(1).title).toBe('1 nueva solicitud de contacto')
    expect(inboxCopy(1, 'es').title).toBe('1 nueva solicitud de contacto')
    expect(inboxCopy(2, 'es').title).toBe('2 nuevas solicitudes de contacto')
  })

  it('links to the contacts list filtered by new', () => {
    expect(inboxHref()).toBe('/admin/collections/contacts?where[status][equals]=new')
    expect(inboxHref('/panel')).toBe('/panel/collections/contacts?where[status][equals]=new')
  })

  it('counts with the logged-in user access and never for anonymous users', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 2 })
    const payload = { count, config: { routes: { admin: '/admin' } } } as never
    expect(await InboxBanner({ payload, user: null })).toBeNull()
    expect(count).not.toHaveBeenCalled()

    const user = { id: 1, role: 'editor' } as never
    await InboxBanner({ payload, user })
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'contacts', user, overrideAccess: false }))
  })

  it('has a status colour for every contact status', () => {
    for (const status of contactStatuses) expect(statusColors[status]).toMatch(/^#/)
  })
})

describe('status cell', () => {
  it('falls back to new for empty and to neutral for unknown statuses', () => {
    expect(renderToStaticMarkup(createElement(StatusCell, { cellData: '' }))).toContain('data-status="new"')
    expect(renderToStaticMarkup(createElement(StatusCell, {}))).toContain('>Nueva<')
    expect(renderToStaticMarkup(createElement(StatusCell, { i18n: { language: 'en' } }))).toContain('>New<')
    const unknown = renderToStaticMarkup(createElement(StatusCell, { cellData: 'weird' }))
    expect(unknown).toContain('>weird<')
    expect(unknown).toContain('background:#a89584')
  })

  it('uses light text on the archived badge', () => {
    expect(renderToStaticMarkup(createElement(StatusCell, { cellData: 'archived' }))).toContain('color:#fff7e8')
  })
})
