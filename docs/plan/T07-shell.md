# T07 — Shell: page shell, header, footer, mobile CTA bar, cookie consent

**Files:**
- Create: `src/features/tracking/consent.ts`, `src/features/tracking/use-consent.ts`, `src/components/layout/consent-banner.tsx`, `src/components/layout/site-header.tsx`, `src/components/layout/mobile-menu.tsx`, `src/components/layout/site-footer.tsx`, `src/components/layout/mobile-cta-bar.tsx`, `src/components/layout/page-shell.tsx`, `src/components/layout/logo.tsx`
- Modify: `src/app/(frontend)/[locale]/layout.tsx` (mount `ConsentBanner`, skip link)
- Test: `tests/unit/consent.test.ts`

**Interfaces:**
- Consumes: `Button`, `Container`, `cn` (T02); `Link`, `LanguageSwitcher`, `AlternatesProvider`, `Locale` (T03); `getSettings` (T06).
- Produces:
  - `type Consent = { v: 1; marketing: boolean; ts: number }`
  - `CONSENT_COOKIE = 'cp_consent'`, `parseConsent(raw: string | undefined): Consent | null`, `serializeConsent(c: Consent): string`, `consentCookieString(c: Consent): string`
  - `useConsent(): { consent: Consent | null; setMarketing(granted: boolean): void; reopen(): void; isOpen: boolean }`
  - Event names: `cp:consent-changed` (detail: `Consent`), `cp:consent-open`
  - `<PageShell locale alternates>{children}</PageShell>` — every page renders inside it
  - `<Logo />`

- [ ] **Step 1: Failing tests** — `tests/unit/consent.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { consentCookieString, parseConsent, serializeConsent } from '@/features/tracking/consent'

describe('consent', () => {
  it('round-trips a consent value', () => {
    const c = { v: 1 as const, marketing: true, ts: 1_700_000_000_000 }
    expect(parseConsent(serializeConsent(c))).toEqual(c)
  })
  it('returns null for missing or malformed cookies', () => {
    expect(parseConsent(undefined)).toBeNull()
    expect(parseConsent('not-json')).toBeNull()
    expect(parseConsent(encodeURIComponent(JSON.stringify({ v: 2, marketing: true, ts: 1 })))).toBeNull()
  })
  it('expires after 6 months', () => {
    const old = { v: 1 as const, marketing: true, ts: Date.now() - 1000 * 60 * 60 * 24 * 190 }
    expect(parseConsent(serializeConsent(old))).toBeNull()
  })
  it('builds a 6-month, lax, path=/ cookie', () => {
    const s = consentCookieString({ v: 1, marketing: false, ts: Date.now() })
    expect(s).toMatch(/^cp_consent=/)
    expect(s).toContain('Max-Age=15552000')
    expect(s).toContain('Path=/')
    expect(s).toContain('SameSite=Lax')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/consent.test.ts
```

- [ ] **Step 3: Implement `src/features/tracking/consent.ts`**

```ts
export type Consent = { v: 1; marketing: boolean; ts: number }

export const CONSENT_COOKIE = 'cp_consent'
const MAX_AGE_S = 60 * 60 * 24 * 180

export function serializeConsent(c: Consent): string {
  return encodeURIComponent(JSON.stringify(c))
}

export function parseConsent(raw: string | undefined): Consent | null {
  if (!raw) return null
  try {
    const c = JSON.parse(decodeURIComponent(raw)) as Partial<Consent>
    if (c.v !== 1 || typeof c.marketing !== 'boolean' || typeof c.ts !== 'number') return null
    if (Date.now() - c.ts > MAX_AGE_S * 1000) return null
    return { v: 1, marketing: c.marketing, ts: c.ts }
  } catch {
    return null
  }
}

export function consentCookieString(c: Consent): string {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  return `${CONSENT_COOKIE}=${serializeConsent(c)}; Max-Age=${MAX_AGE_S}; Path=/; SameSite=Lax${secure}`
}

export function readConsentFromDocument(): Consent | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find((p) => p.startsWith(`${CONSENT_COOKIE}=`))
  return parseConsent(match?.slice(CONSENT_COOKIE.length + 1))
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm vitest run tests/unit/consent.test.ts
```

- [ ] **Step 5: Hook `src/features/tracking/use-consent.ts`**

