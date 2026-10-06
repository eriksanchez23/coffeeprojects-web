import { afterEach, describe, expect, it, vi } from 'vitest'
import { getGithubStats, summarizeRepos, visibleStats } from '@/features/github/stats'

const raw = [
  { name: 'nek_deliveryjob', description: 'Delivery job', stargazers_count: 18, language: 'Lua', html_url: 'https://github.com/x/a', fork: false },
  { name: 'nek_vehicleshop', description: null, stargazers_count: 8, language: 'Lua', html_url: 'https://github.com/x/b', fork: false },
  { name: 'forked', description: null, stargazers_count: 100, language: 'JS', html_url: 'https://github.com/x/c', fork: true },
]

afterEach(() => vi.unstubAllGlobals())

describe('summarizeRepos', () => {
  it('sums stars of own repos and picks top 2 by stars, ignoring forks', () => {
    const s = summarizeRepos(12, raw)
    expect(s.repos).toBe(12)
    expect(s.stars).toBe(26)
    expect(s.top.map((r) => r.name)).toEqual(['nek_deliveryjob', 'nek_vehicleshop'])
    expect(s.source).toBe('live')
  })
})

describe('getGithubStats', () => {
  it('uses the fallback when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('rate limited', { status: 403 })))
    const s = await getGithubStats('someone', { repos: 3, stars: 5 })
    expect(s).toEqual({ repos: 3, stars: 5, top: [], source: 'fallback' })
  })
  it('uses the fallback when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect((await getGithubStats('someone', { repos: 3 }))?.source).toBe('fallback')
  })
  it('uses the fallback when there is no username', async () => {
    expect(await getGithubStats(undefined, { repos: 3 })).toEqual({ repos: 3, stars: 0, top: [], source: 'fallback' })
  })
  it('returns null when there is neither data nor fallback', async () => {
    expect(await getGithubStats(undefined, {})).toBeNull()
  })
  it('returns live stats when the API answers', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) =>
      url.includes('/repos') ? Response.json(raw) : Response.json({ public_repos: 12 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const s = await getGithubStats('someone', { repos: 3 })
    expect(s?.source).toBe('live')
    expect(s?.repos).toBe(12)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('getGithubStats with malformed payloads', () => {
  it('uses the fallback when the user endpoint returns malformed JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) =>
        url.includes('/repos') ? Response.json(raw) : new Response('{not json', { status: 200 }),
      ),
    )
    expect(await getGithubStats('someone', { repos: 3 })).toEqual({ repos: 3, stars: 0, top: [], source: 'fallback' })
  })
  it('uses the fallback when the repos payload is not an array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) =>
        url.includes('/repos') ? Response.json({ message: 'oops' }) : Response.json({ public_repos: 12 }),
      ),
    )
    expect(await getGithubStats('someone', { repos: 3 })).toEqual({ repos: 3, stars: 0, top: [], source: 'fallback' })
  })
})

describe('visibleStats', () => {
  it('never exposes zero values', () => {
    expect(visibleStats({ repos: 3, stars: 0, top: [], source: 'fallback' })).toEqual([{ key: 'repos', value: 3 }])
    expect(visibleStats(null)).toEqual([])
  })
})
