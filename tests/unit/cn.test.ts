import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/cn'

describe('cn', () => {
  it('merges conflicting tailwind classes, last wins', () => {
    expect(cn('px-2 text-ink-0', 'px-4')).toBe('text-ink-0 px-4')
  })
  it('ignores falsy values', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c')
  })
})
