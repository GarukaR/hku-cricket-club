import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "matches_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_matches_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "matches_texts" ADD CONSTRAINT "matches_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_matches_v_texts" ADD CONSTRAINT "_matches_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_matches_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "matches_texts_order_parent" ON "matches_texts" USING btree ("order","parent_id");
  CREATE INDEX "_matches_v_texts_order_parent" ON "_matches_v_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "matches_texts" CASCADE;
  DROP TABLE "_matches_v_texts" CASCADE;`)
}
