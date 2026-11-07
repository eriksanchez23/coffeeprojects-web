'use client'
import { useTranslations } from 'next-intl'
import { type FormEvent, useActionState, useEffect, useRef, useState } from 'react'
import { buttonClasses } from '@/components/ui/button'
import { submitContact } from '@/features/contact/action'
import type { ContactResult } from '@/features/contact/handle-contact'
import { type ProjectType, isExistingSiteType, projectTypes, websiteIssues } from '@/features/contact/options'
import type { QuoteLine } from '@/features/contact/quote'
import { readConsentFromDocument } from '@/features/tracking/consent'
import { Link } from '@/i18n/navigation'
import { clsx } from 'clsx'
import { type PlanInfo, PlanInfoCard } from './plan-info'
import { type MaintenanceCard, MaintenancePicker, type WebPlanCard, WebPlanPicker } from './plan-picker'
import { TurnstileWidget } from './turnstile-widget'

// `plan` is a pricing package slug the page already validated against the pricing global.
type Prefill = { type?: string; plan?: string; url?: string }

/**
 * A web plan of the "new website" picker: its card (prices VAT excluded), the maintenance plans that unlock its
 * reduced price, and the VAT-included summary for each choice. Built on the server from the pricing global.
 */
export type WebPlanOption = {
  slug: string
  contactType: ProjectType
  card: WebPlanCard
  defaultMaintenance: string
  info: PlanInfo
  maintenance: { slug: string; card: MaintenanceCard; quote: QuoteLine[]; info: PlanInfo }[]
  none: { card: MaintenanceCard; quote: QuoteLine[]; info: PlanInfo }
}

type Path = 'web' | 'existing' | 'other'
const otherTypes = projectTypes.filter((p) => p !== 'web' && !isExistingSiteType(p))
const pathOf = (type: ProjectType): Path => (type === 'web' ? 'web' : isExistingSiteType(type) ? 'existing' : 'other')

// React resets uncontrolled fields after every action, so the submitted values travel in the
// state and feed `defaultValue`s: a failed submit never wipes what the visitor typed.
type FormState = { result: ContactResult | null; values: Record<string, string>; attempt: number }
const initialState: FormState = { result: null, values: {}, attempt: 0 }

const field =
  'w-full rounded-[var(--radius-md)] border border-line-hi bg-bg-1 px-4 py-3 text-ink-0 placeholder:text-ink-3 focus:border-brand aria-[invalid=true]:border-berry'
const label = 'mb-2 block text-sm font-medium text-ink-1'

