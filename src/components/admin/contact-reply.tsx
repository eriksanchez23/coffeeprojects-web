'use client'

import { Button, toast, useConfig, useDocumentInfo, useField, useFormFields, useFormModified, useTranslation } from '@payloadcms/ui'
import { type FormEvent, useId, useState } from 'react'
import { replySubject } from '@/features/contact/emails'

type ReplyError = 'unauthorized' | 'invalid' | 'notFound' | 'emailNotConfigured' | 'sendFailed' | 'saveFailed' | 'network'

const copy = {
  es: {
    title: 'Responder',
    hint: 'Envía la respuesta por email al cliente y marca la solicitud como «Respondida».',
    subject: 'Asunto',
    message: 'Mensaje',
    send: 'Enviar respuesta',
    sending: 'Enviando…',
    sent: 'Respuesta enviada. La solicitud está marcada como «Respondida».',
    errors: {
      unauthorized: 'Tu sesión no permite responder. Vuelve a iniciar sesión.',
      invalid: 'Escribe un asunto (máx. 200 caracteres) y un mensaje.',
      notFound: 'No se ha encontrado la solicitud.',
      emailNotConfigured: 'El envío de emails no está configurado (falta RESEND_API_KEY). No se ha enviado nada y el estado no ha cambiado.',
      sendFailed: 'No se pudo enviar el email. El estado no ha cambiado; inténtalo de nuevo.',
      saveFailed: 'El email se envió, pero no se pudo guardar en el historial. Revisa el estado antes de volver a enviarlo.',
      network: 'No se pudo contactar con el servidor. No se ha enviado nada.',
    },
  },
  en: {
    title: 'Reply',
    hint: 'Emails your reply to the client and marks the request as "Answered".',
    subject: 'Subject',
    message: 'Message',
    send: 'Send reply',
    sending: 'Sending…',
    sent: 'Reply sent. The request is marked as "Answered".',
    errors: {
      unauthorized: 'Your session cannot reply. Please log in again.',
      invalid: 'Write a subject (max. 200 characters) and a message.',
      notFound: 'The request was not found.',
      emailNotConfigured: 'Email sending is not configured (RESEND_API_KEY is missing). Nothing was sent and the status did not change.',
      sendFailed: 'The email could not be sent. The status did not change; please try again.',
      saveFailed: 'The email was sent but could not be saved to the history. Check the status before sending it again.',
      network: 'Could not reach the server. Nothing was sent.',
    },
  },
} as const

const box: React.CSSProperties = {
  marginBottom: 24,
  padding: 16,
  borderRadius: 12,
  border: '1px solid rgba(245,167,66,.32)',
  background: 'rgba(245,167,66,.06)',
}
const input: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid var(--theme-elevation-250)',
  background: 'var(--theme-input-bg)',
  color: 'var(--theme-text)',
  font: 'inherit',
}

/** S19: "Responder" box in the contact request sidebar (a `ui` field). Talks to POST /api/contacts/:id/reply. */
export function ContactReply() {
  const { i18n } = useTranslation()
  const c = i18n.language?.startsWith('es') ? copy.es : copy.en
  const { id } = useDocumentInfo()
  const { config } = useConfig()
  const locale = useFormFields(([fields]) => fields.locale?.value as string | undefined)
  const { setValue: setStatus } = useField<string>({ path: 'status' })
  const modified = useFormModified()
  const [subject, setSubject] = useState(() => replySubject(locale))
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ReplyError | null>(null)
  const [done, setDone] = useState(false)
  const uid = useId()

  if (!id) return null

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    setDone(false)
    try {
      const res = await fetch(`${config.serverURL}${config.routes.api}/contacts/${id}/reply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: ReplyError }
      if (!res.ok || !body.ok) {
        setError(body.error && body.error in c.errors ? body.error : 'sendFailed')
        return
      }
      setDone(true)
      setMessage('')
      toast.success(c.sent)
      // Mirror the new status without marking the form dirty; with no other pending edits, reload to show the history.
      setStatus('answered', true)
      if (!modified) window.location.reload()
    } catch {
      setError('network')
    } finally {
      setPending(false)
    }
  }

  // Not a nested <form>: the edit view is already one. The button submits through onClick.
  return (
    <section aria-labelledby={`${uid}-title`} style={box} data-testid="contact-reply">
      <h3 id={`${uid}-title`} style={{ margin: '0 0 4px', fontSize: 16 }}>{c.title}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.8 }}>{c.hint}</p>
      <label htmlFor={`${uid}-subject`} style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{c.subject}</label>
      <input id={`${uid}-subject`} value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} style={input} />
      <label htmlFor={`${uid}-message`} style={{ display: 'block', fontSize: 13, margin: '12px 0 4px' }}>{c.message}</label>
      <textarea id={`${uid}-message`} value={message} rows={6} maxLength={10_000} onChange={(e) => setMessage(e.target.value)} style={input} />
      <div aria-live="polite" style={{ minHeight: 0 }}>
        {error && (
          <p role="alert" data-testid="contact-reply-error" style={{ margin: '12px 0 0', color: 'var(--theme-error-500)', fontSize: 13 }}>
            {c.errors[error]}
          </p>
        )}
        {done && <p style={{ margin: '12px 0 0', fontSize: 13 }}>{c.sent}</p>}
      </div>
      <div style={{ marginTop: 12 }}>
      <Button
        type="button"
        buttonStyle="secondary"
        size="small"
        disabled={pending || !message.trim() || !subject.trim()}
        onClick={(e) => void onSubmit(e as unknown as FormEvent)}
        margin={false}
        extraButtonProps={{ 'aria-busy': pending }}
      >
        {pending ? c.sending : c.send}
      </Button>
      </div>
    </section>
  )
}
