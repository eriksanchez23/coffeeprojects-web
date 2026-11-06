import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_contacts_website_issues" AS ENUM('slow', 'mobile', 'google', 'outdated', 'editing', 'no-leads', 'other');
  CREATE TYPE "public"."enum_services_line" AS ENUM('web', 'other');
  CREATE TYPE "public"."enum__services_v_version_line" AS ENUM('web', 'other');
  CREATE TYPE "public"."enum_projects_kind" AS ENUM('new-website', 'redesign', 'store', 'app', 'other');
  CREATE TYPE "public"."enum__projects_v_version_kind" AS ENUM('new-website', 'redesign', 'store', 'app', 'other');
  ALTER TYPE "public"."enum_services_icon" ADD VALUE 'refresh' BEFORE 'shopping-cart';
  ALTER TYPE "public"."enum__services_v_version_icon" ADD VALUE 'refresh' BEFORE 'shopping-cart';
  CREATE TABLE "contacts_website_issues" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_contacts_website_issues",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  
  CREATE TABLE "projects_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "_projects_v_version_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "home_paths_new_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "home_paths_redesign_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "home_audit_symptoms" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "home_guarantees" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "_home_v_version_paths_new_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_paths_redesign_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_audit_symptoms" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_guarantees" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "contacts" ALTER COLUMN "project_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_contacts_project_type";
  CREATE TYPE "public"."enum_contacts_project_type" AS ENUM('web', 'redesign', 'audit', 'ecommerce', 'maintenance', 'custom', 'discord-bot', 'fivem-script', 'fivem-server');
  ALTER TABLE "contacts" ALTER COLUMN "project_type" SET DATA TYPE "public"."enum_contacts_project_type" USING "project_type"::"public"."enum_contacts_project_type";
  ALTER TABLE "services" ALTER COLUMN "contact_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_services_contact_type";
  CREATE TYPE "public"."enum_services_contact_type" AS ENUM('web', 'redesign', 'audit', 'ecommerce', 'maintenance', 'custom', 'discord-bot', 'fivem-script', 'fivem-server');
  ALTER TABLE "services" ALTER COLUMN "contact_type" SET DATA TYPE "public"."enum_services_contact_type" USING "contact_type"::"public"."enum_services_contact_type";
  ALTER TABLE "_services_v" ALTER COLUMN "version_contact_type" SET DATA TYPE text;
  DROP TYPE "public"."enum__services_v_version_contact_type";
  CREATE TYPE "public"."enum__services_v_version_contact_type" AS ENUM('web', 'redesign', 'audit', 'ecommerce', 'maintenance', 'custom', 'discord-bot', 'fivem-script', 'fivem-server');
  ALTER TABLE "_services_v" ALTER COLUMN "version_contact_type" SET DATA TYPE "public"."enum__services_v_version_contact_type" USING "version_contact_type"::"public"."enum__services_v_version_contact_type";
  ALTER TABLE "contacts" ADD COLUMN "current_url" varchar;
  ALTER TABLE "services" ADD COLUMN "line" "enum_services_line" DEFAULT 'web';
  ALTER TABLE "_services_v" ADD COLUMN "version_line" "enum__services_v_version_line" DEFAULT 'web';
  ALTER TABLE "projects" ADD COLUMN "kind" "enum_projects_kind" DEFAULT 'new-website';
  ALTER TABLE "projects" ADD COLUMN "concept" boolean DEFAULT false;
  ALTER TABLE "projects_locales" ADD COLUMN "sector" varchar;
  ALTER TABLE "projects_locales" ADD COLUMN "challenge" varchar;
  ALTER TABLE "projects_locales" ADD COLUMN "solution" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_kind" "enum__projects_v_version_kind" DEFAULT 'new-website';
  ALTER TABLE "_projects_v" ADD COLUMN "version_concept" boolean DEFAULT false;
  ALTER TABLE "_projects_v_locales" ADD COLUMN "version_sector" varchar;
  ALTER TABLE "_projects_v_locales" ADD COLUMN "version_challenge" varchar;
  ALTER TABLE "_projects_v_locales" ADD COLUMN "version_solution" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "paths_title" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "paths_new_title" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "paths_new_text" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "paths_new_price" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "paths_redesign_title" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "paths_redesign_text" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "paths_redesign_price" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "audit_eyebrow" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "audit_title" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "audit_lead" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "audit_offer_title" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "audit_offer_text" varchar;
  ALTER TABLE "home_locales" ADD COLUMN "sectors_line" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_paths_title" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_paths_new_title" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_paths_new_text" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_paths_new_price" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_paths_redesign_title" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_paths_redesign_text" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_paths_redesign_price" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_audit_eyebrow" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_audit_title" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_audit_lead" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_audit_offer_title" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_audit_offer_text" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_sectors_line" varchar;
  ALTER TABLE "contacts_website_issues" ADD CONSTRAINT "contacts_website_issues_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_results" ADD CONSTRAINT "projects_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_results" ADD CONSTRAINT "_projects_v_version_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_paths_new_points" ADD CONSTRAINT "home_paths_new_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_paths_redesign_points" ADD CONSTRAINT "home_paths_redesign_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_audit_symptoms" ADD CONSTRAINT "home_audit_symptoms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_guarantees" ADD CONSTRAINT "home_guarantees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_paths_new_points" ADD CONSTRAINT "_home_v_version_paths_new_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_paths_redesign_points" ADD CONSTRAINT "_home_v_version_paths_redesign_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_audit_symptoms" ADD CONSTRAINT "_home_v_version_audit_symptoms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_guarantees" ADD CONSTRAINT "_home_v_version_guarantees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "contacts_website_issues_order_idx" ON "contacts_website_issues" USING btree ("order");
  CREATE INDEX "contacts_website_issues_parent_idx" ON "contacts_website_issues" USING btree ("parent_id");
  CREATE INDEX "projects_results_order_idx" ON "projects_results" USING btree ("_order");
  CREATE INDEX "projects_results_parent_id_idx" ON "projects_results" USING btree ("_parent_id");
  CREATE INDEX "projects_results_locale_idx" ON "projects_results" USING btree ("_locale");
  CREATE INDEX "_projects_v_version_results_order_idx" ON "_projects_v_version_results" USING btree ("_order");
  CREATE INDEX "_projects_v_version_results_parent_id_idx" ON "_projects_v_version_results" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_results_locale_idx" ON "_projects_v_version_results" USING btree ("_locale");
  CREATE INDEX "home_paths_new_points_order_idx" ON "home_paths_new_points" USING btree ("_order");
  CREATE INDEX "home_paths_new_points_parent_id_idx" ON "home_paths_new_points" USING btree ("_parent_id");
  CREATE INDEX "home_paths_new_points_locale_idx" ON "home_paths_new_points" USING btree ("_locale");
  CREATE INDEX "home_paths_redesign_points_order_idx" ON "home_paths_redesign_points" USING btree ("_order");
  CREATE INDEX "home_paths_redesign_points_parent_id_idx" ON "home_paths_redesign_points" USING btree ("_parent_id");
  CREATE INDEX "home_paths_redesign_points_locale_idx" ON "home_paths_redesign_points" USING btree ("_locale");
  CREATE INDEX "home_audit_symptoms_order_idx" ON "home_audit_symptoms" USING btree ("_order");
  CREATE INDEX "home_audit_symptoms_parent_id_idx" ON "home_audit_symptoms" USING btree ("_parent_id");
  CREATE INDEX "home_audit_symptoms_locale_idx" ON "home_audit_symptoms" USING btree ("_locale");
  CREATE INDEX "home_guarantees_order_idx" ON "home_guarantees" USING btree ("_order");
  CREATE INDEX "home_guarantees_parent_id_idx" ON "home_guarantees" USING btree ("_parent_id");
  CREATE INDEX "home_guarantees_locale_idx" ON "home_guarantees" USING btree ("_locale");
  CREATE INDEX "_home_v_version_paths_new_points_order_idx" ON "_home_v_version_paths_new_points" USING btree ("_order");
  CREATE INDEX "_home_v_version_paths_new_points_parent_id_idx" ON "_home_v_version_paths_new_points" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_paths_new_points_locale_idx" ON "_home_v_version_paths_new_points" USING btree ("_locale");
  CREATE INDEX "_home_v_version_paths_redesign_points_order_idx" ON "_home_v_version_paths_redesign_points" USING btree ("_order");
  CREATE INDEX "_home_v_version_paths_redesign_points_parent_id_idx" ON "_home_v_version_paths_redesign_points" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_paths_redesign_points_locale_idx" ON "_home_v_version_paths_redesign_points" USING btree ("_locale");
  CREATE INDEX "_home_v_version_audit_symptoms_order_idx" ON "_home_v_version_audit_symptoms" USING btree ("_order");
  CREATE INDEX "_home_v_version_audit_symptoms_parent_id_idx" ON "_home_v_version_audit_symptoms" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_audit_symptoms_locale_idx" ON "_home_v_version_audit_symptoms" USING btree ("_locale");
  CREATE INDEX "_home_v_version_guarantees_order_idx" ON "_home_v_version_guarantees" USING btree ("_order");
  CREATE INDEX "_home_v_version_guarantees_parent_id_idx" ON "_home_v_version_guarantees" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_guarantees_locale_idx" ON "_home_v_version_guarantees" USING btree ("_locale");
  -- Existing non-website services move to the "Other development" line (new column defaults to the main web line).
  UPDATE "services" SET "line" = 'other' WHERE "contact_type" IN ('custom', 'discord-bot', 'fivem-script', 'fivem-server');
  UPDATE "_services_v" SET "version_line" = 'other' WHERE "version_contact_type" IN ('custom', 'discord-bot', 'fivem-script', 'fivem-server');
  -- Existing projects: the two web apps are not websites for businesses.
  UPDATE "projects" SET "kind" = 'app' WHERE "id" IN (SELECT "_parent_id" FROM "projects_locales" WHERE "slug" IN ('que-comemos-hoy', 'trading-journal'));
  UPDATE "projects" SET "kind" = 'redesign' WHERE "id" IN (SELECT "_parent_id" FROM "projects_locales" WHERE "slug" = 'portal-web-institucional');
  -- Same on the version rows: Payload merges updates onto the latest version, which would otherwise reset the kind.
  UPDATE "_projects_v" SET "version_kind" = 'app' WHERE "parent_id" IN (SELECT "_parent_id" FROM "projects_locales" WHERE "slug" IN ('que-comemos-hoy', 'trading-journal'));
  UPDATE "_projects_v" SET "version_kind" = 'redesign' WHERE "parent_id" IN (SELECT "_parent_id" FROM "projects_locales" WHERE "slug" = 'portal-web-institucional');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "contacts_website_issues" CASCADE;
  DROP TABLE "projects_results" CASCADE;
  DROP TABLE "_projects_v_version_results" CASCADE;
  DROP TABLE "home_paths_new_points" CASCADE;
  DROP TABLE "home_paths_redesign_points" CASCADE;
  DROP TABLE "home_audit_symptoms" CASCADE;
  DROP TABLE "home_guarantees" CASCADE;
  DROP TABLE "_home_v_version_paths_new_points" CASCADE;
  DROP TABLE "_home_v_version_paths_redesign_points" CASCADE;
  DROP TABLE "_home_v_version_audit_symptoms" CASCADE;
  DROP TABLE "_home_v_version_guarantees" CASCADE;
  ALTER TABLE "contacts" ALTER COLUMN "project_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_contacts_project_type";
  CREATE TYPE "public"."enum_contacts_project_type" AS ENUM('web', 'ecommerce', 'fivem-script', 'fivem-server', 'discord-bot', 'maintenance', 'custom');
  ALTER TABLE "contacts" ALTER COLUMN "project_type" SET DATA TYPE "public"."enum_contacts_project_type" USING "project_type"::"public"."enum_contacts_project_type";
  ALTER TABLE "services" ALTER COLUMN "icon" SET DATA TYPE text;
  DROP TYPE "public"."enum_services_icon";
  CREATE TYPE "public"."enum_services_icon" AS ENUM('globe', 'shopping-cart', 'code', 'server', 'bot', 'wrench', 'sparkles');
  ALTER TABLE "services" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_services_icon" USING "icon"::"public"."enum_services_icon";
  ALTER TABLE "services" ALTER COLUMN "contact_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_services_contact_type";
  CREATE TYPE "public"."enum_services_contact_type" AS ENUM('web', 'ecommerce', 'fivem-script', 'fivem-server', 'discord-bot', 'maintenance', 'custom');
  ALTER TABLE "services" ALTER COLUMN "contact_type" SET DATA TYPE "public"."enum_services_contact_type" USING "contact_type"::"public"."enum_services_contact_type";
  ALTER TABLE "_services_v" ALTER COLUMN "version_icon" SET DATA TYPE text;
  DROP TYPE "public"."enum__services_v_version_icon";
  CREATE TYPE "public"."enum__services_v_version_icon" AS ENUM('globe', 'shopping-cart', 'code', 'server', 'bot', 'wrench', 'sparkles');
  ALTER TABLE "_services_v" ALTER COLUMN "version_icon" SET DATA TYPE "public"."enum__services_v_version_icon" USING "version_icon"::"public"."enum__services_v_version_icon";
  ALTER TABLE "_services_v" ALTER COLUMN "version_contact_type" SET DATA TYPE text;
  DROP TYPE "public"."enum__services_v_version_contact_type";
  CREATE TYPE "public"."enum__services_v_version_contact_type" AS ENUM('web', 'ecommerce', 'fivem-script', 'fivem-server', 'discord-bot', 'maintenance', 'custom');
  ALTER TABLE "_services_v" ALTER COLUMN "version_contact_type" SET DATA TYPE "public"."enum__services_v_version_contact_type" USING "version_contact_type"::"public"."enum__services_v_version_contact_type";
  ALTER TABLE "contacts" DROP COLUMN "current_url";
  ALTER TABLE "services" DROP COLUMN "line";
  ALTER TABLE "_services_v" DROP COLUMN "version_line";
  ALTER TABLE "projects" DROP COLUMN "kind";
  ALTER TABLE "projects" DROP COLUMN "concept";
  ALTER TABLE "projects_locales" DROP COLUMN "sector";
  ALTER TABLE "projects_locales" DROP COLUMN "challenge";
  ALTER TABLE "projects_locales" DROP COLUMN "solution";
  ALTER TABLE "_projects_v" DROP COLUMN "version_kind";
  ALTER TABLE "_projects_v" DROP COLUMN "version_concept";
  ALTER TABLE "_projects_v_locales" DROP COLUMN "version_sector";
  ALTER TABLE "_projects_v_locales" DROP COLUMN "version_challenge";
  ALTER TABLE "_projects_v_locales" DROP COLUMN "version_solution";
  ALTER TABLE "home_locales" DROP COLUMN "paths_title";
  ALTER TABLE "home_locales" DROP COLUMN "paths_new_title";
  ALTER TABLE "home_locales" DROP COLUMN "paths_new_text";
  ALTER TABLE "home_locales" DROP COLUMN "paths_new_price";
  ALTER TABLE "home_locales" DROP COLUMN "paths_redesign_title";
  ALTER TABLE "home_locales" DROP COLUMN "paths_redesign_text";
  ALTER TABLE "home_locales" DROP COLUMN "paths_redesign_price";
  ALTER TABLE "home_locales" DROP COLUMN "audit_eyebrow";
  ALTER TABLE "home_locales" DROP COLUMN "audit_title";
  ALTER TABLE "home_locales" DROP COLUMN "audit_lead";
  ALTER TABLE "home_locales" DROP COLUMN "audit_offer_title";
  ALTER TABLE "home_locales" DROP COLUMN "audit_offer_text";
  ALTER TABLE "home_locales" DROP COLUMN "sectors_line";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_paths_title";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_paths_new_title";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_paths_new_text";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_paths_new_price";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_paths_redesign_title";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_paths_redesign_text";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_paths_redesign_price";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_audit_eyebrow";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_audit_title";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_audit_lead";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_audit_offer_title";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_audit_offer_text";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_sectors_line";
  DROP TYPE "public"."enum_contacts_website_issues";
  DROP TYPE "public"."enum_services_line";
  DROP TYPE "public"."enum__services_v_version_line";
  DROP TYPE "public"."enum_projects_kind";
  DROP TYPE "public"."enum__projects_v_version_kind";`)
}
