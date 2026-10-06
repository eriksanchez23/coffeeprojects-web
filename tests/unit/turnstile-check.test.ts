import { describe, expect, it } from 'vitest'
import { TURNSTILE_ACTION, isTestSecret, isValidTurnstileResult } from '@/features/contact/turnstile-check'

const prod = { siteUrl: 'https://coffeeprojects.es', isProduction: true, testSecret: false }
const dev = { siteUrl: 'http://localhost:3000', isProduction: false, testSecret: false }
const ok = { success: true, hostname: 'coffeeprojects.es', action: TURNSTILE_ACTION }

describe('isValidTurnstileResult', () => {
  it('accepts a successful token solved on the site host for the contact action', () => {
    expect(isValidTurnstileResult(ok, prod)).toBe(true)
    expect(isValidTurnstileResult({ ...ok, hostname: 'www.coffeeprojects.es' }, prod)).toBe(true)
  })
  it('rejects unsuccessful tokens', () => {
    expect(isValidTurnstileResult({ ...ok, success: false }, prod)).toBe(false)
    expect(isValidTurnstileResult({}, prod)).toBe(false)
  })
  it('rejects a token solved on another site (replayed from a page using our sitekey)', () => {
    expect(isValidTurnstileResult({ ...ok, hostname: 'evil.example' }, prod)).toBe(false)
    expect(isValidTurnstileResult({ ...ok, hostname: undefined }, prod)).toBe(false)
  })
  it('allows localhost only outside production', () => {
    expect(isValidTurnstileResult({ ...ok, hostname: 'localhost' }, prod)).toBe(false)
    expect(isValidTurnstileResult({ ...ok, hostname: 'localhost' }, dev)).toBe(true)
    expect(isValidTurnstileResult({ ...ok, hostname: '127.0.0.1' }, dev)).toBe(true)
  })
  it('rejects a token issued for another widget action', () => {
    expect(isValidTurnstileResult({ ...ok, action: 'login' }, prod)).toBe(false)
  })
  it("skips hostname/action with Cloudflare's test secrets (dummy tokens carry no real host/action)", () => {
    expect(isValidTurnstileResult({ success: true, hostname: 'example.com', action: '' }, { ...prod, testSecret: true })).toBe(true)
    expect(isValidTurnstileResult({ success: false }, { ...prod, testSecret: true })).toBe(false)
  })
})

describe('isTestSecret', () => {
  it("recognises Cloudflare's published dummy secrets only", () => {
    expect(isTestSecret('1x0000000000000000000000000000000AA')).toBe(true)
    expect(isTestSecret('2x0000000000000000000000000000000AA')).toBe(true)
    expect(isTestSecret('3x0000000000000000000000000000000AA')).toBe(true)
    expect(isTestSecret('0x4AAAAAAAreal-secret')).toBe(false)
  })
})
