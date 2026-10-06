# T12 — Meta Ads: Pixel, Conversions API, attribution capture (consent-gated)

**Files:**
- Create: `src/features/tracking/attribution.ts`, `src/features/tracking/capi.ts`, `src/features/tracking/lead.ts`, `src/components/tracking/meta-pixel.tsx`, `src/components/tracking/attribution-capture.tsx`, `src/components/tracking/track-view-content.tsx`, `src/components/tracking/track-lead.tsx`
- Modify: `src/app/(frontend)/[locale]/layout.tsx` (mount `MetaPixel` + `AttributionCapture`), `src/features/contact/action.ts` (attribution + `afterSave`), `src/app/(frontend)/[locale]/services/[slug]/page.tsx` (`TrackViewContent`), `src/app/(frontend)/[locale]/contact/thanks/page.tsx` (`TrackLead`)
- Test: `tests/unit/attribution.test.ts`, `tests/unit/capi.test.ts`, `tests/unit/lead.test.ts`

**Interfaces:**
- Consumes: consent (`readConsentFromDocument`, `CONSENT_CHANGED`) (T07), `handleContact` deps (`afterSave`) and `submitContact` (T11).
- Produces:
  - `ATTR_COOKIE = 'cp_attr'`, `type Attribution = { utmSource?; utmMedium?; utmCampaign?; utmContent?; utmTerm?; fbclid?; fbclidTs? }`
  - `extractAttribution(search: URLSearchParams, now: number): Attribution | null`, `mergeAttribution(prev, next)`, `parseAttributionCookie(raw)`, `attributionCookieString(a)`
  - `sha256Normalized(value: string, kind: 'email' | 'phone'): string`
  - `buildLeadEvent(args): CapiEvent`, `sendCapiEvent(event, env): Promise<void>`
  - `fbcFrom(fbcCookie?: string, attribution?: Attribution | null): string | undefined`
  - `afterSaveLead(input, eventId, ctx, send): Promise<'sent' | 'skipped'>`
  - `trackPixel(event: 'PageView' | 'ViewContent' | 'Contact' | 'Lead', params?: Record<string, unknown>, eventId?: string): void`

- [ ] **Step 1: Failing tests**

`tests/unit/attribution.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { extractAttribution, mergeAttribution, parseAttributionCookie, attributionCookieString } from '@/features/tracking/attribution'

describe('attribution', () => {
  it('extracts UTM params and fbclid', () => {
    const a = extractAttribution(new URLSearchParams('utm_source=facebook&utm_campaign=webs-oct&fbclid=ABC&x=1'), 1000)
    expect(a).toEqual({ utmSource: 'facebook', utmCampaign: 'webs-oct', fbclid: 'ABC', fbclidTs: 1000 })
  })
  it('returns null when nothing is present', () => {
    expect(extractAttribution(new URLSearchParams('x=1'), 1)).toBeNull()
  })
  it('caps values at 150 chars', () => {
    const a = extractAttribution(new URLSearchParams(`utm_campaign=${'x'.repeat(300)}`), 1)
    expect(a?.utmCampaign).toHaveLength(150)
  })
  it('last non-empty touch wins', () => {
    expect(mergeAttribution({ utmSource: 'a', utmCampaign: 'c1' }, { utmCampaign: 'c2' })).toEqual({ utmSource: 'a', utmCampaign: 'c2' })
  })
  it('round-trips the cookie', () => {
    const a = { utmSource: 'facebook', fbclid: 'X', fbclidTs: 5 }
    const raw = attributionCookieString(a).split(';')[0].split('=').slice(1).join('=')
    expect(parseAttributionCookie(raw)).toEqual(a)
    expect(parseAttributionCookie('garbage')).toBeNull()
  })
})
```

`tests/unit/capi.test.ts`:

```ts
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildLeadEvent, fbcFrom, sha256Normalized } from '@/features/tracking/capi'

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

describe('capi', () => {
  it('normalizes emails before hashing', () => {
    expect(sha256Normalized('  Ana@Example.COM ', 'email')).toBe(sha('ana@example.com'))
  })
  it('keeps only digits for phones', () => {
    expect(sha256Normalized('+34 600-123-456', 'phone')).toBe(sha('34600123456'))
  })
  it('builds fbc from fbclid when the cookie is missing', () => {
    expect(fbcFrom(undefined, { fbclid: 'ABC', fbclidTs: 1700 })).toBe('fb.1.1700.ABC')
    expect(fbcFrom('fb.1.1.ZZZ', { fbclid: 'ABC', fbclidTs: 1 })).toBe('fb.1.1.ZZZ')
    expect(fbcFrom(undefined, null)).toBeUndefined()
  })
  it('builds a deduplicable Lead event without raw PII', () => {
    const e = buildLeadEvent({
      eventId: 'evt-1',
      email: 'ana@example.com',
      phone: undefined,
      ip: '1.2.3.4',
      userAgent: 'UA',
      fbp: 'fb.1.1.123',
      fbc: undefined,
      sourceUrl: 'https://coffeeprojects.es/contacto',
      projectType: 'web',
      nowSeconds: 1_700_000_000,
    })
    expect(e).toMatchObject({
      event_name: 'Lead',
      event_id: 'evt-1',
      event_time: 1_700_000_000,
      action_source: 'website',
      event_source_url: 'https://coffeeprojects.es/contacto',
      user_data: { em: [sha('ana@example.com')], client_ip_address: '1.2.3.4', client_user_agent: 'UA', fbp: 'fb.1.1.123' },
      custom_data: { content_category: 'web' },
    })
    expect(JSON.stringify(e)).not.toContain('ana@example.com')
    expect(e.user_data).not.toHaveProperty('ph')
  })
})
```

