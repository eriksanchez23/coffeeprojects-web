# T11 — Contact: form, Server Action, Turnstile, rate limit, emails, thank-you page

**Files:**
- Create: `src/features/contact/schema.ts`, `src/features/contact/handle-contact.ts`, `src/features/contact/rate-limit.ts`, `src/features/contact/turnstile.ts`, `src/features/contact/emails.ts`, `src/features/contact/action.ts`, `src/components/contact/contact-form.tsx`, `src/components/contact/turnstile-widget.tsx`, `src/app/(frontend)/[locale]/contact/page.tsx`, `src/app/(frontend)/[locale]/contact/thanks/page.tsx`
- Test: `tests/unit/contact-schema.test.ts`, `tests/unit/handle-contact.test.ts`, `tests/unit/contact-emails.test.ts`

**Interfaces:**
- Consumes: `projectTypes/budgets/timelines` (T04), `Contacts` collection (T04), `payloadClient` (T06), `PageShell` (T07), `buildPath`, `localizedPaths` (T03/T06), `messages.contact.*` (T03).
- Produces:
  - `contactSchema` (zod) + `type ContactInput`; error messages are **message keys** (`required`, `invalidEmail`, `tooShort`, `tooLong`, `privacy`) resolved by the form via `t('errors.<key>')`
  - `formDataToObject(fd: FormData): Record<string, unknown>`
  - `handleContact(raw, deps): Promise<ContactResult>` where
    `type ContactResult = { status: 'ok'; saved: boolean; eventId: string } | { status: 'error'; fieldErrors?: Partial<Record<keyof ContactInput, string>>; formError?: 'captcha' | 'rateLimited' | 'generic' }`
    and `deps = { verifyCaptcha(token: string): Promise<boolean>; isRateLimited(): Promise<boolean>; createContact(data: ContactInput & { ipHash: string }): Promise<void>; notify(input: ContactInput): Promise<void>; afterSave?(input: ContactInput, eventId: string): Promise<void>; newEventId(): string; ipHash: string; log(e: unknown): void }`
  - `submitContact(prev: ContactResult | null, fd: FormData): Promise<ContactResult>` (Server Action; redirects on success)
  - `hashIp(ip: string, salt: string): string`
  - Thank-you URL carries `?e=<eventId>` (consumed by T12 for Pixel dedup)

- [ ] **Step 1: Failing tests**

`tests/unit/contact-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { contactSchema } from '@/features/contact/schema'

const valid = {
  name: 'Ana',
  email: 'ana@example.com',
  projectType: 'web',
  message: 'Necesito una web para mi negocio de cafetería.',
  privacy: true,
  marketingConsent: false,
  nda: false,
  locale: 'es',
  sourcePath: '/contacto',
}

describe('contactSchema', () => {
  it('accepts a minimal valid submission', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })
  it('returns message keys, not text', () => {
    const r = contactSchema.safeParse({ ...valid, email: 'nope', message: 'short' })
    expect(r.success).toBe(false)
    const issues = Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path[0], i.message]))
    expect(issues).toMatchObject({ email: 'invalidEmail', message: 'tooShort' })
  })
  it('requires privacy acceptance', () => {
    const r = contactSchema.safeParse({ ...valid, privacy: false })
    expect(r.error?.issues[0]?.message).toBe('privacy')
  })
  it('rejects unknown project types', () => {
    expect(contactSchema.safeParse({ ...valid, projectType: 'hack' }).success).toBe(false)
  })
  it('trims and caps the message at 2000 chars', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'x'.repeat(2001) }).error?.issues[0]?.message).toBe('tooLong')
  })
})
```

