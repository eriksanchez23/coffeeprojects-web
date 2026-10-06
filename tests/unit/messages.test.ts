import { describe, expect, it } from 'vitest'
import en from '../../messages/en.json'
import es from '../../messages/es.json'
import fr from '../../messages/fr.json'

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

describe('messages', () => {
  const esKeys = keys(es).sort()
  it('EN has exactly the ES keys', () => expect(keys(en).sort()).toEqual(esKeys))
  it('FR has exactly the ES keys', () => expect(keys(fr).sort()).toEqual(esKeys))
  it('no empty strings', () => {
    for (const dict of [es, en, fr]) {
      const flat = JSON.stringify(dict)
      expect(flat).not.toContain('""')
    }
  })
})