```ts
'use client'
import { useCallback, useEffect, useState } from 'react'
import { type Consent, consentCookieString, readConsentFromDocument } from './consent'

export const CONSENT_CHANGED = 'cp:consent-changed'
export const CONSENT_OPEN = 'cp:consent-open'

export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN))
}

export function useConsent() {
  const [consent, setConsent] = useState<Consent | null>(null)
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    const current = readConsentFromDocument()
    setConsent(current)
    setOpen(current === null)
    const onOpen = () => setOpen(true)
    const onChange = (e: Event) => setConsent((e as CustomEvent<Consent>).detail)
    window.addEventListener(CONSENT_OPEN, onOpen)
    window.addEventListener(CONSENT_CHANGED, onChange)
    return () => {
      window.removeEventListener(CONSENT_OPEN, onOpen)
      window.removeEventListener(CONSENT_CHANGED, onChange)
    }
  }, [])

  const setMarketing = useCallback((granted: boolean) => {
    const next: Consent = { v: 1, marketing: granted, ts: Date.now() }
    document.cookie = consentCookieString(next)
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED, { detail: next }))
    setOpen(false)
  }, [])

  return { consent, setMarketing, reopen: openConsentSettings, isOpen }
}
```

- [ ] **Step 6: Consent banner `src/components/layout/consent-banner.tsx`**

```tsx
'use client'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useConsent } from '@/features/tracking/use-consent'
import { Link } from '@/i18n/navigation'

export function ConsentBanner() {
  const t = useTranslations('consent')
  const { consent, setMarketing, isOpen } = useConsent()
  const [configuring, setConfiguring] = useState(false)
  const [marketing, setMarketingDraft] = useState(consent?.marketing ?? false)
  const titleId = useId()

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-[var(--radius-lg)] border border-line-hi bg-bg-1/95 p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:bottom-6"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {t('title')}
      </h2>
      <p className="mt-2 text-sm text-ink-2">
        {t('body')}{' '}
        <Link href="/cookies" className="text-amber underline">
          {t('policy')}
        </Link>
      </p>

      {configuring && (
        <fieldset className="mt-4 space-y-3 text-sm">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked disabled className="mt-1 accent-amber" />
            <span>
              <strong className="text-ink-0">{t('necessary')}</strong> — {t('necessaryDesc')}
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketingDraft(e.target.checked)}
              className="mt-1 accent-amber"
            />
            <span>
              <strong className="text-ink-0">{t('marketing')}</strong> — {t('marketingDesc')}
            </span>
          </label>
        </fieldset>
      )}

      {/* Reject and Accept have equal visual weight (AEPD guidance). */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setMarketing(false)}>
          {t('reject')}
        </Button>
        {configuring ? (
          <Button variant="outline" onClick={() => setMarketing(marketing)}>
            {t('save')}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setConfiguring(true)}>
            {t('configure')}
          </Button>
        )}
        <Button variant="outline" onClick={() => setMarketing(true)}>
          {t('accept')}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Logo, header, mobile menu, footer, mobile CTA bar, page shell**

`src/components/layout/logo.tsx`:

```tsx
import { Link } from '@/i18n/navigation'

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2 font-display text-lg font-semibold text-ink-0" aria-label="CoffeeProjects">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber transition-transform duration-500 group-hover:-rotate-12" aria-hidden>
        <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-70" />
      </svg>
      <span>
        coffee<span className="text-amber">projects</span>
      </span>
    </Link>
  )
}
```

`src/components/layout/site-header.tsx`:

```tsx
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './language-switcher'
import { Logo } from './logo'
import { MobileMenu } from './mobile-menu'