`tests/unit/handle-contact.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { handleContact } from '@/features/contact/handle-contact'

const base = {
  name: 'Ana',
  email: 'ana@example.com',
  projectType: 'ecommerce',
  message: 'Quiero una tienda online para vender café de especialidad.',
  privacy: 'on',
  locale: 'es',
  sourcePath: '/contacto',
  turnstileToken: 'tok',
  website: '',
}

function deps(over: Partial<Parameters<typeof handleContact>[1]> = {}) {
  return {
    verifyCaptcha: vi.fn().mockResolvedValue(true),
    isRateLimited: vi.fn().mockResolvedValue(false),
    createContact: vi.fn().mockResolvedValue(undefined),
    notify: vi.fn().mockResolvedValue(undefined),
    afterSave: vi.fn().mockResolvedValue(undefined),
    newEventId: () => 'evt-1',
    ipHash: 'hash',
    log: vi.fn(),
    ...over,
  }
}

describe('handleContact', () => {
  it('silently accepts but does not save when the honeypot is filled', async () => {
    const d = deps()
    const r = await handleContact({ ...base, website: 'http://spam' }, d)
    expect(r).toEqual({ status: 'ok', saved: false, eventId: 'evt-1' })
    expect(d.createContact).not.toHaveBeenCalled()
  })

  it('returns field errors for invalid input', async () => {
    const r = await handleContact({ ...base, email: 'bad' }, deps())
    expect(r).toMatchObject({ status: 'error', fieldErrors: { email: 'invalidEmail' } })
  })

  it('rejects a failed captcha', async () => {
    const r = await handleContact(base, deps({ verifyCaptcha: vi.fn().mockResolvedValue(false) }))
    expect(r).toEqual({ status: 'error', formError: 'captcha' })
  })

  it('blocks the 6th request in an hour from the same IP', async () => {
    const d = deps({ isRateLimited: vi.fn().mockResolvedValue(true) })
    const r = await handleContact(base, d)
    expect(r).toEqual({ status: 'error', formError: 'rateLimited' })
    expect(d.createContact).not.toHaveBeenCalled()
  })

  it('saves, notifies and runs afterSave on success', async () => {
    const d = deps()
    const r = await handleContact(base, d)
    expect(r).toEqual({ status: 'ok', saved: true, eventId: 'evt-1' })
    expect(d.createContact).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@example.com', projectType: 'ecommerce', privacy: true, ipHash: 'hash' }))
    expect(d.notify).toHaveBeenCalledOnce()
    expect(d.afterSave).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@example.com' }), 'evt-1')
  })

  it('still succeeds when notification email fails', async () => {
    const d = deps({ notify: vi.fn().mockRejectedValue(new Error('resend down')) })
    const r = await handleContact(base, d)
    expect(r).toMatchObject({ status: 'ok', saved: true })
    expect(d.log).toHaveBeenCalled()
  })

  it('returns a generic error when saving fails', async () => {
    const r = await handleContact(base, deps({ createContact: vi.fn().mockRejectedValue(new Error('db')) }))
    expect(r).toEqual({ status: 'error', formError: 'generic' })
  })
})
```

`tests/unit/contact-emails.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { clientEmail, teamEmail } from '@/features/contact/emails'

const input = {
  name: '<script>alert(1)</script>',
  email: 'ana@example.com',
  projectType: 'web' as const,
  message: 'Hola & <b>adiós</b>',
  privacy: true,
  marketingConsent: false,
  nda: true,
  locale: 'fr' as const,
  sourcePath: '/fr/contact',
}

describe('emails', () => {
  it('escapes user content in the team email', () => {
    const { html, subject } = teamEmail(input)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp; &lt;b&gt;')
    expect(subject).toContain('web')
    expect(html).toContain('NDA')
  })
  it('writes the client auto-reply in the client locale', () => {
    expect(clientEmail(input).subject).toMatch(/demande/i)
    expect(clientEmail({ ...input, locale: 'en' }).subject).toMatch(/request/i)
    expect(clientEmail({ ...input, locale: 'es' }).subject).toMatch(/solicitud/i)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/contact-schema.test.ts tests/unit/handle-contact.test.ts tests/unit/contact-emails.test.ts
```

- [ ] **Step 3: Schema `src/features/contact/schema.ts`**

