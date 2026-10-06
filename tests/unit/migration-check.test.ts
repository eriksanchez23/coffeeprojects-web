import { describe, expect, it } from 'vitest'
import { findMigrationProblems } from '@/lib/db/migration-check'

const expected = ['20261006_135901_initial', '20261006_221153_pricing']

describe('findMigrationProblems', () => {
  it('passes when every migration file is recorded with a real batch', () => {
    expect(findMigrationProblems(expected, expected.map((name) => ({ name, batch: 1 })))).toEqual([])
  })
  it('flags migrations that did not run (e.g. migrate exited at the dev-mode prompt)', () => {
    expect(findMigrationProblems(expected, [{ name: expected[0], batch: 1 }])).toEqual([`Pending migration: ${expected[1]}`])
  })
  it('flags a database that was ever schema-pushed in dev mode (batch -1), even if all migrations are recorded', () => {
    const applied = [{ name: 'dev', batch: -1 }, ...expected.map((name) => ({ name, batch: 2 }))]
    expect(findMigrationProblems(expected, applied)).toEqual([expect.stringContaining('dev-mode schema push')])
  })
  it('accepts batches stored as strings (postgres numeric)', () => {
    expect(findMigrationProblems(expected, expected.map((name) => ({ name, batch: '1' })))).toEqual([])
    expect(findMigrationProblems(expected, [{ name: 'dev', batch: '-1' }])).toHaveLength(3)
  })

  describe('preflight (before migrate)', () => {
    it('allows pending migrations and a brand-new database', () => {
      expect(findMigrationProblems(expected, [], { preflight: true })).toEqual([])
      expect(findMigrationProblems(expected, [{ name: expected[0], batch: 1 }], { preflight: true })).toEqual([])
    })
    it('still stops on a dev-mode push, so migrate never reaches its interactive question', () => {
      expect(findMigrationProblems(expected, [{ name: 'dev', batch: -1 }], { preflight: true })).toEqual([
        expect.stringContaining('dev-mode schema push'),
      ])
    })
  })
})
