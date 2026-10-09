import { afterEach, describe, expect, it, vi } from 'vitest'
import { guardLockedDocuments, isLockedDocumentsPath, usesApiKey } from '@/lib/security/locked-documents'

const req = (path: string, headers: Record<string, string> = {}, method = 'GET') =>
  new Request(`https://coffeeprojects.es${path}`, { method, headers })

afterEach(() => vi.restoreAllMocks())

describe('isLockedDocumentsPath', () => {
  it.each([
    '/api/payload-locked-documents',
    '/api/payload-locked-documents/12',
    '/api/payload-locked-documents/',
    '/api//payload-locked-documents',
    '/api/Payload-Locked-Documents',
    '/api/payload%2Dlocked-documents',
  ])('matches %s', (path) => expect(isLockedDocumentsPath(path)).toBe(true))

  it.each(['/api/contacts', '/api/payload-locked-documents-x', '/api/media/file/a.png', '/es/payload-locked-documents'])(
    'does not match %s',
    (path) => expect(isLockedDocumentsPath(path)).toBe(false),
  )
})

describe('usesApiKey', () => {
  it('detects the users API-Key scheme only', () => {
    expect(usesApiKey(new Headers({ authorization: 'users API-Key abc' }))).toBe(true)
    expect(usesApiKey(new Headers({ authorization: 'JWT abc' }))).toBe(false)
    expect(usesApiKey(new Headers())).toBe(false)
  })
})

describe('guardLockedDocuments', () => {
  it.each(['GET', 'POST', 'PATCH', 'DELETE'])('answers 403 to an API-key %s request and logs who/where without the key', async (method) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = guardLockedDocuments(
      req('/api/payload-locked-documents/3', { authorization: 'users API-Key s3cr3t-key', 'x-real-ip': '192.168.1.11', 'user-agent': 'discord-bot/1.0' }, method),
    )
    expect(res?.status).toBe(403)
    expect(warn).toHaveBeenCalledTimes(1)
    const line = String(warn.mock.calls[0]![0])
    expect(JSON.parse(line)).toMatchObject({
      event: 'blocked_integration_locked_documents',
      method,
      path: '/api/payload-locked-documents/3',
      ip: '192.168.1.11',
      userAgent: 'discord-bot/1.0',
    })
    expect(line).not.toContain('s3cr3t-key')
  })

  it('lets cookie/JWT (admin panel) requests through and ignores other paths', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(guardLockedDocuments(req('/api/payload-locked-documents', { cookie: 'payload-token=x' }))).toBeNull()
    expect(guardLockedDocuments(req('/api/contacts', { authorization: 'users API-Key k' }))).toBeNull()
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('proxy wiring', () => {
  it('matches /api so the guard sees API requests, next-intl still skips them', async () => {
    const { config } = await import('@/proxy')
    expect(config.matcher).toContain('/api/:path*')
  })
})
