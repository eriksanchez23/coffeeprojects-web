'use client'

import { Button, toast, useConfig, useForm, useFormFields, useTranslation } from '@payloadcms/ui'
import { useId, useState } from 'react'
import { IMPORT_PATHS, type ImportPath, isEmptyValue } from '@/features/project-import/plan'

type ImportError = 'unauthorized' | 'invalid' | 'invalidUrl' | 'blockedUrl' | 'unreachable' | 'timeout' | 'tooLarge' | 'notHtml' | 'network'
type ImportResponse = {
  ok?: boolean
  error?: ImportError
  fill?: Partial<Record<ImportPath, unknown>>
  skipped?: ImportPath[]
  missing?: ImportPath[]
  warnings?: 'coverFailed'[]
  coverSource?: 'screenshot' | 'ogImage'
}
type Summary = { filled: ImportPath[]; skipped: ImportPath[]; missing: ImportPath[]; coverFailed: boolean; coverSource?: ImportResponse['coverSource'] }

const copy = {
  es: {
    title: 'Importar desde la web',
    hint: 'Rellena los campos vacíos con los datos de la web del proyecto (título, resumen, tecnologías, año, SEO) y capturas de la portada y de la web en el móvil (si la galería está vacía). Revisa los valores y pulsa Guardar: no se guarda nada hasta entonces.',
    replaceCover: 'Reemplazar portada',
    run: 'Importar desde la web',
    running: 'Importando…',
    needUrl: 'Escribe primero la URL del proyecto.',
    done: 'Datos importados. Revísalos y guarda el proyecto.',
    filled: 'Rellenado',
    skipped: 'Ya tenía valor (sin cambios)',
    missing: 'No encontrado en la web',
    coverFailed: 'No se pudo obtener una imagen de portada.',
    sources: { screenshot: 'Portada: captura de la página de inicio.', ogImage: 'Portada: imagen para redes (og:image) de la web.' },
    fields: {
      title: 'Título',
      summary: 'Resumen',
      stack: 'Tecnologías',
      year: 'Año',
      cover: 'Portada',
      gallery: 'Galería: vista en el móvil',
      'seo.title': 'SEO: título',
      'seo.description': 'SEO: descripción',
      'seo.image': 'SEO: imagen',
    },
    errors: {
      unauthorized: 'Tu sesión no permite importar. Vuelve a iniciar sesión.',
      invalid: 'La petición no es válida.',
      invalidUrl: 'La URL no es válida: usa una dirección http(s) pública, sin usuario ni contraseña.',
      blockedUrl: 'Esa dirección apunta a una red privada o local y no se puede importar.',
      unreachable: 'No se pudo abrir la web (no responde, da error o redirige demasiadas veces).',
      timeout: 'La web tardó demasiado en responder. Inténtalo de nuevo.',
      tooLarge: 'La página es demasiado grande para importarla.',
      notHtml: 'Esa URL no devuelve una página web (HTML).',
      network: 'No se pudo contactar con el servidor. No se ha cambiado nada.',
    },
  },
  en: {
    title: 'Import from website',
    hint: "Fills the empty fields with data from the project's website (title, summary, stack, year, SEO) and screenshots for the cover and the phone view (when the gallery is empty). Review the values and click Save: nothing is saved until then.",
    replaceCover: 'Replace cover',
    run: 'Import from website',
    running: 'Importing…',
    needUrl: 'Enter the project URL first.',
    done: 'Data imported. Review it and save the project.',
    filled: 'Filled',
    skipped: 'Already set (unchanged)',
    missing: 'Not found on the website',
    coverFailed: 'No cover image could be imported.',
    sources: { screenshot: 'Cover: screenshot of the home page.', ogImage: "Cover: the website's social image (og:image)." },
    fields: {
      title: 'Title',
      summary: 'Summary',
      stack: 'Stack',
      year: 'Year',
      cover: 'Cover',
      gallery: 'Gallery: phone view',
      'seo.title': 'SEO: title',
      'seo.description': 'SEO: description',
      'seo.image': 'SEO: image',
    },
    errors: {
      unauthorized: 'Your session cannot import. Please log in again.',
      invalid: 'The request is not valid.',
      invalidUrl: 'The URL is not valid: use a public http(s) address with no user name or password.',
      blockedUrl: 'That address points to a private or local network and cannot be imported.',
      unreachable: 'The website could not be opened (no answer, an error, or too many redirects).',
      timeout: 'The website took too long to answer. Please try again.',
      tooLarge: 'The page is too large to import.',
      notHtml: 'That URL does not return a web page (HTML).',
      network: 'Could not reach the server. Nothing was changed.',
    },
  },
} as const

