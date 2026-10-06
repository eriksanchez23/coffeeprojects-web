'use client'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef } from 'react'
import { buttonClasses } from '@/components/ui/button'
import { submitContact } from '@/features/contact/action'
import type { ContactResult } from '@/features/contact/handle-contact'
import { budgets, projectTypes, timelines } from '@/features/contact/options'
import { readConsentFromDocument } from '@/features/tracking/consent'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { TurnstileWidget } from './turnstile-widget'

type Prefill = { type?: string }

// React resets uncontrolled fields after every action, so the submitted values travel in the
// state and feed `defaultValue`s: a failed submit never wipes what the visitor typed.
type FormState = { result: ContactResult | null; values: Record<string, string>; attempt: number }
const initialState: FormState = { result: null, values: {}, attempt: 0 }

const field =
  'w-full rounded-[var(--radius-md)] border border-line-hi bg-bg-1 px-4 py-3 text-ink-0 placeholder:text-ink-3 focus:border-amber aria-[invalid=true]:border-berry'
const label = 'mb-2 block text-sm text-ink-1'

export function ContactForm({ locale, sourcePath, prefill, siteKey }: { locale: string; sourcePath: string; prefill: Prefill; siteKey: string }) {
  const t = useTranslations('contact')
  const formRef = useRef<HTMLFormElement>(null)
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
  const formError = result?.status === 'error' ? result.formError : undefined

  // After a failed submit move focus to the first invalid field, or to the form-level alert.
  useEffect(() => {
    if (result?.status !== 'error') return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], #form-error')?.focus()
  }, [result])

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

  return (
    <form ref={formRef} action={action} noValidate className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      {/* Honeypot: hidden from humans and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">{t('honeypot')}</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
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

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="projectType" className={label}>{t('projectType')} *</label>
          <select id="projectType" name="projectType" defaultValue={defaultType} className={field} {...aria('projectType')}>
            {projectTypes.map((p) => (
              <option key={p} value={p}>{t(`projectTypes.${p}`)}</option>
            ))}
          </select>
          {err('projectType')}
        </div>
        <div>
          <label htmlFor="budget" className={label}>{t('budget')}</label>
          <select id="budget" name="budget" defaultValue={values.budget ?? ''} className={field}>
            <option value="">—</option>
            {budgets.map((b) => (
              <option key={b} value={b}>{t(`budgets.${b}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="timeline" className={label}>{t('timeline')}</label>
          <select id="timeline" name="timeline" defaultValue={values.timeline ?? ''} className={field}>
            <option value="">—</option>
            {timelines.map((x) => (
              <option key={x} value={x}>{t(`timelines.${x}`)}</option>
            ))}
          </select>
        </div>
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

      <TurnstileWidget key={state.attempt} siteKey={siteKey} locale={locale} />

      {formError && (
        <p id="form-error" role="alert" tabIndex={-1} className="rounded-[var(--radius-md)] border border-berry/50 bg-berry/10 p-4 text-sm text-ink-0">
          {t(`errors.${formError}`)}
        </p>
      )}

      <button type="submit" disabled={pending} className={cn(buttonClasses({ size: 'lg' }), 'w-full sm:w-auto')}>
        {pending ? t('sending') : t('submit')}
      </button>
      <p className="font-mono text-xs text-ink-3">{t('guarantees')}</p>
    </form>
  )
}
