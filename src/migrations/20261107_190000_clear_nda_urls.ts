import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Security: NDA projects never keep a public URL. The beforeChange hook clears it on save; this clears any legacy
 * row (and its stored versions) that was saved before the hook existed. Data only, no schema change.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "projects" SET "url" = NULL WHERE "nda" = true AND "url" IS NOT NULL;
   UPDATE "_projects_v" SET "version_url" = NULL WHERE "version_nda" = true AND "version_url" IS NOT NULL;`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Cleared addresses are not restored.
}
