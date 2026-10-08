import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "contacts_replies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"author_id" integer,
  	"subject" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  ALTER TABLE "contacts_replies" ADD CONSTRAINT "contacts_replies_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contacts_replies" ADD CONSTRAINT "contacts_replies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "contacts_replies_order_idx" ON "contacts_replies" USING btree ("_order");
  CREATE INDEX "contacts_replies_parent_id_idx" ON "contacts_replies" USING btree ("_parent_id");
  CREATE INDEX "contacts_replies_author_idx" ON "contacts_replies" USING btree ("author_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "contacts_replies" CASCADE;`)
}
