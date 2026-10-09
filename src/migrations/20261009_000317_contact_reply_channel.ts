import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_contacts_replies_channel" AS ENUM('panel', 'email');
  ALTER TABLE "contacts_replies" ADD COLUMN "channel" "enum_contacts_replies_channel" DEFAULT 'panel';
  ALTER TABLE "contacts_replies" ADD COLUMN "inbound_id" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contacts_replies" DROP COLUMN "channel";
  ALTER TABLE "contacts_replies" DROP COLUMN "inbound_id";
  DROP TYPE "public"."enum_contacts_replies_channel";`)
}
