import { describe, expect, it } from 'vitest'
import { coverGradient, projectPublicUrl } from '@/lib/project-view'

describe('projectPublicUrl', () => {
  it('hides the URL for NDA projects even if one is stored', () => {
    expect(projectPublicUrl({ nda: true, url: 'https://secret.example' })).toBeNull()
  })
  it('returns the URL for public projects', () => {
    expect(projectPublicUrl({ nda: false, url: 'https://coffeeprojects.es' })).toBe('https://coffeeprojects.es')
  })
  it('rejects non-http URLs', () => {
    expect(projectPublicUrl({ nda: false, url: 'javascript:alert(1)' })).toBeNull()
  })
})

describe('coverGradient', () => {
  it('is deterministic per seed', () => {
    expect(coverGradient('abc')).toBe(coverGradient('abc'))
    expect(coverGradient('abc')).not.toBe(coverGradient('xyz'))
  })
  it('always picks a defined hue, even for hashes with the high bit set', () => {
    const seeds = ['trading-journal', 'coffeeprojects-es', ...Array.from({ length: 200 }, (_, i) => `project-${i}`)]
    for (const seed of seeds) expect(coverGradient(seed)).not.toContain('undefined')
  })
})
