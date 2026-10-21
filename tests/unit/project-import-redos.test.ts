import { describe, expect, it } from 'vitest'
import { detectStack } from '@/features/project-import/detect-stack'
import { parsePageMeta } from '@/features/project-import/parse'

// Hostile pages must not block the event loop: each case once took tens of seconds at 200 KB (quadratic
// backtracking). The bound is generous so a slow CI runner does not flake; the linear code takes a few ms.
const BUDGET_MS = 200
const SIZE = 200_000

function timed(fn: () => unknown): number {
  const start = performance.now()
  fn()
  return performance.now() - start
}

describe('project import parsing stays linear on hostile HTML (S23)', () => {
  it('a <meta> tag with a 200 KB attribute-name run', () => {
    const html = `<head><meta ${'a'.repeat(SIZE)}></head>`
    expect(timed(() => parsePageMeta(html, 'https://x.example/'))).toBeLessThan(BUDGET_MS)
  })

  it('many unclosed <title> tags', () => {
    const html = '<title>'.repeat(SIZE / 7)
    expect(timed(() => parsePageMeta(html, 'https://x.example/'))).toBeLessThan(BUDGET_MS)
  })

  it('a long run of "tailwind" prefixes with no .css', () => {
    const html = 'tailwind'.repeat(SIZE / 8)
    expect(timed(() => detectStack({ html, headers: {} }))).toBeLessThan(BUDGET_MS)
  })

  it('many attribute-like tokens without values inside one tag', () => {
    const html = `<head><meta ${'a-b '.repeat(SIZE / 4)}content="x"></head>`
    expect(timed(() => parsePageMeta(html, 'https://x.example/'))).toBeLessThan(BUDGET_MS)
  })
})
