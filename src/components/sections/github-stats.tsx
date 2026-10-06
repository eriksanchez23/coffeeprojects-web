import { type GithubStats, visibleStats } from '@/features/github/stats'

export function GithubStatsView({ stats, labels }: { stats: GithubStats | null; labels: { repos: string; stars: string } }) {
  const items = visibleStats(stats)
  if (items.length === 0) return null
  return (
    <dl className="flex gap-6 font-mono text-sm">
      {items.map((i) => (
        <div key={i.key}>
          <dt className="text-xs uppercase text-ink-3">{labels[i.key]}</dt>
          <dd className="text-xl text-ink-0">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}
