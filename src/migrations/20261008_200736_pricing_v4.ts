import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Pricing v4 (S15): web plans priced "with maintenance" / "web only", maintenance plans, notes, comparison and extras.
// Old package prices and the custom-service card are dropped; existing package rows keep their slug/name and are
// hidden by the site until the seed (or the panel) fills in the new prices. Generated in two passes (drops, then
// additions) so drizzle never asks whether a column was renamed; the .json snapshot is the final schema.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pricing_packages" DROP COLUMN "initial_price";
  ALTER TABLE "pricing_packages" DROP COLUMN "monthly_price";
  ALTER TABLE "pricing" DROP COLUMN "custom_from_price";
  ALTER TABLE "pricing" DROP COLUMN "custom_monthly_price";
  ALTER TABLE "pricing_locales" DROP COLUMN "custom_title";
  ALTER TABLE "pricing_locales" DROP COLUMN "custom_subtitle";
  ALTER TABLE "pricing_locales" DROP COLUMN "custom_description";
  ALTER TABLE "pricing_locales" DROP COLUMN "custom_cta_label";
  ALTER TABLE "_pricing_v_version_packages" DROP COLUMN "initial_price";
  ALTER TABLE "_pricing_v_version_packages" DROP COLUMN "monthly_price";
  ALTER TABLE "_pricing_v" DROP COLUMN "version_custom_from_price";
  ALTER TABLE "_pricing_v" DROP COLUMN "version_custom_monthly_price";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_custom_title";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_custom_subtitle";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_custom_description";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_custom_cta_label";
  CREATE TYPE "public"."enum_pricing_packages_contact_type" AS ENUM('web', 'ecommerce', 'custom');
  CREATE TYPE "public"."enum__pricing_v_version_packages_contact_type" AS ENUM('web', 'ecommerce', 'custom');
  CREATE TABLE "pricing_web_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pricing_maintenance_plans_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"excluded" boolean DEFAULT false
  );
  
  CREATE TABLE "pricing_maintenance_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"monthly_price" numeric,
  	"permanence_months" numeric,
  	"featured" boolean DEFAULT false
  );
  
  CREATE TABLE "pricing_maintenance_plans_locales" (
  	"name" varchar,
  	"pitch" varchar,
  	"cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pricing_change_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pricing_comparison_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"with_plan" varchar,
  	"web_only" varchar
  );
  
  CREATE TABLE "pricing_permanence_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pricing_extras_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"with_plan" numeric,
  	"without_plan" numeric
  );
  
  CREATE TABLE "pricing_extras_rows_locales" (
  	"service" varchar,
  	"with_plan_text" varchar,
  	"without_plan_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pricing_v_version_web_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pricing_v_version_maintenance_plans_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"excluded" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pricing_v_version_maintenance_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"monthly_price" numeric,
  	"permanence_months" numeric,
  	"featured" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pricing_v_version_maintenance_plans_locales" (
  	"name" varchar,
  	"pitch" varchar,
  	"cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pricing_v_version_change_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pricing_v_version_comparison_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"with_plan" varchar,
  	"web_only" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pricing_v_version_permanence_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pricing_v_version_extras_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"with_plan" numeric,
  	"without_plan" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pricing_v_version_extras_rows_locales" (
  	"service" varchar,
  	"with_plan_text" varchar,
  	"without_plan_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pricing_packages" ADD COLUMN "price_with_maintenance" numeric;
  ALTER TABLE "pricing_packages" ADD COLUMN "price_web_only" numeric;
  ALTER TABLE "pricing_packages" ADD COLUMN "from_price" boolean DEFAULT false;
  ALTER TABLE "pricing_packages" ADD COLUMN "min_plan" varchar;
  ALTER TABLE "pricing_packages" ADD COLUMN "contact_type" "enum_pricing_packages_contact_type" DEFAULT 'web';
  ALTER TABLE "pricing_packages" ADD COLUMN "is_new" boolean DEFAULT false;
  ALTER TABLE "pricing_packages_locales" ADD COLUMN "pitch" varchar;
  ALTER TABLE "pricing_packages_locales" ADD COLUMN "items_lead" varchar;
  ALTER TABLE "pricing" ADD COLUMN "custom_support_from_price" numeric;
  ALTER TABLE "pricing" ADD COLUMN "custom_support_permanence_months" numeric;
  ALTER TABLE "pricing_locales" ADD COLUMN "web_title" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "web_intro" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "maintenance_title" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "maintenance_intro" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "custom_support_title" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "custom_support_text" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "comparison_title" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "comparison_intro" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "extras_title" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "extras_intro" varchar;
  ALTER TABLE "_pricing_v_version_packages" ADD COLUMN "price_with_maintenance" numeric;
  ALTER TABLE "_pricing_v_version_packages" ADD COLUMN "price_web_only" numeric;
  ALTER TABLE "_pricing_v_version_packages" ADD COLUMN "from_price" boolean DEFAULT false;
  ALTER TABLE "_pricing_v_version_packages" ADD COLUMN "min_plan" varchar;
  ALTER TABLE "_pricing_v_version_packages" ADD COLUMN "contact_type" "enum__pricing_v_version_packages_contact_type" DEFAULT 'web';
  ALTER TABLE "_pricing_v_version_packages" ADD COLUMN "is_new" boolean DEFAULT false;
  ALTER TABLE "_pricing_v_version_packages_locales" ADD COLUMN "pitch" varchar;
  ALTER TABLE "_pricing_v_version_packages_locales" ADD COLUMN "items_lead" varchar;
  ALTER TABLE "_pricing_v" ADD COLUMN "version_custom_support_from_price" numeric;
  ALTER TABLE "_pricing_v" ADD COLUMN "version_custom_support_permanence_months" numeric;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_web_title" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_web_intro" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_maintenance_title" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_maintenance_intro" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_custom_support_title" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_custom_support_text" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_comparison_title" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_comparison_intro" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_extras_title" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_extras_intro" varchar;
  ALTER TABLE "pricing_web_notes" ADD CONSTRAINT "pricing_web_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_maintenance_plans_items" ADD CONSTRAINT "pricing_maintenance_plans_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing_maintenance_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_maintenance_plans" ADD CONSTRAINT "pricing_maintenance_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_maintenance_plans_locales" ADD CONSTRAINT "pricing_maintenance_plans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing_maintenance_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_change_notes" ADD CONSTRAINT "pricing_change_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_comparison_rows" ADD CONSTRAINT "pricing_comparison_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_permanence_rules" ADD CONSTRAINT "pricing_permanence_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_extras_rows" ADD CONSTRAINT "pricing_extras_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_extras_rows_locales" ADD CONSTRAINT "pricing_extras_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing_extras_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_web_notes" ADD CONSTRAINT "_pricing_v_version_web_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_maintenance_plans_items" ADD CONSTRAINT "_pricing_v_version_maintenance_plans_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v_version_maintenance_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_maintenance_plans" ADD CONSTRAINT "_pricing_v_version_maintenance_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_maintenance_plans_locales" ADD CONSTRAINT "_pricing_v_version_maintenance_plans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v_version_maintenance_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_change_notes" ADD CONSTRAINT "_pricing_v_version_change_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_comparison_rows" ADD CONSTRAINT "_pricing_v_version_comparison_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_permanence_rules" ADD CONSTRAINT "_pricing_v_version_permanence_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_extras_rows" ADD CONSTRAINT "_pricing_v_version_extras_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_extras_rows_locales" ADD CONSTRAINT "_pricing_v_version_extras_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v_version_extras_rows"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pricing_web_notes_order_idx" ON "pricing_web_notes" USING btree ("_order");
  CREATE INDEX "pricing_web_notes_parent_id_idx" ON "pricing_web_notes" USING btree ("_parent_id");
  CREATE INDEX "pricing_web_notes_locale_idx" ON "pricing_web_notes" USING btree ("_locale");
  CREATE INDEX "pricing_maintenance_plans_items_order_idx" ON "pricing_maintenance_plans_items" USING btree ("_order");
  CREATE INDEX "pricing_maintenance_plans_items_parent_id_idx" ON "pricing_maintenance_plans_items" USING btree ("_parent_id");
  CREATE INDEX "pricing_maintenance_plans_items_locale_idx" ON "pricing_maintenance_plans_items" USING btree ("_locale");
  CREATE INDEX "pricing_maintenance_plans_order_idx" ON "pricing_maintenance_plans" USING btree ("_order");
  CREATE INDEX "pricing_maintenance_plans_parent_id_idx" ON "pricing_maintenance_plans" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pricing_maintenance_plans_locales_locale_parent_id_unique" ON "pricing_maintenance_plans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pricing_change_notes_order_idx" ON "pricing_change_notes" USING btree ("_order");
  CREATE INDEX "pricing_change_notes_parent_id_idx" ON "pricing_change_notes" USING btree ("_parent_id");
  CREATE INDEX "pricing_change_notes_locale_idx" ON "pricing_change_notes" USING btree ("_locale");
  CREATE INDEX "pricing_comparison_rows_order_idx" ON "pricing_comparison_rows" USING btree ("_order");
  CREATE INDEX "pricing_comparison_rows_parent_id_idx" ON "pricing_comparison_rows" USING btree ("_parent_id");
  CREATE INDEX "pricing_comparison_rows_locale_idx" ON "pricing_comparison_rows" USING btree ("_locale");
  CREATE INDEX "pricing_permanence_rules_order_idx" ON "pricing_permanence_rules" USING btree ("_order");
  CREATE INDEX "pricing_permanence_rules_parent_id_idx" ON "pricing_permanence_rules" USING btree ("_parent_id");
  CREATE INDEX "pricing_permanence_rules_locale_idx" ON "pricing_permanence_rules" USING btree ("_locale");
  CREATE INDEX "pricing_extras_rows_order_idx" ON "pricing_extras_rows" USING btree ("_order");
  CREATE INDEX "pricing_extras_rows_parent_id_idx" ON "pricing_extras_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pricing_extras_rows_locales_locale_parent_id_unique" ON "pricing_extras_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pricing_v_version_web_notes_order_idx" ON "_pricing_v_version_web_notes" USING btree ("_order");
  CREATE INDEX "_pricing_v_version_web_notes_parent_id_idx" ON "_pricing_v_version_web_notes" USING btree ("_parent_id");
  CREATE INDEX "_pricing_v_version_web_notes_locale_idx" ON "_pricing_v_version_web_notes" USING btree ("_locale");
  CREATE INDEX "_pricing_v_version_maintenance_plans_items_order_idx" ON "_pricing_v_version_maintenance_plans_items" USING btree ("_order");
  CREATE INDEX "_pricing_v_version_maintenance_plans_items_parent_id_idx" ON "_pricing_v_version_maintenance_plans_items" USING btree ("_parent_id");
  CREATE INDEX "_pricing_v_version_maintenance_plans_items_locale_idx" ON "_pricing_v_version_maintenance_plans_items" USING btree ("_locale");
  CREATE INDEX "_pricing_v_version_maintenance_plans_order_idx" ON "_pricing_v_version_maintenance_plans" USING btree ("_order");
  CREATE INDEX "_pricing_v_version_maintenance_plans_parent_id_idx" ON "_pricing_v_version_maintenance_plans" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pricing_v_version_maintenance_plans_locales_locale_parent_i" ON "_pricing_v_version_maintenance_plans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pricing_v_version_change_notes_order_idx" ON "_pricing_v_version_change_notes" USING btree ("_order");
  CREATE INDEX "_pricing_v_version_change_notes_parent_id_idx" ON "_pricing_v_version_change_notes" USING btree ("_parent_id");
  CREATE INDEX "_pricing_v_version_change_notes_locale_idx" ON "_pricing_v_version_change_notes" USING btree ("_locale");
  CREATE INDEX "_pricing_v_version_comparison_rows_order_idx" ON "_pricing_v_version_comparison_rows" USING btree ("_order");
  CREATE INDEX "_pricing_v_version_comparison_rows_parent_id_idx" ON "_pricing_v_version_comparison_rows" USING btree ("_parent_id");
  CREATE INDEX "_pricing_v_version_comparison_rows_locale_idx" ON "_pricing_v_version_comparison_rows" USING btree ("_locale");
  CREATE INDEX "_pricing_v_version_permanence_rules_order_idx" ON "_pricing_v_version_permanence_rules" USING btree ("_order");
  CREATE INDEX "_pricing_v_version_permanence_rules_parent_id_idx" ON "_pricing_v_version_permanence_rules" USING btree ("_parent_id");
  CREATE INDEX "_pricing_v_version_permanence_rules_locale_idx" ON "_pricing_v_version_permanence_rules" USING btree ("_locale");
  CREATE INDEX "_pricing_v_version_extras_rows_order_idx" ON "_pricing_v_version_extras_rows" USING btree ("_order");
  CREATE INDEX "_pricing_v_version_extras_rows_parent_id_idx" ON "_pricing_v_version_extras_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pricing_v_version_extras_rows_locales_locale_parent_id_uniq" ON "_pricing_v_version_extras_rows_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pricing_web_notes" CASCADE;
  DROP TABLE "pricing_maintenance_plans_items" CASCADE;
  DROP TABLE "pricing_maintenance_plans" CASCADE;
  DROP TABLE "pricing_maintenance_plans_locales" CASCADE;
  DROP TABLE "pricing_change_notes" CASCADE;
  DROP TABLE "pricing_comparison_rows" CASCADE;
  DROP TABLE "pricing_permanence_rules" CASCADE;
  DROP TABLE "pricing_extras_rows" CASCADE;
  DROP TABLE "pricing_extras_rows_locales" CASCADE;
  DROP TABLE "_pricing_v_version_web_notes" CASCADE;
  DROP TABLE "_pricing_v_version_maintenance_plans_items" CASCADE;
  DROP TABLE "_pricing_v_version_maintenance_plans" CASCADE;
  DROP TABLE "_pricing_v_version_maintenance_plans_locales" CASCADE;
  DROP TABLE "_pricing_v_version_change_notes" CASCADE;
  DROP TABLE "_pricing_v_version_comparison_rows" CASCADE;
  DROP TABLE "_pricing_v_version_permanence_rules" CASCADE;
  DROP TABLE "_pricing_v_version_extras_rows" CASCADE;
  DROP TABLE "_pricing_v_version_extras_rows_locales" CASCADE;
  ALTER TABLE "pricing_packages" DROP COLUMN "price_with_maintenance";
  ALTER TABLE "pricing_packages" DROP COLUMN "price_web_only";
  ALTER TABLE "pricing_packages" DROP COLUMN "from_price";
  ALTER TABLE "pricing_packages" DROP COLUMN "min_plan";
  ALTER TABLE "pricing_packages" DROP COLUMN "contact_type";
  ALTER TABLE "pricing_packages" DROP COLUMN "is_new";
  ALTER TABLE "pricing_packages_locales" DROP COLUMN "pitch";
  ALTER TABLE "pricing_packages_locales" DROP COLUMN "items_lead";
  ALTER TABLE "pricing" DROP COLUMN "custom_support_from_price";
  ALTER TABLE "pricing" DROP COLUMN "custom_support_permanence_months";
  ALTER TABLE "pricing_locales" DROP COLUMN "web_title";
  ALTER TABLE "pricing_locales" DROP COLUMN "web_intro";
  ALTER TABLE "pricing_locales" DROP COLUMN "maintenance_title";
  ALTER TABLE "pricing_locales" DROP COLUMN "maintenance_intro";
  ALTER TABLE "pricing_locales" DROP COLUMN "custom_support_title";
  ALTER TABLE "pricing_locales" DROP COLUMN "custom_support_text";
  ALTER TABLE "pricing_locales" DROP COLUMN "comparison_title";
  ALTER TABLE "pricing_locales" DROP COLUMN "comparison_intro";
  ALTER TABLE "pricing_locales" DROP COLUMN "extras_title";
  ALTER TABLE "pricing_locales" DROP COLUMN "extras_intro";
  ALTER TABLE "_pricing_v_version_packages" DROP COLUMN "price_with_maintenance";
  ALTER TABLE "_pricing_v_version_packages" DROP COLUMN "price_web_only";
  ALTER TABLE "_pricing_v_version_packages" DROP COLUMN "from_price";
  ALTER TABLE "_pricing_v_version_packages" DROP COLUMN "min_plan";
  ALTER TABLE "_pricing_v_version_packages" DROP COLUMN "contact_type";
  ALTER TABLE "_pricing_v_version_packages" DROP COLUMN "is_new";
  ALTER TABLE "_pricing_v_version_packages_locales" DROP COLUMN "pitch";
  ALTER TABLE "_pricing_v_version_packages_locales" DROP COLUMN "items_lead";
  ALTER TABLE "_pricing_v" DROP COLUMN "version_custom_support_from_price";
  ALTER TABLE "_pricing_v" DROP COLUMN "version_custom_support_permanence_months";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_web_title";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_web_intro";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_maintenance_title";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_maintenance_intro";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_custom_support_title";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_custom_support_text";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_comparison_title";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_comparison_intro";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_extras_title";
  ALTER TABLE "_pricing_v_locales" DROP COLUMN "version_extras_intro";
  DROP TYPE "public"."enum_pricing_packages_contact_type";
  DROP TYPE "public"."enum__pricing_v_version_packages_contact_type";
  ALTER TABLE "pricing_packages" ADD COLUMN "initial_price" numeric;
  ALTER TABLE "pricing_packages" ADD COLUMN "monthly_price" numeric;
  ALTER TABLE "pricing" ADD COLUMN "custom_from_price" numeric;
  ALTER TABLE "pricing" ADD COLUMN "custom_monthly_price" numeric;
  ALTER TABLE "pricing_locales" ADD COLUMN "custom_title" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "custom_subtitle" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "custom_description" varchar;
  ALTER TABLE "pricing_locales" ADD COLUMN "custom_cta_label" varchar;
  ALTER TABLE "_pricing_v_version_packages" ADD COLUMN "initial_price" numeric;
  ALTER TABLE "_pricing_v_version_packages" ADD COLUMN "monthly_price" numeric;
  ALTER TABLE "_pricing_v" ADD COLUMN "version_custom_from_price" numeric;
  ALTER TABLE "_pricing_v" ADD COLUMN "version_custom_monthly_price" numeric;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_custom_title" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_custom_subtitle" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_custom_description" varchar;
  ALTER TABLE "_pricing_v_locales" ADD COLUMN "version_custom_cta_label" varchar;`)
}