export function ContactForm({
  locale,
  sourcePath,
  prefill,
  quotes,
  webOptions = [],
  pricingHref,
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
  webOptions?: WebPlanOption[]
  /** The pricing page in this locale, for the "see every plan" link. */
  pricingHref?: string
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
    values.websiteIssues = fd.getAll('websiteIssues').filter((v) => typeof v === 'string').join(',')
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
  // A plan from the pricing page (an online store or a custom plan included) always opens the "new website" path.
  const initialPlan = values.plan ?? prefill.plan ?? ''
  const prefilledPlan = webOptions.some((o) => o.slug === initialPlan)
  const submittedPath = (['web', 'existing', 'other'] as const).find((p) => p === values.path)
  const [path, setPath] = useState<Path>(submittedPath ?? (prefilledPlan ? 'web' : pathOf(defaultType)))
  const [otherType, setOtherType] = useState<ProjectType>(pathOf(defaultType) === 'other' ? defaultType : 'ecommerce')
  const [existingType, setExistingType] = useState<ProjectType>(defaultType === 'audit' ? 'audit' : 'redesign')
  // "New website": the type of website (a pricing plan) and, for it, a maintenance plan or none.
  const [planSlug, setPlanSlug] = useState(prefilledPlan ? initialPlan : '')
  const option = webOptions.find((o) => o.slug === planSlug)
  const [maintenance, setMaintenance] = useState(values.maintenance ?? option?.defaultMaintenance ?? 'none')
  const maintenanceChoice =
    option && (maintenance === 'none' || option.maintenance.some((m) => m.slug === maintenance)) ? maintenance : (option?.defaultMaintenance ?? 'none')
  const choosePlan = (slug: string) => {
    setPlanSlug(slug)
    setMaintenance(webOptions.find((o) => o.slug === slug)?.defaultMaintenance ?? 'none')
  }
  const selectedType: ProjectType = path === 'web' ? (option?.contactType ?? 'web') : path === 'existing' ? existingType : otherType
  const maintenanceOption = option
    ? maintenanceChoice === 'none'
      ? option.none
      : (option.maintenance.find((m) => m.slug === maintenanceChoice) ?? option.none)
    : null
  const webQuote = maintenanceOption?.quote ?? null
  const quote = path === 'web' && webOptions.length > 0 ? (webQuote ?? []) : (quotes[selectedType] ?? [])
  const pickerLabels = { recommended: t('webPlan.recommended'), isNew: t('webPlan.new'), withMaintenance: t('webPlan.withLabel') }
  // The summary: what was chosen, then the "what you will pay" block (upfront web price, fees, total).
  const detailLines = quote.filter((l) => l.section !== 'payment')
  const paymentLines = quote.filter((l) => l.section === 'payment')
  const withFees = path === 'web' && Boolean(option) && maintenanceChoice !== 'none'
  const checkedIssues = new Set((values.websiteIssues ?? '').split(','))
  const pathCards: { value: Path; title: string; text: string }[] = [
    { value: 'web', title: t('paths.web.title'), text: t('paths.web.text') },
    { value: 'existing', title: t('paths.existing.title'), text: t('paths.existing.text') },
    { value: 'other', title: t('paths.other.title'), text: t('paths.other.text') },
  ]

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
      {/* Honeypot: hidden from humans and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="cp_hp">{t('honeypot')}</label>
        <input id="cp_hp" name="cp_hp" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink-0">{t('paths.legend')} *</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {pathCards.map((c) => (
            <label
              key={c.value}
              className="relative flex cursor-pointer flex-col rounded-[var(--radius-md)] border border-line-hi bg-bg-1 p-4 transition-colors has-[:checked]:border-brand has-[:checked]:bg-bg-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
            >
              <input type="radio" name="path" value={c.value} checked={path === c.value} onChange={() => setPath(c.value)} className="sr-only" />
              <span className="font-semibold text-ink-0">{c.title}</span>
              <span className="mt-1 text-xs text-ink-2">{c.text}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <input type="hidden" name="projectType" value={selectedType} />

      {path === 'other' && (
        <div>
          <label htmlFor="projectType-other" className={label}>{t('projectType')} *</label>
          <select
            id="projectType-other"
            value={selectedType}
            onChange={(e) => setOtherType(otherTypes.find((p) => p === e.target.value) ?? 'ecommerce')}
            className={field}
            aria-invalid={Boolean(errors.projectType)}
            aria-describedby={errors.projectType ? 'projectType-error' : undefined}
          >
            {otherTypes.map((p) => (
              <option key={p} value={p}>{t(`projectTypes.${p}`)}</option>
            ))}
          </select>
          {err('projectType')}
        </div>
      )}

      {path === 'web' && webOptions.length > 0 && (
        <div className="grid gap-5 rounded-[var(--radius-md)] border border-line p-4 sm:p-5">
          <WebPlanPicker
            legend={t('webPlan.label')}
            hint={t('webPlan.hint')}
            notSure={t('webPlan.placeholder')}
            plans={webOptions}
            value={planSlug}
            onChange={choosePlan}
            labels={pickerLabels}
          />
          {option && (
            <MaintenancePicker
              key={option.slug}
              legend={t('webPlan.maintenanceLabel')}
              hint={t('webPlan.maintenanceHint')}
              options={[...option.maintenance, { slug: 'none', card: option.none.card }]}
              value={maintenanceChoice}
              onChange={setMaintenance}
              labels={pickerLabels}
            />
          )}
          {option && maintenanceOption ? (
            <section aria-label={t('webPlan.detailsTitle')} className="grid gap-3 sm:grid-cols-2" data-testid="plan-details">
              <PlanInfoCard
                info={option.info}
                eyebrow={t('webPlan.yourWeb')}
                linkLabel={t('webPlan.seePlan')}
                newTab={t('webPlan.newTab')}
                notIncluded={t('webPlan.notIncluded')}
                testId="plan-info"
              />
              <PlanInfoCard
                info={maintenanceOption.info}
                eyebrow={t('webPlan.yourMaintenance')}
                linkLabel={maintenanceChoice === 'none' ? t('webPlan.compare') : t('webPlan.seeMaintenance')}
                newTab={t('webPlan.newTab')}
                notIncluded={t('webPlan.notIncluded')}
                testId="maintenance-info"
              />
            </section>
          ) : (
            pricingHref && <a href={pricingHref} target="_blank" rel="noopener" className="justify-self-start text-sm font-semibold text-brand underline-offset-4 hover:underline">
              {t('webPlan.allPlans')} <span aria-hidden>↗</span>
              <span className="sr-only"> ({t('webPlan.newTab')})</span>
            </a>
          )}
        </div>
      )}

      {path === 'existing' ? (
        <div className="grid gap-5">
          <div>
            <label htmlFor="currentUrl" className={label}>{t('currentUrl')} *</label>
            <input
              id="currentUrl"
              name="currentUrl"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="https://tuweb.com"
              defaultValue={values.currentUrl ?? prefill.url}
              className={field}
              {...aria('currentUrl')}
            />
            {err('currentUrl')}
          </div>
          <fieldset>
            <legend className={label}>{t('issuesLegend')}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {websiteIssues.map((issue) => (
                <label key={issue} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line px-3 py-2 text-sm has-[:checked]:border-brand">
                  <input type="checkbox" name="websiteIssues" value={issue} defaultChecked={checkedIssues.has(issue)} className="accent-[var(--color-brand)]" />
                  {t(`issues.${issue}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-start gap-3 rounded-[var(--radius-md)] border border-line-amber bg-bg-2 p-4 text-sm">
            <input
              type="checkbox"
              checked={selectedType === 'audit'}
              onChange={(e) => setExistingType(e.target.checked ? 'audit' : 'redesign')}
              className="mt-0.5 accent-[var(--color-brand)]"
            />
            <span>
              <strong className="text-ink-0">{t('auditOnly')}</strong>
              <span className="mt-0.5 block text-ink-2">{t('auditOnlyHint')}</span>
            </span>
          </label>
        </div>
      ) : (
        /* Read-only: what this project type costs (VAT included) and how long it usually takes. */
        <section
          aria-labelledby="quote-title"
          className="rounded-[var(--radius-md)] border border-line-amber bg-bg-2 p-4"
          data-testid="quote-summary"
        >
          <h2 id="quote-title" className="text-xs font-semibold uppercase tracking-wider text-amber">{t('quote.title')}</h2>
          {path === 'web' && webOptions.length > 0 && !option && <p className="mt-3 text-sm text-ink-2">{t('quote.pickPlan')}</p>}
          <div id="quote-summary" aria-live="polite" aria-atomic="true">
            <dl className="mt-3 grid gap-1.5 text-sm">
              {detailLines.map((line, i) => (
                <div
                  key={line.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-3"
                  data-testid={option && i === 0 ? 'selected-plan' : undefined}
                >
                  <dt className="text-ink-2">{line.label}</dt>
                  <dd className="text-base font-semibold text-ink-0">{line.value}</dd>
                </div>
              ))}
            </dl>
            {paymentLines.length > 0 && (
              <section aria-labelledby="payment-title" className="mt-4 rounded-[var(--radius-sm)] border border-line bg-bg-1 p-3.5" data-testid="quote-payment">
                <h3 id="payment-title" className="text-xs font-semibold uppercase tracking-wider text-ink-2">{t('quote.paymentTitle')}</h3>
                <dl className="mt-2 grid gap-1.5 text-sm">
                  {paymentLines.map((line) => (
                    <div
                      key={line.label}
                      className={clsx(
                        'flex flex-wrap items-baseline justify-between gap-x-3',
                        line.strong && 'mt-1 border-t border-line pt-2.5',
                      )}
                      data-testid={line.strong ? 'quote-total' : undefined}
                    >
                      <dt className={line.strong ? 'font-semibold text-ink-0' : 'text-ink-2'}>{line.label}</dt>
                      <dd className={line.strong ? 'font-display text-2xl font-semibold text-brand' : 'text-base font-semibold text-ink-0'}>{line.value}</dd>
                    </div>
                  ))}
                </dl>
                {withFees && <p className="mt-2 text-xs text-ink-3">{t('quote.termHint')}</p>}
              </section>
            )}
          </div>
          {/* A chosen plan's price is fixed; only a project type without a plan shows an indicative price. */}
          <p className="mt-3 text-xs text-ink-3">
            {t('quote.vat')}.{!(path === 'web' && option) && ` ${t('quote.hint')}`}
          </p>
        </section>
      )}

      <div>
        <label htmlFor="message" className={label}>{path === 'existing' ? t('messageOptional') : `${t('message')} *`}</label>
        <textarea
          id="message"
          name="message"
          required={path !== 'existing'}
          rows={5}
          maxLength={2000}
          defaultValue={values.message}
          className={field}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-hint message-error' : 'message-hint'}
        />
        <p id="message-hint" className="mt-1 text-xs text-ink-3">{t('messageHint')}</p>
        {err('message')}
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
            <input type="checkbox" name="nda" defaultChecked={Boolean(values.nda)} className="accent-[var(--color-brand)]" /> {t('nda')}
          </label>
        </div>
      </details>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="privacy" required defaultChecked={Boolean(values.privacy)} className="mt-1 accent-[var(--color-brand)]" {...aria('privacy')} />
          <span>
            {t.rich('privacy', { link: (chunks) => <Link href="/privacy" className="text-brand underline">{chunks}</Link> })} *
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
      <p className="text-xs text-ink-3">{t('guarantees')}</p>
    </form>
  )
}
