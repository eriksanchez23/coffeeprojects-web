export function projectPublicUrl(p: { nda?: boolean | null; url?: string | null }): string | null {
  if (p.nda || !p.url) return null
  return /^https?:\/\//i.test(p.url) ? p.url : null
}

const hues = [32, 18, 40, 12, 150, 200]

export function coverGradient(seed: string): string {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const a = hues[h % hues.length]
  const b = hues[(h >>> 3) % hues.length]
  return `radial-gradient(120% 120% at 0% 0%, hsl(${a} 60% 70% / .45), transparent 60%), radial-gradient(120% 120% at 100% 100%, hsl(${b} 45% 55% / .35), transparent 60%), #f3ede4`
}
