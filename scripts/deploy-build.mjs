// `pnpm deploy:build` (Vercel buildCommand, see vercel.json): preflight → migrate → verify → next build.
// Migrations use DATABASE_URL_UNPOOLED when set (Neon's direct connection; DDL through the pooler is
// unreliable) and fall back to DATABASE_URL. The build itself keeps the pooled DATABASE_URL.
import { spawnSync } from 'node:child_process'

const migrateUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!migrateUrl) {
  console.error('[deploy:build] DATABASE_URL (or DATABASE_URL_UNPOOLED) is not set')
  process.exit(1)
}
const migrateEnv = { ...process.env, DATABASE_URL: migrateUrl }

function run(label, command, env) {
  console.log(`\n[deploy:build] ${label}`)
  // No stdin and a time limit: nothing in a deploy may wait for an interactive answer.
  const res = spawnSync(command, { env, shell: true, stdio: ['ignore', 'inherit', 'inherit'], timeout: 20 * 60_000 })
  if (res.status !== 0) {
    console.error(`[deploy:build] ${label} failed (${res.error?.message ?? `exit ${res.status ?? res.signal}`})`)
    process.exit(res.status || 1)
  }
}

// Preflight: on a dev-pushed database migrate would prompt (hang, or exit 0 without applying anything).
run('check database before migrate', 'pnpm payload run scripts/verify-migrations.ts', { ...migrateEnv, MIGRATIONS_PREFLIGHT: '1' })
run('payload migrate', 'pnpm payload migrate', migrateEnv)
// Postflight: every migration file must now be recorded.
run('verify migrations', 'pnpm payload run scripts/verify-migrations.ts', migrateEnv)
run('next build', 'pnpm build', process.env)
