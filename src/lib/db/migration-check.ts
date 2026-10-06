export type AppliedMigration = { name: string; batch: number | string | null | undefined }

/**
 * Problems that must stop a deploy around `payload migrate`. When the database was schema-pushed in dev
 * mode (a `batch -1` row), Payload's migrate asks an interactive question that CI cannot answer: it either
 * hangs or exits 0 *without applying anything*. So the deploy checks twice:
 * - `preflight` (before migrate): only the dev-push marker, so migrate never reaches that question;
 * - after migrate: also every migration file must be recorded with a real batch.
 */
export function findMigrationProblems(expected: string[], applied: AppliedMigration[], { preflight = false } = {}): string[] {
  const problems: string[] = []
  if (applied.some((m) => Number(m.batch) === -1)) {
    problems.push('Database has a dev-mode schema push (payload_migrations batch -1): migrate it from a clean database instead.')
  }
  if (preflight) return problems
  const done = new Set(applied.filter((m) => Number(m.batch) > 0).map((m) => m.name))
  for (const name of expected) if (!done.has(name)) problems.push(`Pending migration: ${name}`)
  return problems
}
