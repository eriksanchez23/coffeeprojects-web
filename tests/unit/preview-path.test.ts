import { describe, expect, it } from 'vitest'
import { safePreviewPath } from '@/lib/cms/preview-url'

const origin = 'http://localhost:3000'

describe('safePreviewPath', () => {
  it('keeps same-origin paths with their query', () => {
    expect(safePreviewPath('/servicios/x?y=1', origin)).toBe('/servicios/x?y=1')
    expect(safePreviewPath('/', origin)).toBe('/')
  })
  it('rejects protocol-relative URLs', () => {
    expect(safePreviewPath('//evil.com', origin)).toBeNull()
  })
  it('rejects backslash tricks', () => {
    expect(safePreviewPath('/\\evil.com', origin)).toBeNull()
  })
  it('rejects absolute URLs', () => {
    expect(safePreviewPath('https://evil.com', origin)).toBeNull()
  })
})
