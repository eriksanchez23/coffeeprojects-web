'use client'

import { Button, toast, useConfig, useDocumentInfo, useFormModified, useTranslation } from '@payloadcms/ui'
import { useId, useState } from 'react'

type ThankYouError = 'unauthorized' | 'notFound' | 'emailNotConfigured' | 'sendFailed' | 'saveFailed' | 'network'

const copy = {
  es: {
    title: 'Agradecimiento (PDF)',
    hint: 'PDF de agradecimiento con el resumen de la solicitud, en el idioma del cliente. Descárgalo para revisarlo y envíalo a su email desde contact@coffeeprojects.es.',
    download: 'Descargar para revisar',
    send: 'Enviar al cliente',
    sending: 'Enviando…',
    sent: 'Agradecimiento enviado al cliente.',
    errors: {
      unauthorized: 'Tu sesión no permite enviarlo. Vuelve a iniciar sesión.',
      notFound: 'No se ha encontrado la solicitud.',
      emailNotConfigured: 'El envío de emails no está configurado (falta RESEND_API_KEY). No se ha enviado nada; puedes descargar el PDF.',
      sendFailed: 'No se pudo enviar el email. No se ha guardado nada; inténtalo de nuevo.',
      saveFailed: 'El email se envió, pero no se pudo guardar en el historial.',
      network: 'No se pudo contactar con el servidor. No se ha enviado nada.',
    },
  },
  en: {
    title: 'Thank-you note (PDF)',
    hint: "Thank-you PDF with the request summary, in the client's language. Download it to review it, then email it to the client from contact@coffeeprojects.es.",
    download: 'Download to review',
    send: 'Send to client',
    sending: 'Sending…',
    sent: 'Thank-you note sent to the client.',
    errors: {
      unauthorized: 'Your session cannot send it. Please log in again.',
      notFound: 'The request was not found.',
      emailNotConfigured: 'Email sending is not configured (RESEND_API_KEY is missing). Nothing was sent; you can still download the PDF.',
      sendFailed: 'The email could not be sent. Nothing was saved; please try again.',
      saveFailed: 'The email was sent but could not be saved to the history.',
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
const link: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 10px',
  lineHeight: '20px',
  borderRadius: 6,
  border: '1px solid var(--theme-elevation-250)',
  color: 'var(--theme-text)',
  fontSize: 13,
  textDecoration: 'none',
}

/** S22: "Agradecimiento (PDF)" box in the contact request sidebar (a `ui` field), next to "Responder". */
export function ContactThankYou() {
  const { i18n } = useTranslation()
  const c = i18n.language?.startsWith('es') ? copy.es : copy.en
  const { id } = useDocumentInfo()
  const { config } = useConfig()
  const modified = useFormModified()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ThankYouError | null>(null)
  const [done, setDone] = useState(false)
  const uid = useId()

  if (!id) return null
  const base = `${config.serverURL}${config.routes.api}/contacts/${id}`

  const onSend = async () => {
    setPending(true)
    setError(null)
    setDone(false)
    try {
      const res = await fetch(`${base}/thank-you`, { method: 'POST', credentials: 'include' })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: ThankYouError }
      if (!res.ok || !body.ok) {
        setError(body.error && body.error in c.errors ? body.error : 'sendFailed')
        return
      }
      setDone(true)
      toast.success(c.sent)
      // With no other pending edits, reload to show the new entry in "Thank-you notes sent".
      if (!modified) window.location.reload()
    } catch {
      setError('network')
    } finally {
      setPending(false)
    }
  }

  return (
    <section aria-labelledby={`${uid}-title`} style={box} data-testid="contact-thank-you">
      <h3 id={`${uid}-title`} style={{ margin: '0 0 4px', fontSize: 16 }}>{c.title}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.8 }}>{c.hint}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <a href={`${base}/thank-you.pdf`} download style={link} data-testid="contact-thank-you-download">
          {c.download}
        </a>
        <Button
          type="button"
          buttonStyle="secondary"
          size="small"
          disabled={pending}
          onClick={() => void onSend()}
          margin={false}
          extraButtonProps={{ 'aria-busy': pending, 'data-testid': 'contact-thank-you-send' }}
        >
          {pending ? c.sending : c.send}
        </Button>
      </div>
      <div aria-live="polite">
        {error && (
          <p role="alert" data-testid="contact-thank-you-error" style={{ margin: '12px 0 0', color: 'var(--theme-error-500)', fontSize: 13 }}>
            {c.errors[error]}
          </p>
        )}
        {done && <p style={{ margin: '12px 0 0', fontSize: 13 }}>{c.sent}</p>}
      </div>
    </section>
  )
}
