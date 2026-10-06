import { describe, expect, it } from 'vitest'
import { shouldPushSchema } from '@/lib/db/push'

describe('shouldPushSchema', () => {
  it('pushes the dev schema only under `next dev` (NODE_ENV=development)', () => {
    expect(shouldPushSchema('development')).toBe(true)
  })
  it('never pushes for builds, tests, `payload run` scripts (seed) or an unset NODE_ENV', () => {
    for (const env of ['production', 'test', undefined, '']) expect(shouldPushSchema(env), String(env)).toBe(false)
  })
})
