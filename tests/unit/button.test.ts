import { describe, expect, it } from 'vitest'
import { buttonClasses } from '@/components/ui/button'

describe('buttonClasses', () => {
  it('defaults to primary md', () => {
    const c = buttonClasses({})
    expect(c).toContain('bg-amber')
    expect(c).toContain('h-11')
  })
  it('supports ghost lg', () => {
    const c = buttonClasses({ variant: 'ghost', size: 'lg' })
    expect(c).toContain('bg-transparent')
    expect(c).toContain('h-14')
    expect(c).not.toContain('bg-amber ')
  })
})
