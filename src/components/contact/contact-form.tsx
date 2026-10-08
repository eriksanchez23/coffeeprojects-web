'use client'
import { useTranslations } from 'next-intl'
import { type FormEvent, useActionState, useEffect, useRef, useState } from 'react'
import { buttonClasses } from '@/components/ui/button'
import { submitContact } from '@/features/contact/action'
import type { ContactResult } from '@/features/contact/handle-contact'
import { type ProjectType, projectTypes } from '@/features/contact/options'
import type { QuoteLine } from '@/features/contact/quote'
import { readConsentFromDocument } from '@/features/tracking/consent'
import { Link } from '@/i18n/navigation'
import { clsx } from 'clsx'
import { TurnstileWidget } from './turnstile-widget'

// `plan` is a pricing package slug the page already validated against the pricing global.
type Prefill = { type?: string; plan?: string }

// React resets uncontrolled fields after every action, so the submitted values travel in the
// state and feed `defaultValue`s: a failed submit never wipes what the visitor typed.
type FormState = { result: ContactResult | null; values: Record<string, string>; attempt: number }
const initialState: FormState = { result: null, values: {}, attempt: 0 }

const field =
  'w-full rounded-[var(--radius-md)] border border-line-hi bg-bg-1 px-4 py-3 text-ink-0 placeholder:text-ink-3 focus:border-amber aria-[invalid=true]:border-berry'
const label = 'mb-2 block text-sm text-ink-1'

