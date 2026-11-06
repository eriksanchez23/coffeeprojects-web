import { describe, expect, it } from 'vitest'
import { resolveDatabaseUrl } from '@/lib/db/database-url'

const url = 'postgres://user:secret@ep-x.eu-central-1.aws.neon.tech/neondb?sslmode=require'

describe('resolveDatabaseUrl', () => {
  it('returns the URL untouched without an override', () => {
    expect(resolveDatabaseUrl(url, { name: undefined, siteEnv: 'staging' })).toBe(url)
  })
  it('swaps only the database name for previews', () => {
    expect(resolveDatabaseUrl(url, { name: 'cp_preview', siteEnv: 'staging' })).toBe(
      'postgres://user:secret@ep-x.eu-central-1.aws.neon.tech/cp_preview?sslmode=require',
    )
  })
  it('never applies in production', () => {
    expect(resolveDatabaseUrl(url, { name: 'cp_preview', siteEnv: 'production' })).toBe(url)
  })
  it('rejects names that could inject SQL or paths', () => {
    expect(() => resolveDatabaseUrl(url, { name: 'x"; DROP', siteEnv: 'staging' })).toThrow()
    expect(() => resolveDatabaseUrl(url, { name: '../other', siteEnv: 'staging' })).toThrow()
  })
})
