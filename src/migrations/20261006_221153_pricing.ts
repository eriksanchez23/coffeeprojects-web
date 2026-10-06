import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pricing_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pricing_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pricing_v_published_locale" AS ENUM('es', 'en', 'fr');
  CREATE TABLE "pricing_packages_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"excluded" boolean DEFAULT false
  );
  
  CREATE TABLE "pricing_packages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"initial_price" numeric,
  	"monthly_price" numeric,
  	"featured" boolean DEFAULT false
  );
  
  CREATE TABLE "pricing_packages_locales" (
  	"name" varchar,
  	"cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pricing" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"custom_from_price" numeric,
  	"custom_monthly_price" numeric,
  	"seo_image_id" integer,
  	"_status" "enum_pricing_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "pricing_locales" (
  	"eyebrow" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"intro" varchar,
  	"custom_title" varchar,
  	"custom_subtitle" varchar,
  	"custom_description" varchar,
  	"custom_cta_label" varchar,
  	"vat_note" varchar,
  	"footnote" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pricing_v_version_packages_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"excluded" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pricing_v_version_packages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"initial_price" numeric,
  	"monthly_price" numeric,
  	"featured" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pricing_v_version_packages_locales" (
  	"name" varchar,
  	"cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pricing_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_custom_from_price" numeric,
  	"version_custom_monthly_price" numeric,
  	"version_seo_image_id" integer,
  	"version__status" "enum__pricing_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pricing_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pricing_v_locales" (
  	"version_eyebrow" varchar,
  	"version_title" varchar,
  	"version_subtitle" varchar,
  	"version_intro" varchar,
  	"version_custom_title" varchar,
  	"version_custom_subtitle" varchar,
  	"version_custom_description" varchar,
  	"version_custom_cta_label" varchar,
  	"version_vat_note" varchar,
  	"version_footnote" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "contacts" ADD COLUMN "plan" varchar;
  ALTER TABLE "pricing_packages_items" ADD CONSTRAINT "pricing_packages_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing_packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_packages" ADD CONSTRAINT "pricing_packages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_packages_locales" ADD CONSTRAINT "pricing_packages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing_packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing" ADD CONSTRAINT "pricing_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pricing_locales" ADD CONSTRAINT "pricing_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_packages_items" ADD CONSTRAINT "_pricing_v_version_packages_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v_version_packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_packages" ADD CONSTRAINT "_pricing_v_version_packages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v_version_packages_locales" ADD CONSTRAINT "_pricing_v_version_packages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v_version_packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pricing_v" ADD CONSTRAINT "_pricing_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pricing_v_locales" ADD CONSTRAINT "_pricing_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pricing_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pricing_packages_items_order_idx" ON "pricing_packages_items" USING btree ("_order");
  CREATE INDEX "pricing_packages_items_parent_id_idx" ON "pricing_packages_items" USING btree ("_parent_id");
  CREATE INDEX "pricing_packages_items_locale_idx" ON "pricing_packages_items" USING btree ("_locale");
  CREATE INDEX "pricing_packages_order_idx" ON "pricing_packages" USING btree ("_order");
  CREATE INDEX "pricing_packages_parent_id_idx" ON "pricing_packages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pricing_packages_locales_locale_parent_id_unique" ON "pricing_packages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pricing_seo_seo_image_idx" ON "pricing" USING btree ("seo_image_id");
  CREATE INDEX "pricing__status_idx" ON "pricing" USING btree ("_status");
  CREATE UNIQUE INDEX "pricing_locales_locale_parent_id_unique" ON "pricing_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pricing_v_version_packages_items_order_idx" ON "_pricing_v_version_packages_items" USING btree ("_order");
  CREATE INDEX "_pricing_v_version_packages_items_parent_id_idx" ON "_pricing_v_version_packages_items" USING btree ("_parent_id");
  CREATE INDEX "_pricing_v_version_packages_items_locale_idx" ON "_pricing_v_version_packages_items" USING btree ("_locale");
  CREATE INDEX "_pricing_v_version_packages_order_idx" ON "_pricing_v_version_packages" USING btree ("_order");
  CREATE INDEX "_pricing_v_version_packages_parent_id_idx" ON "_pricing_v_version_packages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pricing_v_version_packages_locales_locale_parent_id_unique" ON "_pricing_v_version_packages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pricing_v_version_seo_version_seo_image_idx" ON "_pricing_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_pricing_v_version_version__status_idx" ON "_pricing_v" USING btree ("version__status");
  CREATE INDEX "_pricing_v_created_at_idx" ON "_pricing_v" USING btree ("created_at");
  CREATE INDEX "_pricing_v_updated_at_idx" ON "_pricing_v" USING btree ("updated_at");
  CREATE INDEX "_pricing_v_snapshot_idx" ON "_pricing_v" USING btree ("snapshot");
  CREATE INDEX "_pricing_v_published_locale_idx" ON "_pricing_v" USING btree ("published_locale");
  CREATE INDEX "_pricing_v_latest_idx" ON "_pricing_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_pricing_v_locales_locale_parent_id_unique" ON "_pricing_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pricing_packages_items" CASCADE;
  DROP TABLE "pricing_packages" CASCADE;
  DROP TABLE "pricing_packages_locales" CASCADE;
  DROP TABLE "pricing" CASCADE;
  DROP TABLE "pricing_locales" CASCADE;
  DROP TABLE "_pricing_v_version_packages_items" CASCADE;
  DROP TABLE "_pricing_v_version_packages" CASCADE;
  DROP TABLE "_pricing_v_version_packages_locales" CASCADE;
  DROP TABLE "_pricing_v" CASCADE;
  DROP TABLE "_pricing_v_locales" CASCADE;
  ALTER TABLE "contacts" DROP COLUMN "plan";
  DROP TYPE "public"."enum_pricing_status";
  DROP TYPE "public"."enum__pricing_v_version_status";
  DROP TYPE "public"."enum__pricing_v_published_locale";`)
}
