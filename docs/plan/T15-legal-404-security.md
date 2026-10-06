# T15 — Legal pages, branded 404, security headers

**Files:**
- Create: `src/app/(frontend)/[locale]/legal-notice/page.tsx`, `src/app/(frontend)/[locale]/privacy/page.tsx`, `src/app/(frontend)/[locale]/cookies/page.tsx`, `src/components/sections/legal-page.tsx`, `src/app/(frontend)/[locale]/not-found.tsx`, `src/app/(frontend)/[locale]/[...rest]/page.tsx`, `src/lib/csp.ts`
- Modify: `src/lib/http-headers.ts` (security headers), `tests/unit/http-headers.test.ts`
- Test: `tests/unit/csp.test.ts`

**Interfaces:**
- Consumes: `getLegal` (T06), `RichText` (T06), `PageShell` (T07), `buildMetadata` (T13), `responseHeaders` (T13).
- Produces: `buildCsp(opts: { dev: boolean }): string`; `responseHeaders()` now also returns security headers for all non-admin routes.

- [ ] **Step 1: Failing tests**

`tests/unit/csp.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildCsp } from '@/lib/csp'

const directive = (csp: string, name: string) => csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? ''

describe('buildCsp', () => {
  const csp = buildCsp({ dev: false })
  it('allows only required third parties for scripts', () => {
    const s = directive(csp, 'script-src')
    expect(s).toContain("'self'")
    expect(s).toContain('https://connect.facebook.net')
    expect(s).toContain('https://challenges.cloudflare.com')
    expect(s).not.toContain("'unsafe-eval'")
  })
  it('allows Turnstile frames and forbids being framed', () => {
    expect(directive(csp, 'frame-src')).toContain('https://challenges.cloudflare.com')
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'")
  })
  it('allows Meta and Vercel endpoints for connect', () => {
    const c = directive(csp, 'connect-src')
    expect(c).toContain('https://www.facebook.com')
    expect(c).toContain('https://vitals.vercel-insights.com')
  })
  it('enables eval only in development (React Refresh)', () => {
    expect(directive(buildCsp({ dev: true }), 'script-src')).toContain("'unsafe-eval'")
  })
})
```

Append to `tests/unit/http-headers.test.ts`:

```ts
it('sends security headers on public routes but not on the admin', () => {
  const rules = responseHeaders('production')
  const site = rules.find((r) => r.source === '/((?!admin).*)')
  const keys = site?.headers.map((h) => h.key)
  expect(keys).toEqual(expect.arrayContaining(['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']))
  const admin = rules.find((r) => r.source === '/admin/:path*')
  expect(admin?.headers.map((h) => h.key)).not.toContain('Content-Security-Policy')
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/csp.test.ts tests/unit/http-headers.test.ts
```

- [ ] **Step 3: Implement `src/lib/csp.ts`**

```ts
export function buildCsp({ dev }: { dev: boolean }): string {
  const d: Record<string, string[]> = {
    'default-src': ["'self'"],
    // 'unsafe-inline' is required by Next.js inline bootstrap scripts without nonces (nonces would force dynamic rendering and disable ISR).
    'script-src': ["'self'", "'unsafe-inline'", 'https://connect.facebook.net', 'https://challenges.cloudflare.com', 'https://va.vercel-scripts.com', ...(dev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https://*.public.blob.vercel-storage.com', 'https://avatars.githubusercontent.com', 'https://www.facebook.com'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://www.facebook.com', 'https://connect.facebook.net', 'https://challenges.cloudflare.com', 'https://vitals.vercel-insights.com', 'https://va.vercel-scripts.com', ...(dev ? ['ws:'] : [])],
    'frame-src': ['https://challenges.cloudflare.com'],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
  }
  const parts = Object.entries(d).map(([k, v]) => `${k} ${v.join(' ')}`)
  if (!dev) parts.push('upgrade-insecure-requests')
  return parts.join('; ')
}
```

