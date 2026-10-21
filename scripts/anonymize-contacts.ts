// S12: anonymizes contact requests whose last activity (`updatedAt`) is older than 24 months.
// Run on the server, daily (systemd timer):
//   pnpm contacts:anonymize            (writes)
//   pnpm contacts:anonymize:dry-run    (counts only; `payload run` drops --flags, so this sets ANONYMIZE_DRY_RUN=1)
// Logs counts only, never personal data.
import config from '@payload-config'
import { getPayload } from 'payload'
import { anonymizeContacts, isDryRun } from '../src/lib/retention/contacts'

const dryRun = isDryRun(process.argv, process.env)
const payload = await getPayload({ config })
try {
  const r = await anonymizeContacts(payload, { dryRun })
  payload.logger.info(
    `contacts retention${r.dryRun ? ' (dry run, nothing written)' : ''}: cutoff ${r.cutoff}, ` +
      `inactive ${r.matched}, ${r.dryRun ? 'would anonymize' : 'anonymized'} ${r.anonymized}, already anonymized ${r.alreadyAnonymized}`,
  )
  process.exit(0)
} catch (e) {
  // Database errors can echo row values: log only the error kind.
  const err = e as { name?: unknown; code?: unknown } | null
  payload.logger.error({ err: { name: String(err?.name ?? 'Error'), code: typeof err?.code === 'string' ? err.code : undefined } }, 'contacts retention failed')
  process.exit(1)
}
