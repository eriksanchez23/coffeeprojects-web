import { describe, expect, it } from 'vitest'
import { shouldWrite } from '@/seed/upsert'

describe('shouldWrite', () => {
  it('writes when nothing exists', () => {
    expect(shouldWrite(false, false)).toBe(true)
  })
  it('skips existing content by default', () => {
    expect(shouldWrite(true, false)).toBe(false)
  })
  it('overwrites existing content when SEED_OVERWRITE is set', () => {
    expect(shouldWrite(true, true)).toBe(true)
  })
})