- [ ] **Step 4: Extend `src/lib/http-headers.ts`**

```ts
import { buildCsp } from './csp'

type Header = { key: string; value: string }
type Rule = { source: string; headers: Header[] }

const NOINDEX: Header = { key: 'X-Robots-Tag', value: 'noindex, nofollow' }

export function responseHeaders(siteEnv: 'development' | 'staging' | 'production'): Rule[] {
  const security: Header[] = [
    { key: 'Content-Security-Policy', value: buildCsp({ dev: siteEnv === 'development' }) },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  ]
  const rules: Rule[] = [
    { source: '/((?!admin).*)', headers: security },
    { source: '/admin/:path*', headers: [NOINDEX, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
  ]
  if (siteEnv !== 'production') rules.push({ source: '/:path*', headers: [NOINDEX] })
  return rules
}
```

> The admin keeps Payload's own needs (it may require `eval`/inline styles), so no CSP there; it is auth-protected and `noindex`.

- [ ] **Step 5: Run — expect PASS**

```bash
pnpm vitest run tests/unit/csp.test.ts tests/unit/http-headers.test.ts
```

- [ ] **Step 6: Legal pages**

`src/components/sections/legal-page.tsx`:

```tsx
import { Container } from '@/components/ui/container'
import { RichText } from '@/components/ui/rich-text'

export function LegalPage({ title, content }: { title: string; content: unknown }) {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">{title}</h1>
        <RichText data={content} className="mt-10" />
      </Container>
    </section>
  )
}
```

`src/app/(frontend)/[locale]/privacy/page.tsx` (repeat for `legal-notice` → `legalNotice` / `t('legal')` / `'/legal-notice'`, and `cookies` → `cookiePolicy` / `t('cookies')` / `'/cookies'`):

```tsx
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { LegalPage } from '@/components/sections/legal-page'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getLegal } from '@/lib/cms/queries'
import { buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'footer' })
  return buildMetadata({ locale, paths: localizedPaths('/privacy'), title: t('privacy'), description: t('privacy') })
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [legal, t] = await Promise.all([getLegal(locale), getTranslations('footer')])
  return (
    <PageShell locale={locale} alternates={localizedPaths('/privacy')}>
      <LegalPage title={t('privacy')} content={legal.privacyPolicy} />
    </PageShell>
  )
}
```

- [ ] **Step 7: Branded 404**

`src/app/(frontend)/[locale]/[...rest]/page.tsx` (makes unknown localized paths hit the localized not-found):

```tsx
import { notFound } from 'next/navigation'

export default function CatchAll() {
  notFound()
}
```

`src/app/(frontend)/[locale]/not-found.tsx`:

```tsx
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

export default function NotFound() {
  const t = useTranslations('notFound')
  return (
    <main className="steam-glow grid min-h-dvh place-items-center py-24">
      <Container className="max-w-xl">
        <div className="rounded-[var(--radius-lg)] border border-line bg-bg-1 p-8 font-mono text-sm">
          <p className="text-mint">{t('command')}</p>
          <p className="mt-2 text-berry">{t('error')}</p>
        </div>
        <h1 className="mt-10 text-4xl font-semibold">{t('body')}</h1>
        <Button href="/" size="lg" className="mt-8">{t('cta')}</Button>
      </Container>
    </main>
  )
}
```

- [ ] **Step 8: Manual check**

`pnpm build && pnpm start`: `/aviso-legal`, `/en/privacy`, `/fr/cookies` render the seeded drafts with visible `[PENDIENTE…]`/`[PENDING…]` markers; `/no-existe` and `/en/nothing` show the terminal 404 with HTTP status 404 (`curl -sI`); browser console on `/` and `/contacto` shows **no CSP violations** with cookies accepted (Pixel + Turnstile load); `curl -sI localhost:3000/ | grep -iE 'content-security|strict-transport'` shows both headers; `/admin` still works.

- [ ] **Step 9: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(legal): add legal pages, branded 404 and security headers"
```
