// Run by `pnpm deploy:build` (scripts/deploy-build.mjs) around `payload migrate`:
//   MIGRATIONS_PREFLIGHT=1  before migrate: fails on a dev-mode-pushed database (migrate would block on a prompt);
//   (unset)                 after migrate: also fails when any migration did not apply.
import config from '@payload-config'
import { getPayload } from 'payload'
import { findMigrationProblems } from '../src/lib/db/migration-check'
import { migrations } from '../src/migrations'

// An env flag, not argv: `payload run` does not forward extra arguments to the script.
const preflight = process.env.MIGRATIONS_PREFLIGHT === '1'
const payload = await getPayload({ config })
// A brand-new database has no payload_migrations table yet: nothing applied, nothing dev-pushed.
const applied = await payload
  .find({ collection: 'payload-migrations', limit: 0, pagination: false, overrideAccess: true })
  .then(({ docs }) => docs.map((d) => ({ name: String(d.name), batch: d.batch as number | null | undefined })))
  .catch((err: unknown) => {
    if (preflight) return []
    throw err
  })
const problems = findMigrationProblems(
  migrations.map((m) => m.name),
  applied,
  { preflight },
)
if (problems.length > 0) {
  for (const p of problems) payload.logger.error(p)
  process.exit(1)
}
payload.logger.info(preflight ? 'Database ready for migrate' : `All ${migrations.length} migrations applied`)
process.exit(0)