`tests/unit/lead.test.ts` (Review Focus #5):

```ts
import { describe, expect, it, vi } from 'vitest'
import { afterSaveLead } from '@/features/tracking/lead'

const input = { email: 'a@b.co', phone: undefined, projectType: 'web', marketingConsent: false } as never
const ctx = { ip: '1.1.1.1', userAgent: 'UA', fbp: undefined, fbcCookie: undefined, attribution: null, sourceUrl: 'https://x/contacto', nowSeconds: 1 }

describe('afterSaveLead', () => {
  it('sends nothing to Meta when marketing consent was rejected', async () => {
    const send = vi.fn()
    expect(await afterSaveLead(input, 'evt', ctx, send)).toBe('skipped')
    expect(send).not.toHaveBeenCalled()
  })
  it('sends a Lead when marketing consent was granted', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    expect(await afterSaveLead({ ...(input as object), marketingConsent: true } as never, 'evt', ctx, send)).toBe('sent')
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ event_name: 'Lead', event_id: 'evt' }))
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/attribution.test.ts tests/unit/capi.test.ts tests/unit/lead.test.ts
```

- [ ] **Step 3: Implement `src/features/tracking/attribution.ts`**

```ts
export const ATTR_COOKIE = 'cp_attr'
const MAX_AGE_S = 60 * 60 * 24 * 30

export type Attribution = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  fbclid?: string
  fbclidTs?: number
}

const map: [string, keyof Attribution][] = [
  ['utm_source', 'utmSource'],
  ['utm_medium', 'utmMedium'],
  ['utm_campaign', 'utmCampaign'],
  ['utm_content', 'utmContent'],
  ['utm_term', 'utmTerm'],
  ['fbclid', 'fbclid'],
]

export function extractAttribution(search: URLSearchParams, now: number): Attribution | null {
  const out: Attribution = {}
  for (const [param, key] of map) {
    const v = search.get(param)?.trim()
    if (v) (out as Record<string, unknown>)[key] = v.slice(0, 150)
  }
  if (out.fbclid) out.fbclidTs = now
  return Object.keys(out).length ? out : null
}

export function mergeAttribution(prev: Attribution | null, next: Attribution | null): Attribution | null {
  if (!prev) return next
  if (!next) return prev
  return { ...prev, ...next }
}

export function attributionCookieString(a: Attribution): string {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  return `${ATTR_COOKIE}=${encodeURIComponent(JSON.stringify(a))}; Max-Age=${MAX_AGE_S}; Path=/; SameSite=Lax${secure}`
}

export function parseAttributionCookie(raw: string | undefined): Attribution | null {
  if (!raw) return null
  try {
    const v = JSON.parse(decodeURIComponent(raw))
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Attribution) : null
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Implement `src/features/tracking/capi.ts`**

```ts
import { createHash } from 'node:crypto'
import type { Attribution } from './attribution'

export type CapiEvent = {
  event_name: 'Lead'
  event_time: number
  event_id: string
  action_source: 'website'
  event_source_url: string
  user_data: { em?: string[]; ph?: string[]; client_ip_address: string; client_user_agent: string; fbp?: string; fbc?: string }
  custom_data: { content_category: string }
}

export function sha256Normalized(value: string, kind: 'email' | 'phone'): string {
  const normalized = kind === 'email' ? value.trim().toLowerCase() : value.replace(/\D/g, '')
  return createHash('sha256').update(normalized).digest('hex')
}

export function fbcFrom(fbcCookie: string | undefined, attribution: Attribution | null | undefined): string | undefined {
  if (fbcCookie) return fbcCookie
  if (attribution?.fbclid) return `fb.1.${attribution.fbclidTs ?? Date.now()}.${attribution.fbclid}`
  return undefined
}

export function buildLeadEvent(a: {
  eventId: string
  email: string
  phone?: string
  ip: string
  userAgent: string
  fbp?: string
  fbc?: string
  sourceUrl: string
  projectType: string
  nowSeconds: number
}): CapiEvent {
  const user_data: CapiEvent['user_data'] = {
    em: [sha256Normalized(a.email, 'email')],
    client_ip_address: a.ip,
    client_user_agent: a.userAgent,
  }
  if (a.phone) user_data.ph = [sha256Normalized(a.phone, 'phone')]
  if (a.fbp) user_data.fbp = a.fbp
  if (a.fbc) user_data.fbc = a.fbc
  return {
    event_name: 'Lead',
    event_time: a.nowSeconds,
    event_id: a.eventId,
    action_source: 'website',
    event_source_url: a.sourceUrl,
    user_data,
    custom_data: { content_category: a.projectType },
  }
}

export async function sendCapiEvent(event: CapiEvent): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixelId || !token) return
  const version = process.env.META_GRAPH_VERSION || 'v24.0'
  const body: Record<string, unknown> = { data: [event] }
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE
  const res = await fetch(`https://graph.facebook.com/${version}/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`CAPI ${res.status}: ${await res.text()}`)
}
```

- [ ] **Step 5: Implement `src/features/tracking/lead.ts`**

```ts
import type { ContactInput } from '@/features/contact/schema'
import type { Attribution } from './attribution'
import { buildLeadEvent, type CapiEvent, fbcFrom } from './capi'

export type LeadContext = {
  ip: string
  userAgent: string
  fbp?: string
  fbcCookie?: string
  attribution: Attribution | null
  sourceUrl: string
  nowSeconds: number
}

export async function afterSaveLead(
  input: Pick<ContactInput, 'email' | 'phone' | 'projectType' | 'marketingConsent'>,
  eventId: string,
  ctx: LeadContext,
  send: (e: CapiEvent) => Promise<void>,
): Promise<'sent' | 'skipped'> {
  if (!input.marketingConsent) return 'skipped'
  await send(
    buildLeadEvent({
      eventId,
      email: input.email,
      phone: input.phone,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      fbp: ctx.fbp,
      fbc: fbcFrom(ctx.fbcCookie, ctx.attribution),
      sourceUrl: ctx.sourceUrl,
      projectType: input.projectType,
      nowSeconds: ctx.nowSeconds,
    }),
  )
  return 'sent'
}
```

- [ ] **Step 6: Run — expect PASS**

```bash
pnpm vitest run tests/unit/attribution.test.ts tests/unit/capi.test.ts tests/unit/lead.test.ts
```

- [ ] **Step 7: Wire the Server Action** — in `src/features/contact/action.ts`:

```ts
import { cookies } from 'next/headers'
import { ATTR_COOKIE, parseAttributionCookie } from '@/features/tracking/attribution'
import { sendCapiEvent } from '@/features/tracking/capi'
import { afterSaveLead } from '@/features/tracking/lead'
import { env } from '@/lib/env'

// inside submitContact, after `const raw = …`:
const jar = await cookies()
const attribution = parseAttributionCookie(jar.get(ATTR_COOKIE)?.value)
const marketing = raw.marketingConsent === 'true'

// createContact: add attribution only with marketing consent
data: {
  ...rest,
  privacyAccepted: privacy,
  ndaRequested: data.nda,
  status: 'new',
  ...(marketing && attribution
    ? {
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign,
        utmContent: attribution.utmContent,
        utmTerm: attribution.utmTerm,
        fbclid: attribution.fbclid,
      }
    : {}),
},

// add to the deps object:
afterSave: (input, eventId) =>
  afterSaveLead(
    input,
    eventId,
    {
      ip,
      userAgent: h.get('user-agent') ?? '',
      fbp: jar.get('_fbp')?.value,
      fbcCookie: jar.get('_fbc')?.value,
      attribution,
      sourceUrl: `${env.SITE_URL}${input.sourcePath}`,
      nowSeconds: Math.floor(Date.now() / 1000),
    },
    sendCapiEvent,
  ).then(() => undefined),
```

- [ ] **Step 8: Client tracking components**

`src/components/tracking/meta-pixel.tsx`:

```tsx
'use client'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import { type Consent, readConsentFromDocument } from '@/features/tracking/consent'
import { CONSENT_CHANGED } from '@/features/tracking/use-consent'

type Fbq = ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] }
declare global {
  interface Window {
    fbq?: Fbq
  }
}

export function trackPixel(event: 'PageView' | 'ViewContent' | 'Contact' | 'Lead', params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', event, params ?? {}, eventId ? { eventID: eventId } : undefined)
}

export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const [granted, setGranted] = useState(false)
  const pathname = usePathname()
  const first = useRef(true)

  useEffect(() => {
    setGranted(readConsentFromDocument()?.marketing === true)
    const onChange = (e: Event) => setGranted((e as CustomEvent<Consent>).detail.marketing)
    window.addEventListener(CONSENT_CHANGED, onChange)
    return () => window.removeEventListener(CONSENT_CHANGED, onChange)
  }, [])

  // Revoke immediately if the user withdraws consent during the session.
  useEffect(() => {
    if (!granted && window.fbq) window.fbq('consent', 'revoke')
  }, [granted])

  // SPA navigations: track PageView on route change (initial one is sent by the base code).
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (granted) trackPixel('PageView')
  }, [pathname, granted])

  // Outbound contact clicks (mailto/chat) marked with data-track.
  useEffect(() => {
    if (!granted) return
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-track^="contact"]')
      if (el) trackPixel('Contact')
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [granted])

  if (!pixelId || !granted) return null
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','grant');fbq('init','${pixelId.replace(/\D/g, '')}');fbq('track','PageView');`}
    </Script>
  )
}
```

`src/components/tracking/attribution-capture.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { ATTR_COOKIE, attributionCookieString, extractAttribution, mergeAttribution, parseAttributionCookie } from '@/features/tracking/attribution'
import { type Consent, readConsentFromDocument } from '@/features/tracking/consent'
import { CONSENT_CHANGED } from '@/features/tracking/use-consent'