```ts
import { z } from 'zod'
import { budgets, projectTypes, timelines } from './options'

const checkbox = z.preprocess((v) => v === true || v === 'on' || v === 'true', z.boolean())
const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().trim().max(max, 'tooLong').optional())

export const contactSchema = z.object({
  name: z.string({ message: 'required' }).trim().min(1, 'required').max(100, 'tooLong'),
  email: z.string({ message: 'required' }).trim().email('invalidEmail').max(200, 'tooLong'),
  phone: optionalText(30),
  projectType: z.enum(projectTypes, { message: 'required' }),
  budget: z.preprocess((v) => (v === '' ? undefined : v), z.enum(budgets).optional()),
  timeline: z.preprocess((v) => (v === '' ? undefined : v), z.enum(timelines).optional()),
  message: z.string({ message: 'required' }).trim().min(20, 'tooShort').max(2000, 'tooLong'),
  howFound: optionalText(200),
  nda: checkbox.default(false),
  privacy: checkbox.refine((v) => v === true, 'privacy'),
  marketingConsent: checkbox.default(false),
  locale: z.enum(['es', 'en', 'fr']),
  sourcePath: z.string().max(300).default('/'),
})

export type ContactInput = z.infer<typeof contactSchema>

export function formDataToObject(fd: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  fd.forEach((value, key) => {
    obj[key === 'cf-turnstile-response' ? 'turnstileToken' : key] = typeof value === 'string' ? value : ''
  })
  return obj
}
```

- [ ] **Step 4: Core logic `src/features/contact/handle-contact.ts`**

```ts
import { type ContactInput, contactSchema } from './schema'

export type ContactResult =
  | { status: 'ok'; saved: boolean; eventId: string }
  | { status: 'error'; fieldErrors?: Partial<Record<keyof ContactInput, string>>; formError?: 'captcha' | 'rateLimited' | 'generic' }

export type ContactDeps = {
  verifyCaptcha(token: string): Promise<boolean>
  isRateLimited(): Promise<boolean>
  createContact(data: ContactInput & { ipHash: string }): Promise<void>
  notify(input: ContactInput): Promise<void>
  afterSave?(input: ContactInput, eventId: string): Promise<void>
  newEventId(): string
  ipHash: string
  log(e: unknown): void
}

export async function handleContact(raw: Record<string, unknown>, deps: ContactDeps): Promise<ContactResult> {
  const eventId = deps.newEventId()

  // Honeypot: bots fill hidden fields. Pretend success so they don't retry.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') return { status: 'ok', saved: false, eventId }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ContactInput, string>> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactInput
      fieldErrors[key] ??= issue.message
    }
    return { status: 'error', fieldErrors }
  }
  const input = parsed.data

  if (!(await deps.verifyCaptcha(String(raw.turnstileToken ?? '')))) return { status: 'error', formError: 'captcha' }
  if (await deps.isRateLimited()) return { status: 'error', formError: 'rateLimited' }

  try {
    await deps.createContact({ ...input, ipHash: deps.ipHash })
  } catch (e) {
    deps.log(e)
    return { status: 'error', formError: 'generic' }
  }

  // Side effects after a successful save must never turn the submission into an error.
  await Promise.allSettled([deps.notify(input), deps.afterSave?.(input, eventId)]).then((results) =>
    results.forEach((r) => r.status === 'rejected' && deps.log(r.reason)),
  )

  return { status: 'ok', saved: true, eventId }
}
```

- [ ] **Step 5: Emails `src/features/contact/emails.ts`**

```ts
import type { ContactInput } from './schema'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export function teamEmail(i: ContactInput) {
  const rows: [string, string | undefined][] = [
    ['Nombre', i.name],
    ['Email', i.email],
    ['Teléfono', i.phone],
    ['Tipo', i.projectType],
    ['Presupuesto', i.budget],
    ['Plazo', i.timeline],
    ['Cómo nos conoció', i.howFound],
    ['NDA', i.nda ? 'Sí, quiere firmar NDA' : 'No'],
    ['Idioma', i.locale],
    ['Página', i.sourcePath],
  ]
  const table = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b5d4f">${k}</td><td>${esc(String(v))}</td></tr>`)
    .join('')
  return {
    subject: `Nueva solicitud (${i.projectType}) — ${i.name}`.slice(0, 140),
    html: `<h2>Nueva solicitud desde coffeeprojects.es</h2><table>${table}</table><h3>Mensaje</h3><p style="white-space:pre-wrap">${esc(i.message)}</p><p>Gestiónala en el panel: /admin/collections/contacts</p>`,
  }
}

