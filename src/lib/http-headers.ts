type Header = { key: string; value: string }
type Rule = { source: string; headers: Header[] }

const NOINDEX: Header = { key: 'X-Robots-Tag', value: 'noindex, nofollow' }

export function responseHeaders(siteEnv: 'development' | 'staging' | 'production'): Rule[] {
  const rules: Rule[] = [{ source: '/admin/:path*', headers: [NOINDEX] }]
  if (siteEnv !== 'production') rules.push({ source: '/:path*', headers: [NOINDEX] })
  return rules
}