export async function SiteHeader() {
  const t = await getTranslations('nav')
  const links = [
    { href: '/services' as const, label: t('services') },
    { href: '/team' as const, label: t('team') },
    { href: '/projects' as const, label: t('projects') },
    { href: { pathname: '/' as const, hash: 'faq' }, label: t('faq') },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg-0/70 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="text-ink-2 transition-colors hover:text-ink-0">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Button href="/contact">{t('cta')}</Button>
        </div>
        <MobileMenu links={links} ctaLabel={t('cta')} openLabel={t('openMenu')} closeLabel={t('closeMenu')} />
      </Container>
    </header>
  )
}
```

`src/components/layout/mobile-menu.tsx`:

```tsx
'use client'
import { type ComponentProps, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/i18n/navigation'
import { LanguageSwitcher } from './language-switcher'

type NavLink = { href: ComponentProps<typeof Link>['href']; label: string }

export function MobileMenu({ links, ctaLabel, openLabel, closeLabel }: { links: NavLink[]; ctaLabel: string; openLabel: string; closeLabel: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-full border border-line-hi text-ink-0"
      >
        <span aria-hidden className="font-mono text-lg">{open ? '×' : '≡'}</span>
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col gap-6 bg-bg-0 p-6">
          <nav aria-label="Mobile" className="flex flex-col gap-4 text-2xl font-display">
            {links.map((l) => (
              <Link key={l.label} href={l.href} className="text-ink-0" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher />
          <Button href="/contact" size="lg" className="mt-auto">
            {ctaLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
```

`src/components/layout/site-footer.tsx`:

```tsx
'use client'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/container'
import { openConsentSettings } from '@/features/tracking/use-consent'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './language-switcher'

export function SiteFooter({ email, chatUrl }: { email: string; chatUrl?: string | null }) {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-line py-14 text-sm text-ink-2">
      <Container className="grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-ink-0">{t('tagline')}</p>
          <p className="mt-3">{t('remote')}</p>
        </div>
        <div className="flex flex-col gap-2">
          <a href={`mailto:${email}`} className="text-ink-0 hover:text-amber">{email}</a>
          {chatUrl && (
            <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="hover:text-amber">Chat</a>
          )}
          <LanguageSwitcher className="mt-2" />
        </div>
        <nav aria-label="Legal" className="flex flex-col gap-2 md:items-end">
          <Link href="/legal-notice" className="hover:text-ink-0">{t('legal')}</Link>
          <Link href="/privacy" className="hover:text-ink-0">{t('privacy')}</Link>
          <Link href="/cookies" className="hover:text-ink-0">{t('cookies')}</Link>
          <button type="button" onClick={openConsentSettings} className="text-left hover:text-ink-0 md:text-right">
            {t('manageCookies')}
          </button>
        </nav>
      </Container>
      <Container className="mt-10 font-mono text-xs text-ink-3">
        © {year} CoffeeProjects. {t('rights')}
      </Container>
    </footer>
  )
}
```

`src/components/layout/mobile-cta-bar.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function MobileCtaBar({ label }: { label: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-3 bottom-3 z-40 transition-transform duration-500 md:hidden ${visible ? 'translate-y-0' : 'translate-y-[150%]'}`}
    >
      <Button href="/contact" size="lg" className="w-full" tabIndex={visible ? 0 : -1}>
        {label}
      </Button>
    </div>
  )
}
```

`src/components/layout/page-shell.tsx`:

```tsx
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import type { Locale } from '@/i18n/locales'
import { getSettings } from '@/lib/cms/queries'
import { AlternatesProvider } from './alternates-context'
import { MobileCtaBar } from './mobile-cta-bar'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

export async function PageShell({
  locale,
  alternates,
  children,
  hideMobileCta = false,
}: {
  locale: Locale
  alternates: Record<Locale, string>
  children: ReactNode
  hideMobileCta?: boolean
}) {
  const [settings, t] = await Promise.all([getSettings(locale), getTranslations('nav')])
  return (
    <AlternatesProvider value={alternates}>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter email={settings.contactEmail} chatUrl={settings.chatUrl} />
      {!hideMobileCta && <MobileCtaBar label={t('cta')} />}
    </AlternatesProvider>
  )
}
```

- [ ] **Step 8: Layout — skip link + consent banner**

In `src/app/(frontend)/[locale]/layout.tsx`, inside `<NextIntlClientProvider>`:

```tsx
const t = await getTranslations({ locale, namespace: 'nav' })
// ...
<NextIntlClientProvider>
  <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-amber focus:px-4 focus:py-2 focus:text-bg-0">
    {t('skip')}
  </a>
  {children}
  <ConsentBanner />
</NextIntlClientProvider>
```

(import `getTranslations` from `next-intl/server` and `ConsentBanner`.)

Wrap the stub home page in `<PageShell locale={locale as Locale} alternates={localizedPaths('/')}>` (convert it to an `async` server component using `await params`).

- [ ] **Step 8b: Vercel Analytics + Speed Insights (spec §3, cookieless — no consent needed)**

```bash
pnpm add @vercel/analytics @vercel/speed-insights
```

In `[locale]/layout.tsx`, at the end of `<body>`:

```tsx
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
// …
<Analytics />
<SpeedInsights />
```

(They no-op locally and report only on Vercel deployments.)

- [ ] **Step 9: Manual check**

`pnpm dev` → `/`: header sticky, language switcher works, banner appears on first visit with Reject/Configure/Accept equally styled; Reject hides it and sets `cp_consent` cookie with `marketing:false`; "Configurar cookies" in footer reopens it; at 375px width the hamburger opens a full-screen menu and closes on navigation; scrolling down shows the mobile CTA bar.

- [ ] **Step 10: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(layout): add page shell, header, footer, mobile CTA and GDPR consent banner"
```
