import { describe, expect, it } from 'vitest'
import { needsReprice } from '@/seed/reprice'

describe('needsReprice', () => {
  it('re-prices a service still at a previous price-sheet amount', () => {
    expect(needsReprice('web', { mode: 'one-off', amount: 300 }, { mode: 'one-off', amount: 349 })).toBe(true)
    expect(needsReprice('ecommerce', { mode: 'one-off', amount: 2500 }, { mode: 'one-off', amount: 1490 })).toBe(true)
    expect(needsReprice('maintenance', { mode: 'monthly', amount: 20 }, { mode: 'monthly', amount: 25 })).toBe(true)
  })
  it('leaves alone a price the team changed in the panel', () => {
    expect(needsReprice('web', { mode: 'one-off', amount: 450 }, { mode: 'one-off', amount: 349 })).toBe(false)
    expect(needsReprice('web', { mode: 'custom' }, { mode: 'one-off', amount: 349 })).toBe(false)
  })
  it('is a no-op once the service already has the new price', () => {
    expect(needsReprice('web', { mode: 'one-off', amount: 349 }, { mode: 'one-off', amount: 349 })).toBe(false)
  })
  it('never touches services outside the price sheet or without current pricing', () => {
    expect(needsReprice('fivem-server', { mode: 'one-off', amount: 800 }, { mode: 'one-off', amount: 800 })).toBe(false)
    expect(needsReprice('discord-bot', { mode: 'one-off', amount: 300 }, { mode: 'one-off', amount: 120 })).toBe(false)
    expect(needsReprice('web', null, { mode: 'one-off', amount: 349 })).toBe(false)
  })
})
