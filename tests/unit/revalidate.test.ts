import { beforeEach, describe, expect, it, vi } from 'vitest'

const revalidateTag = vi.fn()
vi.mock('next/cache', () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }))

const { MEDIA_DEPENDENT_TAGS, revalidateCollection, revalidateGlobal, revalidateMedia, revalidateMediaDelete } = await import(
  '@/hooks/revalidate'
)

const req = { payload: { logger: { debug: vi.fn(), warn: vi.fn() } } }
const tags = () => revalidateTag.mock.calls.map(([tag]) => tag)
const call = (hook: unknown, doc: unknown, previousDoc?: unknown) =>
  (hook as (a: unknown) => unknown)({ doc, previousDoc, req, collection: {}, global: {}, operation: 'update', context: {} })

beforeEach(() => revalidateTag.mockClear())

describe('revalidateCollection / revalidateGlobal', () => {
  it.each([
    ['publish', { _status: 'published' }, { _status: 'draft' }, ['services']],
    ['save a published doc', { _status: 'published' }, { _status: 'published' }, ['services']],
    ['unpublish (published → draft)', { _status: 'draft' }, { _status: 'published' }, ['services']],
    ['save a draft of a never-published doc', { _status: 'draft' }, { _status: 'draft' }, []],
    ['create a draft', { _status: 'draft' }, undefined, []],
    ['create a draft (empty previousDoc)', { _status: 'draft' }, {}, []],
    ['collection without drafts', { title: 'x' }, undefined, ['services']],
  ])('%s', (_label, doc, previousDoc, expected) => {
    call(revalidateCollection('services'), doc, previousDoc)
    expect(tags()).toEqual(expected)
    revalidateTag.mockClear()
    call(revalidateGlobal('services'), doc, previousDoc)
    expect(tags()).toEqual(expected)
  })
})

describe('media hooks', () => {
  it('revalidate every tag whose reads embed media (depth 1), on change and on delete', () => {
    for (const hook of [revalidateMedia, revalidateMediaDelete]) {
      revalidateTag.mockClear()
      call(hook, { id: 1, filename: 'a.png' })
      expect(tags()).toEqual(MEDIA_DEPENDENT_TAGS)
    }
    expect(MEDIA_DEPENDENT_TAGS).toEqual(
      expect.arrayContaining(['services', 'projects', 'team-members', 'global:home', 'global:pricing', 'global:site-settings']),
    )
  })
})
