// S13 / T6.1: writes the seeded legal texts (legal notice, privacy policy, cookie policy; es/en/fr) into the
// `legal` global of an already-seeded database. Touches nothing else (no other global or collection, and
// `companyComplete` stays as it is). Run on the server after the DB cutover:
//   pnpm legal:update            (writes)
//   pnpm legal:update:dry-run    (writes nothing; `payload run` drops --flags, so this sets LEGAL_UPDATE_DRY_RUN=1)
// Logs counts only. A running site keeps its cached legal pages until the cache tag expires or the service restarts.
import config from '@payload-config'
import { getPayload } from 'payload'
import { locales } from '../src/i18n/locales'
import { legal } from '../src/seed/data/legal'

const dryRun = process.env.LEGAL_UPDATE_DRY_RUN === '1'
const payload = await getPayload({ config })
try {
  let updated = 0
  for (const locale of locales) {
    const { legalNotice, privacyPolicy, cookiePolicy } = legal[locale]
    if (!dryRun) {
      await payload.updateGlobal({
        slug: 'legal',
        locale,
        data: { legalNotice, privacyPolicy, cookiePolicy } as never,
        depth: 0,
        overrideAccess: true,
      })
    }
    updated++
  }
  payload.logger.info(
    dryRun
      ? `legal update (dry run, nothing written): would update ${updated} locales`
      : `legal update: updated ${updated} locales`,
  )
  process.exit(0)
} catch (e) {
  // Database errors can echo row values: log only the error kind.
  const err = e as { name?: unknown; code?: unknown } | null
  payload.logger.error({ err: { name: String(err?.name ?? 'Error'), code: typeof err?.code === 'string' ? err.code : undefined } }, 'legal update failed')
  process.exit(1)
}