const box: React.CSSProperties = {
  margin: '0 0 24px',
  padding: 16,
  borderRadius: 12,
  border: '1px solid rgba(245,167,66,.32)',
  background: 'rgba(245,167,66,.06)',
}
const small: React.CSSProperties = { margin: '8px 0 0', fontSize: 13 }

/** S23: "Import from website" box under the project URL (a `ui` field). Values go into the form, not the database. */
export function ProjectImport() {
  const { i18n } = useTranslation()
  const c = i18n.language?.startsWith('es') ? copy.es : copy.en
  const { config } = useConfig()
  const { dispatchFields, getDataByPath, setModified } = useForm()
  const url = useFormFields(([fields]) => fields.url?.value)
  const [replaceCover, setReplaceCover] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ImportError | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const uid = useId()
  const hasUrl = typeof url === 'string' && url.trim() !== ''

  const onImport = async () => {
    setPending(true)
    setError(null)
    setSummary(null)
    // The values the form holds now (current locale for localized fields): the server proposes only empty ones.
    const current = Object.fromEntries(IMPORT_PATHS.map((path) => [path, getDataByPath(path)]))
    try {
      const res = await fetch(`${config.serverURL}${config.routes.api}/projects/import-from-url`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, replaceCover, current }),
      })
      const body = (await res.json().catch(() => ({}))) as ImportResponse
      if (!res.ok || !body.ok) {
        setError(body.error && body.error in c.errors ? body.error : 'unreachable')
        return
      }
      const filled: ImportPath[] = []
      const skipped = [...(body.skipped ?? [])]
      for (const [path, value] of Object.entries(body.fill ?? {}) as [ImportPath, unknown][]) {
        // Re-check: the user may have typed into a field while the import ran.
        if (!(path === 'cover' && replaceCover) && !isEmptyValue(getDataByPath(path))) skipped.push(path)
        else {
          dispatchFields({ type: 'UPDATE', path, value })
          filled.push(path)
        }
      }
      if (filled.length) setModified(true)
      setSummary({ filled, skipped, missing: body.missing ?? [], coverFailed: Boolean(body.warnings?.length), coverSource: body.coverSource })
      toast.success(c.done)
    } catch {
      setError('network')
    } finally {
      setPending(false)
    }
  }

  const list = (label: string, paths: ImportPath[], testId: string) =>
    paths.length > 0 && (
      <p style={small} data-testid={testId}>
        <strong>{label}:</strong> {paths.map((p) => c.fields[p]).join(', ')}
      </p>
    )

  return (
    <section aria-labelledby={`${uid}-title`} style={box} data-testid="project-import">
      <h3 id={`${uid}-title`} style={{ margin: '0 0 4px', fontSize: 16 }}>{c.title}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.8 }}>{c.hint}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <Button
          type="button"
          buttonStyle="secondary"
          size="small"
          disabled={pending || !hasUrl}
          onClick={() => void onImport()}
          margin={false}
          extraButtonProps={{ 'aria-busy': pending, 'data-testid': 'project-import-run' }}
        >
          {pending ? c.running : c.run}
        </Button>
        <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
          <input type="checkbox" checked={replaceCover} onChange={(e) => setReplaceCover(e.target.checked)} data-testid="project-import-replace-cover" />
          {c.replaceCover}
        </label>
      </div>
      {!hasUrl && <p style={{ ...small, opacity: 0.8 }}>{c.needUrl}</p>}
      <div aria-live="polite">
        {error && (
          <p role="alert" data-testid="project-import-error" style={{ ...small, color: 'var(--theme-error-500)' }}>
            {c.errors[error]}
          </p>
        )}
        {summary && (
          <>
            {list(c.filled, summary.filled, 'project-import-filled')}
            {list(c.skipped, summary.skipped, 'project-import-skipped')}
            {list(c.missing, summary.missing.filter((p) => !(summary.coverFailed && (p === 'cover' || p === 'seo.image'))), 'project-import-missing')}
            {summary.coverSource && <p style={small}>{c.sources[summary.coverSource]}</p>}
            {summary.coverFailed && <p style={{ ...small, color: 'var(--theme-warning-500, inherit)' }}>{c.coverFailed}</p>}
          </>
        )}
      </div>
    </section>
  )
}
