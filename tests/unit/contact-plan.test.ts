import { describe, expect, it } from 'vitest'
import { resolvePlan } from '@/features/contact/plan'

const known = ['basico', 'estandar', 'profesional']

describe('resolvePlan', () => {
  it('keeps a slug that exists in the pricing global', () => {
    expect(resolvePlan('estandar', known)).toBe('estandar')
    expect(resolvePlan('  basico ', known)).toBe('basico')
  })
  it('drops unknown, malformed or non-string values', () => {
    expect(resolvePlan('premium', known)).toBeUndefined()
    expect(resolvePlan('Basico', known)).toBeUndefined()
    expect(resolvePlan('basico<script>', known)).toBeUndefined()
    expect(resolvePlan('', known)).toBeUndefined()
    expect(resolvePlan(undefined, known)).toBeUndefined()
    expect(resolvePlan(['basico'], known)).toBeUndefined()
    expect(resolvePlan('a'.repeat(41), [...known, 'a'.repeat(41)])).toBeUndefined()
  })
  it('drops everything when no packages are published', () => {
    expect(resolvePlan('basico', [])).toBeUndefined()
  })
})
