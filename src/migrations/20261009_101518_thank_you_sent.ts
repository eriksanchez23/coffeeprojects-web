import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "contacts_thank_you_sent" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"author_id" integer
  );
  
  ALTER TABLE "contacts_thank_you_sent" ADD CONSTRAINT "contacts_thank_you_sent_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contacts_thank_you_sent" ADD CONSTRAINT "contacts_thank_you_sent_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "contacts_thank_you_sent_order_idx" ON "contacts_thank_you_sent" USING btree ("_order");
  CREATE INDEX "contacts_thank_you_sent_parent_id_idx" ON "contacts_thank_you_sent" USING btree ("_parent_id");
  CREATE INDEX "contacts_thank_you_sent_author_idx" ON "contacts_thank_you_sent" USING btree ("author_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "contacts_thank_you_sent" CASCADE;`)
}