function readCookie() {
  const m = document.cookie.split('; ').find((p) => p.startsWith(`${ATTR_COOKIE}=`))
  return parseAttributionCookie(m?.slice(ATTR_COOKIE.length + 1))
}

// Captured once per page load; persisted only after marketing consent (ePrivacy).
export function AttributionCapture() {
  useEffect(() => {
    const landing = extractAttribution(new URLSearchParams(window.location.search), Date.now())
    const persist = () => {
      const merged = mergeAttribution(readCookie(), landing)
      if (merged) document.cookie = attributionCookieString(merged)
    }
    if (readConsentFromDocument()?.marketing) persist()
    const onChange = (e: Event) => {
      if ((e as CustomEvent<Consent>).detail.marketing) persist()
      else document.cookie = `${ATTR_COOKIE}=; Max-Age=0; Path=/`
    }
    window.addEventListener(CONSENT_CHANGED, onChange)
    return () => window.removeEventListener(CONSENT_CHANGED, onChange)
  }, [])
  return null
}
```

`src/components/tracking/track-view-content.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { trackPixel } from './meta-pixel'

export function TrackViewContent({ name, category }: { name: string; category: string }) {
  useEffect(() => {
    // Pixel may load after hydration; retry briefly.
    let tries = 0
    const id = setInterval(() => {
      if (window.fbq || ++tries > 10) {
        trackPixel('ViewContent', { content_name: name, content_category: category })
        clearInterval(id)
      }
    }, 300)
    return () => clearInterval(id)
  }, [name, category])
  return null
}
```

`src/components/tracking/track-lead.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { trackPixel } from './meta-pixel'

