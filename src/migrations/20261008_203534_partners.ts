import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Partner programme global (S16): new tables only, nothing existing is altered or dropped.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_partners_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__partners_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__partners_v_published_locale" AS ENUM('es', 'en', 'fr');
  CREATE TABLE "partners_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "partners_conditions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"topic" varchar,
  	"condition" varchar
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"rate_with_maintenance" numeric DEFAULT 10,
  	"rate_web_only" numeric DEFAULT 5,
  	"seo_image_id" integer,
  	"_status" "enum_partners_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "partners_locales" (
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"notice_title" varchar,
  	"notice_text" varchar,
  	"with_maintenance_title" varchar,
  	"with_maintenance_badge" varchar,
  	"web_only_title" varchar,
  	"rate_note" varchar,
  	"table_title" varchar,
  	"table_note" varchar,
  	"sell_title" varchar,
  	"web_plans_title" varchar,
  	"maintenance_title" varchar,
  	"maintenance_text" varchar,
  	"sell_argument" varchar,
  	"steps_title" varchar,
  	"conditions_title" varchar,
  	"dont_promise_title" varchar,
  	"dont_promise_text" varchar,
  	"footnote" varchar,
  	"cta_title" varchar,
  	"cta_text" varchar,
  	"cta_register_label" varchar,
  	"cta_contact_label" varchar,
  	"cta_email_subject" varchar,
  	"cta_email_body" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_partners_v_version_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_version_conditions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"topic" varchar,
  	"condition" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_rate_with_maintenance" numeric DEFAULT 10,
  	"version_rate_web_only" numeric DEFAULT 5,
  	"version_seo_image_id" integer,
  	"version__status" "enum__partners_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__partners_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_partners_v_locales" (
  	"version_eyebrow" varchar,
  	"version_title" varchar,
  	"version_intro" varchar,
  	"version_notice_title" varchar,
  	"version_notice_text" varchar,
  	"version_with_maintenance_title" varchar,
  	"version_with_maintenance_badge" varchar,
  	"version_web_only_title" varchar,
  	"version_rate_note" varchar,
  	"version_table_title" varchar,
  	"version_table_note" varchar,
  	"version_sell_title" varchar,
  	"version_web_plans_title" varchar,
  	"version_maintenance_title" varchar,
  	"version_maintenance_text" varchar,
  	"version_sell_argument" varchar,
  	"version_steps_title" varchar,
  	"version_conditions_title" varchar,
  	"version_dont_promise_title" varchar,
  	"version_dont_promise_text" varchar,
  	"version_footnote" varchar,
  	"version_cta_title" varchar,
  	"version_cta_text" varchar,
  	"version_cta_register_label" varchar,
  	"version_cta_contact_label" varchar,
  	"version_cta_email_subject" varchar,
  	"version_cta_email_body" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "partners_steps" ADD CONSTRAINT "partners_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_conditions" ADD CONSTRAINT "partners_conditions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_locales" ADD CONSTRAINT "partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_version_steps" ADD CONSTRAINT "_partners_v_version_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_version_conditions" ADD CONSTRAINT "_partners_v_version_conditions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_locales" ADD CONSTRAINT "_partners_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "partners_steps_order_idx" ON "partners_steps" USING btree ("_order");
  CREATE INDEX "partners_steps_parent_id_idx" ON "partners_steps" USING btree ("_parent_id");
  CREATE INDEX "partners_steps_locale_idx" ON "partners_steps" USING btree ("_locale");
  CREATE INDEX "partners_conditions_order_idx" ON "partners_conditions" USING btree ("_order");
  CREATE INDEX "partners_conditions_parent_id_idx" ON "partners_conditions" USING btree ("_parent_id");
  CREATE INDEX "partners_conditions_locale_idx" ON "partners_conditions" USING btree ("_locale");
  CREATE INDEX "partners_seo_seo_image_idx" ON "partners" USING btree ("seo_image_id");
  CREATE INDEX "partners__status_idx" ON "partners" USING btree ("_status");
  CREATE UNIQUE INDEX "partners_locales_locale_parent_id_unique" ON "partners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_partners_v_version_steps_order_idx" ON "_partners_v_version_steps" USING btree ("_order");
  CREATE INDEX "_partners_v_version_steps_parent_id_idx" ON "_partners_v_version_steps" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_version_steps_locale_idx" ON "_partners_v_version_steps" USING btree ("_locale");
  CREATE INDEX "_partners_v_version_conditions_order_idx" ON "_partners_v_version_conditions" USING btree ("_order");
  CREATE INDEX "_partners_v_version_conditions_parent_id_idx" ON "_partners_v_version_conditions" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_version_conditions_locale_idx" ON "_partners_v_version_conditions" USING btree ("_locale");
  CREATE INDEX "_partners_v_version_seo_version_seo_image_idx" ON "_partners_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_partners_v_version_version__status_idx" ON "_partners_v" USING btree ("version__status");
  CREATE INDEX "_partners_v_created_at_idx" ON "_partners_v" USING btree ("created_at");
  CREATE INDEX "_partners_v_updated_at_idx" ON "_partners_v" USING btree ("updated_at");
  CREATE INDEX "_partners_v_snapshot_idx" ON "_partners_v" USING btree ("snapshot");
  CREATE INDEX "_partners_v_published_locale_idx" ON "_partners_v" USING btree ("published_locale");
  CREATE INDEX "_partners_v_latest_idx" ON "_partners_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_partners_v_locales_locale_parent_id_unique" ON "_partners_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "partners_steps" CASCADE;
  DROP TABLE "partners_conditions" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "partners_locales" CASCADE;
  DROP TABLE "_partners_v_version_steps" CASCADE;
  DROP TABLE "_partners_v_version_conditions" CASCADE;
  DROP TABLE "_partners_v" CASCADE;
  DROP TABLE "_partners_v_locales" CASCADE;
  DROP TYPE "public"."enum_partners_status";
  DROP TYPE "public"."enum__partners_v_version_status";
  DROP TYPE "public"."enum__partners_v_published_locale";`)
}