const copy = {
  es: { subject: 'Hemos recibido tu solicitud — coffeeProjects', hi: 'Hola', body: 'Gracias por contarnos tu proyecto. En menos de 24 horas te escribiremos con una primera propuesta.', sign: 'El equipo de coffeeProjects' },
  en: { subject: "We've received your request — coffeeProjects", hi: 'Hi', body: "Thanks for telling us about your project. We'll get back to you within 24 hours with a first proposal.", sign: 'The coffeeProjects team' },
  fr: { subject: 'Nous avons bien reçu votre demande — coffeeProjects', hi: 'Bonjour', body: 'Merci de nous avoir présenté votre projet. Nous vous répondrons en moins de 24 heures avec une première proposition.', sign: "L'équipe coffeeProjects" },
} as const

export function clientEmail(i: ContactInput) {
  const c = copy[i.locale]
  return {
    subject: c.subject,
    html: `<p>${c.hi} ${esc(i.name)},</p><p>${c.body}</p><p>— ${c.sign}<br/><a href="https://coffeeprojects.es">coffeeprojects.es</a></p>`,
  }
}
```

- [ ] **Step 6: Run — expect PASS**

```bash
pnpm vitest run tests/unit/contact-schema.test.ts tests/unit/handle-contact.test.ts tests/unit/contact-emails.test.ts
```

- [ ] **Step 7: Infra adapters**

`src/features/contact/rate-limit.ts`:

```ts
import 'server-only'
import { createHash } from 'node:crypto'
import type { Payload } from 'payload'

export const MAX_PER_HOUR = 5

export function hashIp(ip: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

export async function isRateLimited(payload: Payload, ipHash: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { totalDocs } = await payload.count({
    collection: 'contacts',
    where: { and: [{ ipHash: { equals: ipHash } }, { createdAt: { greater_than: since } }] },
    overrideAccess: true,
  })
  return totalDocs >= MAX_PER_HOUR
}
```

`src/features/contact/turnstile.ts`:

```ts
import 'server-only'

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret || !token) return false
  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
    const data = (await res.json()) as { success: boolean }
    return data.success === true
  } catch {
    return false
  }
}
```

`src/features/contact/action.ts`:

```ts
'use server'
import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import { payloadClient } from '@/lib/cms/client'
import { clientEmail, teamEmail } from './emails'
import { type ContactResult, handleContact } from './handle-contact'
import { hashIp, isRateLimited } from './rate-limit'
import { formDataToObject } from './schema'
import { verifyTurnstile } from './turnstile'

export async function submitContact(_prev: ContactResult | null, fd: FormData): Promise<ContactResult> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || '0.0.0.0'
  const payload = await payloadClient()
  const ipHash = hashIp(ip, process.env.IP_HASH_SALT ?? '')
  const raw = formDataToObject(fd)

  const result = await handleContact(raw, {
    ipHash,
    newEventId: randomUUID,
    log: (e) => payload.logger.error({ err: e }, 'contact submission side effect failed'),
    verifyCaptcha: (token) => verifyTurnstile(token, ip),
    isRateLimited: () => isRateLimited(payload, ipHash),
    createContact: async (data) => {
      const { privacy, ...rest } = data
      await payload.create({
        collection: 'contacts',
        overrideAccess: true,
        data: { ...rest, privacyAccepted: privacy, ndaRequested: data.nda, status: 'new' },
      })
    },
    notify: async (input) => {
      const team = teamEmail(input)
      const client = clientEmail(input)
      await Promise.all([
        payload.sendEmail({ to: process.env.CONTACT_NOTIFY_EMAIL ?? 'contact@coffeeprojects.es', replyTo: input.email, ...team }),
        payload.sendEmail({ to: input.email, ...client }),
      ])
    },
  })

  if (result.status === 'ok') {
    const locale = (raw.locale as Locale) ?? 'es'
    redirect(`${buildPath('/contact/thanks', locale)}?e=${encodeURIComponent(result.eventId)}`)
  }
  return result
}
```

> `data` passed to `payload.create` must match the `Contact` type: if TypeScript complains about the extra `nda` key, destructure it out (`const { privacy, nda, ...rest } = data`).

- [ ] **Step 8: Form UI**

`src/components/contact/turnstile-widget.tsx`:

```tsx
'use client'
import Script from 'next/script'