export function TrackLead({ eventId }: { eventId?: string }) {
  useEffect(() => {
    if (!eventId) return
    const key = `cp_lead_${eventId}`
    try {
      if (sessionStorage.getItem(key)) return // no double count on refresh
    } catch {}
    let tries = 0
    const id = setInterval(() => {
      if (window.fbq || ++tries > 10) {
        trackPixel('Lead', {}, eventId)
        try {
          sessionStorage.setItem(key, '1')
        } catch {}
        clearInterval(id)
      }
    }, 300)
    return () => clearInterval(id)
  }, [eventId])
  return null
}
```

> `trackPixel` is a no-op without consent because `window.fbq` only exists after the consent-gated script loads.

- [ ] **Step 9: Mount and use**

Layout (`[locale]/layout.tsx`), inside `NextIntlClientProvider` after `<ConsentBanner />`:

```tsx
<MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
<AttributionCapture />
```

Service landing page: add `<TrackViewContent name={s.title} category={s.contactType} />` inside `PageShell`.

Thanks page: accept `searchParams: Promise<{ e?: string }>` and render `<TrackLead eventId={(await searchParams).e} />`.

- [ ] **Step 10: Manual check with Meta Test Events**

With `META_TEST_EVENT_CODE` set and a real Pixel ID in `.env.local`: open `/servicios/tiendas-online?utm_source=facebook&utm_campaign=test&fbclid=TEST` → accept cookies → Events Manager "Test events" shows `PageView` and `ViewContent`; submit the form → `Lead` appears from **Browser** and **Server** with the same event ID (deduplicated); the contact in `/admin` shows `utmCampaign=test`. Repeat in a private window clicking **Reject** → no Meta request in the Network tab (`connect.facebook.net`, `graph.facebook.com` from server logs), contact saved without UTM fields.

- [ ] **Step 11: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(tracking): add consent-gated Meta Pixel, Conversions API Lead and campaign attribution"
```
