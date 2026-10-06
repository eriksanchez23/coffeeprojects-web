export type Repo = { name: string; description: string | null; stars: number; language: string | null; url: string }
export type GithubStats = { repos: number; stars: number; top: Repo[]; source: 'live' | 'fallback' }
type RawRepo = { name: string; description: string | null; stargazers_count: number; language: string | null; html_url: string; fork: boolean }

const TWELVE_HOURS = 60 * 60 * 12
const TIMEOUT_MS = 5000

export function summarizeRepos(publicRepos: number, raw: RawRepo[]): GithubStats {
  const own = raw.filter((r) => !r.fork)
  const stars = own.reduce((sum, r) => sum + r.stargazers_count, 0)
  const top = [...own]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 2)
    .map((r) => ({ name: r.name, description: r.description, stars: r.stargazers_count, language: r.language, url: r.html_url }))
  return { repos: publicRepos, stars, top, source: 'live' }
}

function fromFallback(fallback: { repos?: number | null; stars?: number | null }): GithubStats | null {
  const repos = fallback.repos ?? 0
  const stars = fallback.stars ?? 0
  if (repos <= 0 && stars <= 0) return null
  return { repos, stars, top: [], source: 'fallback' }
}

/** Public, unauthenticated reads (optional GITHUB_TOKEN raises the rate limit). Any failure resolves to the CMS fallback. */
export async function getGithubStats(
  username: string | null | undefined,
  fallback: { repos?: number | null; stars?: number | null },
): Promise<GithubStats | null> {
  if (!username) return fromFallback(fallback)
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const init = { headers, signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: TWELVE_HOURS, tags: ['github'] } } as RequestInit
  const user = encodeURIComponent(username)
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${user}`, init),
      fetch(`https://api.github.com/users/${user}/repos?per_page=100&type=owner`, init),
    ])
    if (!userRes.ok || !reposRes.ok) return fromFallback(fallback)
    const profile = (await userRes.json()) as { public_repos: number }
    const repos = (await reposRes.json()) as RawRepo[]
    if (typeof profile.public_repos !== 'number' || !Array.isArray(repos)) return fromFallback(fallback)
    return summarizeRepos(profile.public_repos, repos)
  } catch {
    return fromFallback(fallback)
  }
}

export function visibleStats(stats: GithubStats | null): { key: 'repos' | 'stars'; value: number }[] {
  if (!stats) return []
  return (['repos', 'stars'] as const).filter((k) => stats[k] > 0).map((k) => ({ key: k, value: stats[k] }))
}