export function ContactForm({
  locale,
  sourcePath,
  prefill,
  quotes,
  siteKey,
}: {
  locale: string
  sourcePath: string
  prefill: Prefill
  /**
   * Final price (VAT included) and estimated time per project type, formatted on the server (S17).
   * Display only: the Server Action rebuilds the summary it stores from the CMS.
   */
  quotes: Partial<Record<ProjectType, QuoteLine[]>>
  siteKey: string
}) {
  const t = useTranslations('contact')
  const formRef = useRef<HTMLFormElement>(null)
  // Turnstile (~140 KB incl. its challenge frame) loads on the first interaction with the form, not with the page,
  // so it never delays the first paint; the token is ready long before a visitor has filled the form in.
  const [verifying, setVerifying] = useState(false)
  const startVerifying = () => setVerifying(true)
  // A submit that beats the Turnstile token waits for it here instead of failing on the server with `captcha`.
  const [awaitingToken, setAwaitingToken] = useState(false)
  const [tokenTimedOut, setTokenTimedOut] = useState(false)
  const readToken = () =>
    formRef.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? ''
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!siteKey || readToken()) return
    e.preventDefault()
    setTokenTimedOut(false)
    setVerifying(true)
    setAwaitingToken(true)
  }
  useEffect(() => {
    if (!awaitingToken) return
    const startedAt = Date.now()
    const id = window.setInterval(() => {
      const token = readToken()
      // Give up after 15 s and show the same captcha error the server would return.
      if (token || Date.now() - startedAt > 15_000) {
        window.clearInterval(id)
        setAwaitingToken(false)
        if (token) formRef.current?.requestSubmit()
        else setTokenTimedOut(true)
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [awaitingToken])
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    fd.set('marketingConsent', String(readConsentFromDocument()?.marketing ?? false))
    const values: Record<string, string> = {}
    fd.forEach((v, k) => {
      if (typeof v === 'string' && k !== 'cf-turnstile-response' && !k.startsWith('$ACTION')) values[k] = v
    })
    const result = await submitContact(prev.result, fd)
    return { result, values, attempt: prev.attempt + 1 }
  }, initialState)

  const { result, values } = state
  const errors = result?.status === 'error' ? (result.fieldErrors ?? {}) : {}
  const formError = tokenTimedOut ? 'captcha' : result?.status === 'error' ? result.formError : undefined

  // After a failed submit move focus to the first invalid field, or to the form-level alert.
  useEffect(() => {
    if (result?.status !== 'error' && !tokenTimedOut) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], #form-error')?.focus()
  }, [result, tokenTimedOut])

  const err = (k: keyof typeof errors) =>
    errors[k] ? (
      <p id={`${k}-error`} className="mt-1 text-sm text-berry">
        {t(`errors.${errors[k]}` as never)}
      </p>
    ) : null
  const aria = (k: keyof typeof errors) => ({
    'aria-invalid': Boolean(errors[k]),
    'aria-describedby': errors[k] ? `${k}-error` : undefined,
  })
  const initialType = values.projectType ?? prefill.type
  const defaultType = projectTypes.find((p) => p === initialType) ?? 'web'
  const [selectedType, setSelectedType] = useState<ProjectType>(defaultType)
  const quote = quotes[selectedType] ?? []

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="grid gap-5"
      onFocus={startVerifying}
      onPointerDown={startVerifying}
      onTouchStart={startVerifying}
      onSubmit={onSubmit}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      {prefill.plan && <input type="hidden" name="plan" value={prefill.plan} />}
      {/* Honeypot: hidden from humans and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="cp_hp">{t('honeypot')}</label>
        <input id="cp_hp" name="cp_hp" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>{t('name')} *</label>
          <input id="name" name="name" required autoComplete="name" defaultValue={values.name} className={field} {...aria('name')} />
          {err('name')}
        </div>
        <div>
          <label htmlFor="email" className={label}>{t('email')} *</label>
          <input id="email" name="email" type="email" required autoComplete="email" defaultValue={values.email} className={field} {...aria('email')} />
          {err('email')}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="projectType" className={label}>{t('projectType')} *</label>
          <select
            id="projectType"
            name="projectType"
            defaultValue={defaultType}
            onChange={(e) => setSelectedType(projectTypes.find((p) => p === e.target.value) ?? 'web')}
            className={field}
            aria-invalid={Boolean(errors.projectType)}
            aria-describedby={errors.projectType ? 'projectType-error quote-summary' : 'quote-summary'}
          >
            {projectTypes.map((p) => (
              <option key={p} value={p}>{t(`projectTypes.${p}`)}</option>
            ))}
          </select>
          {err('projectType')}
        </div>
        {/* Read-only: what this project type costs (VAT included) and how long it usually takes. */}
        <section
          aria-labelledby="quote-title"
          className="rounded-[var(--radius-md)] border border-line-amber bg-bg-2 p-4"
          data-testid="quote-summary"
        >
          <h2 id="quote-title" className="font-mono text-xs uppercase tracking-widest text-amber">{t('quote.title')}</h2>
          <dl id="quote-summary" aria-live="polite" aria-atomic="true" className="mt-3 grid gap-1.5 text-sm">
            {quote.map((line, i) => (
              <div
                key={line.label}
                className="flex flex-wrap items-baseline justify-between gap-x-3"
                data-testid={prefill.plan && i === 0 ? 'selected-plan' : undefined}
              >
                <dt className="text-ink-2">{line.label}</dt>
                <dd className="font-display text-base text-ink-0">{line.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-ink-3">{t('quote.vat')}. {t('quote.hint')}</p>
        </section>
      </div>

      <div>
        <label htmlFor="message" className={label}>{t('message')} *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={2000}
          defaultValue={values.message}
          className={field}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-hint message-error' : 'message-hint'}
        />
        <p id="message-hint" className="mt-1 text-xs text-ink-3">{t('messageHint')}</p>
        {err('message')}
      </div>

      <details className="rounded-[var(--radius-md)] border border-line p-4" open={Boolean(values.phone || values.howFound || values.nda)}>
        <summary className="cursor-pointer text-sm text-ink-1">+ {t('moreDetails')}</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={label}>{t('phone')}</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={values.phone} className={field} {...aria('phone')} />
            {err('phone')}
          </div>
          <div>
            <label htmlFor="howFound" className={label}>{t('howFound')}</label>
            <input id="howFound" name="howFound" defaultValue={values.howFound} className={field} {...aria('howFound')} />
            {err('howFound')}
          </div>
          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <input type="checkbox" name="nda" defaultChecked={Boolean(values.nda)} className="accent-amber" /> {t('nda')}
          </label>
        </div>
      </details>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="privacy" required defaultChecked={Boolean(values.privacy)} className="mt-1 accent-amber" {...aria('privacy')} />
          <span>
            {t.rich('privacy', { link: (chunks) => <Link href="/privacy" className="text-amber underline">{chunks}</Link> })} *
          </span>
        </label>
        {err('privacy')}
      </div>

      {/* Space reserved for the widget so it never shifts the layout when it appears. */}
      <div className="min-h-[65px]">
        {verifying && <TurnstileWidget key={state.attempt} siteKey={siteKey} locale={locale} />}
      </div>

      {formError && (
        <p id="form-error" role="alert" tabIndex={-1} className="rounded-[var(--radius-md)] border border-berry/50 bg-berry/10 p-4 text-sm text-ink-0">
          {t(`errors.${formError}`)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || awaitingToken}
        aria-busy={pending || awaitingToken}
        className={clsx(buttonClasses({ size: 'lg' }), 'w-full sm:w-auto')}
      >
        {pending ? t('sending') : awaitingToken ? t('verifying') : t('submit')}
      </button>
      <p className="font-mono text-xs text-ink-3">{t('guarantees')}</p>
    </form>
  )
}
