import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { MAX_UPLOAD_BYTES } from '@/lib/security/upload'
import { guardUploadSize } from '@/lib/security/upload-guard'

const req = (path: string, method: string, length: number) =>
  new NextRequest(`http://localhost${path}`, { method, headers: { 'content-length': String(length) } })

describe('guardUploadSize', () => {
  it('answers oversized media uploads with a readable 413 before Payload parses them', async () => {
    const res = guardUploadSize(req('/api/media', 'POST', MAX_UPLOAD_BYTES * 2))
    expect(res?.status).toBe(413)
    expect((await res!.json()).errors[0].message).toMatch(/10 MB/)
    expect(guardUploadSize(req('/api/media/12', 'PATCH', MAX_UPLOAD_BYTES * 2))?.status).toBe(413)
  })

  it('lets normal uploads and every other API call through', () => {
    expect(guardUploadSize(req('/api/media', 'POST', 2 * 1024 * 1024))).toBeNull()
    expect(guardUploadSize(req('/api/contacts', 'POST', MAX_UPLOAD_BYTES * 2))).toBeNull()
    expect(guardUploadSize(req('/api/media', 'GET', MAX_UPLOAD_BYTES * 2))).toBeNull()
  })
})