export function TurnstileWidget({ siteKey, locale }: { siteKey: string; locale: string }) {
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      {/* Implicit rendering adds a hidden `cf-turnstile-response` input inside the surrounding form. */}
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="dark" data-language={locale} data-size="flexible" />
    </>
  )
}
```

`src/components/contact/contact-form.tsx`:

```tsx
'use client'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { buttonClasses } from '@/components/ui/button'
import { submitContact } from '@/features/contact/action'
import type { ContactResult } from '@/features/contact/handle-contact'
import { budgets, projectTypes, timelines } from '@/features/contact/options'
import { readConsentFromDocument } from '@/features/tracking/consent'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { TurnstileWidget } from './turnstile-widget'

type Prefill = { name?: string; email?: string; type?: string }

const field = 'w-full rounded-[var(--radius-md)] border border-line-hi bg-bg-1 px-4 py-3 text-ink-0 placeholder:text-ink-3 focus:border-amber aria-[invalid=true]:border-berry'

export function ContactForm({ locale, sourcePath, prefill, siteKey }: { locale: string; sourcePath: string; prefill: Prefill; siteKey: string }) {
  const t = useTranslations('contact')
  const [state, action, pending] = useActionState<ContactResult | null, FormData>(async (prev, fd) => {
    fd.set('marketingConsent', String(readConsentFromDocument()?.marketing ?? false))
    return submitContact(prev, fd)
  }, null)
  const errors = state?.status === 'error' ? (state.fieldErrors ?? {}) : {}
  const err = (k: keyof typeof errors) =>
    errors[k] ? (
      <p id={`${k}-error`} className="mt-1 text-sm text-berry">
        {t(`errors.${errors[k]}` as never)}
      </p>
    ) : null
  const aria = (k: keyof typeof errors) => ({ 'aria-invalid': Boolean(errors[k]), 'aria-describedby': errors[k] ? `${k}-error` : undefined })
  const defaultType = projectTypes.includes(prefill.type as never) ? prefill.type : 'web'

  return (
    <form action={action} noValidate className="grid gap-5" aria-describedby={state?.status === 'error' && state.formError ? 'form-error' : undefined}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      {/* Honeypot: hidden from humans and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm text-ink-1">{t('name')} *</label>
          <input id="name" name="name" required autoComplete="name" defaultValue={prefill.name} className={field} {...aria('name')} />
          {err('name')}
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-ink-1">{t('email')} *</label>
          <input id="email" name="email" type="email" required autoComplete="email" defaultValue={prefill.email} className={field} {...aria('email')} />
          {err('email')}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="projectType" className="mb-2 block text-sm text-ink-1">{t('projectType')} *</label>
          <select id="projectType" name="projectType" defaultValue={defaultType} className={field} {...aria('projectType')}>
            {projectTypes.map((p) => (
              <option key={p} value={p}>{t(`projectTypes.${p}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="budget" className="mb-2 block text-sm text-ink-1">{t('budget')}</label>
          <select id="budget" name="budget" defaultValue="" className={field}>
            <option value="">—</option>
            {budgets.map((b) => (
              <option key={b} value={b}>{t(`budgets.${b}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="timeline" className="mb-2 block text-sm text-ink-1">{t('timeline')}</label>
          <select id="timeline" name="timeline" defaultValue="" className={field}>
            <option value="">—</option>
            {timelines.map((x) => (
              <option key={x} value={x}>{t(`timelines.${x}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm text-ink-1">{t('message')} *</label>
        <textarea id="message" name="message" required rows={6} maxLength={2000} className={field} {...aria('message')} />
        <p className="mt-1 text-xs text-ink-3">{t('messageHint')}</p>
        {err('message')}
      </div>

      <details className="rounded-[var(--radius-md)] border border-line p-4">
        <summary className="cursor-pointer text-sm text-ink-1">+ {t('phone')} · {t('howFound')} · NDA</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm text-ink-1">{t('phone')}</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" className={field} />
          </div>
          <div>
            <label htmlFor="howFound" className="mb-2 block text-sm text-ink-1">{t('howFound')}</label>
            <input id="howFound" name="howFound" className={field} />
          </div>
          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <input type="checkbox" name="nda" className="accent-amber" /> {t('nda')}
          </label>
        </div>
      </details>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="privacy" required className="mt-1 accent-amber" {...aria('privacy')} />
        <span>
          {t.rich('privacy', { link: (chunks) => <Link href="/privacy" className="text-amber underline">{chunks}</Link> })} *
        </span>
      </label>
      {err('privacy')}

      <TurnstileWidget siteKey={siteKey} locale={locale} />

      {state?.status === 'error' && state.formError && (
        <p id="form-error" role="alert" className="rounded-[var(--radius-md)] border border-berry/50 bg-berry/10 p-4 text-sm text-ink-0">
          {t(`errors.${state.formError}`)}
        </p>
      )}

      <button type="submit" disabled={pending} className={cn(buttonClasses({ size: 'lg' }), 'w-full sm:w-auto')}>
        {pending ? t('sending') : t('submit')}
      </button>
      <p className="font-mono text-xs text-ink-3">{t('guarantees')}</p>
    </form>
  )
}
```

- [ ] **Step 9: Pages**

`src/app/(frontend)/[locale]/contact/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { ContactForm } from '@/components/contact/contact-form'
import { Container } from '@/components/ui/container'
import { GlassCard } from '@/components/ui/glass-card'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getSettings } from '@/lib/cms/queries'

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const sp = await searchParams
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 200)
  const [t, settings] = await Promise.all([getTranslations('contact'), getSettings(locale)])
  const alternates = localizedPaths('/contact')

  return (
    <PageShell locale={locale} alternates={alternates} hideMobileCta>
      <section className="steam-glow pt-20 pb-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">// contact</p>
            <h1 className="mt-4 text-5xl font-semibold sm:text-6xl">{t('title')}</h1>
            <p className="mt-6 text-lg text-ink-2">{t('lead')}</p>
            <GlassCard className="mt-10 space-y-3 text-sm">
              <a href={`mailto:${settings.contactEmail}`} className="block font-display text-xl text-ink-0 hover:text-amber" data-track="contact-email">
                {settings.contactEmail}
              </a>
              <p className="text-ink-2">{t('replyBy')}</p>
            </GlassCard>
          </div>
          <GlassCard className="p-6 sm:p-10">
            <ContactForm
              locale={locale}
              sourcePath={alternates[locale]}
              prefill={{ name: one(sp.name), email: one(sp.email), type: one(sp.type) }}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
            />
          </GlassCard>
        </Container>
      </section>
    </PageShell>
  )
}
```

`src/app/(frontend)/[locale]/contact/thanks/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ThanksPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const t = await getTranslations('thanks')
  return (
    <PageShell locale={locale} alternates={localizedPaths('/contact/thanks')} hideMobileCta>
      <section className="steam-glow grid min-h-[70vh] place-items-center py-24 text-center">
        <Container className="max-w-2xl">
          <p aria-hidden className="text-6xl">☕</p>
          <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">{t('title')}</h1>
          <p className="mt-6 text-lg text-ink-2">{t('body')}</p>
          <Button href="/projects" size="lg" className="mt-10">{t('cta')}</Button>
        </Container>
      </section>
    </PageShell>
  )
}
```

- [ ] **Step 10: Manual check (dev uses Turnstile test keys → always passes)**

`pnpm dev`, submit `/contacto` empty → localized field errors; submit valid → redirected to `/contacto/gracias?e=<uuid>`; a `Contact request` appears in `/admin` with status `new`; team + client emails arrive (or Payload logs an email error without breaking the flow if `RESEND_API_KEY` is empty); submit 6 times → 6th shows the rate-limit message; `/en/contact` submit → client email in English.

- [ ] **Step 11: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(contact): add validated contact flow with Turnstile, rate limit, emails and thank-you page"
```
