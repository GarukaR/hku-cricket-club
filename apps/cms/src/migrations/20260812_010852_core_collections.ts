import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_matches_result_innings_side" AS ENUM('hku', 'opponent');
  CREATE TYPE "public"."enum_matches_venue" AS ENUM('home', 'away');
  CREATE TYPE "public"."enum_matches_result_outcome" AS ENUM('won', 'lost', 'drawn', 'tied', 'abandoned', 'conceded');
  CREATE TYPE "public"."enum_matches_result_margin_unit" AS ENUM('runs', 'wickets');
  CREATE TABLE "teams" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "teams_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "seasons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "competitions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"division" varchar,
  	"label" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "matches_result_innings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"side" "enum_matches_result_innings_side" NOT NULL,
  	"runs" numeric NOT NULL,
  	"wickets" numeric,
  	"overs" varchar,
  	"extras" numeric
  );
  
  CREATE TABLE "matches" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"team_id" integer NOT NULL,
  	"season_id" integer NOT NULL,
  	"competition_id" integer,
  	"date" timestamp(3) with time zone NOT NULL,
  	"start_time" varchar,
  	"opponent" varchar NOT NULL,
  	"venue" "enum_matches_venue" NOT NULL,
  	"ground" varchar,
  	"format" varchar,
  	"scorecard" varchar,
  	"result_outcome" "enum_matches_result_outcome",
  	"result_margin_value" numeric,
  	"result_margin_unit" "enum_matches_result_margin_unit",
  	"summary" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "teams_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "seasons_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "competitions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "matches_id" integer;
  ALTER TABLE "teams_texts" ADD CONSTRAINT "teams_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "matches_result_innings" ADD CONSTRAINT "matches_result_innings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "matches" ADD CONSTRAINT "matches_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "matches" ADD CONSTRAINT "matches_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "teams_name_idx" ON "teams" USING btree ("name");
  CREATE UNIQUE INDEX "teams_slug_idx" ON "teams" USING btree ("slug");
  CREATE INDEX "teams_updated_at_idx" ON "teams" USING btree ("updated_at");
  CREATE INDEX "teams_created_at_idx" ON "teams" USING btree ("created_at");
  CREATE INDEX "teams_texts_order_parent" ON "teams_texts" USING btree ("order","parent_id");
  CREATE UNIQUE INDEX "seasons_name_idx" ON "seasons" USING btree ("name");
  CREATE INDEX "seasons_updated_at_idx" ON "seasons" USING btree ("updated_at");
  CREATE INDEX "seasons_created_at_idx" ON "seasons" USING btree ("created_at");
  CREATE UNIQUE INDEX "competitions_label_idx" ON "competitions" USING btree ("label");
  CREATE INDEX "competitions_updated_at_idx" ON "competitions" USING btree ("updated_at");
  CREATE INDEX "competitions_created_at_idx" ON "competitions" USING btree ("created_at");
  CREATE INDEX "matches_result_innings_order_idx" ON "matches_result_innings" USING btree ("_order");
  CREATE INDEX "matches_result_innings_parent_id_idx" ON "matches_result_innings" USING btree ("_parent_id");
  CREATE INDEX "matches_team_idx" ON "matches" USING btree ("team_id");
  CREATE INDEX "matches_season_idx" ON "matches" USING btree ("season_id");
  CREATE INDEX "matches_competition_idx" ON "matches" USING btree ("competition_id");
  CREATE INDEX "matches_date_idx" ON "matches" USING btree ("date");
  CREATE INDEX "matches_summary_idx" ON "matches" USING btree ("summary");
  CREATE INDEX "matches_updated_at_idx" ON "matches" USING btree ("updated_at");
  CREATE INDEX "matches_created_at_idx" ON "matches" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teams_fk" FOREIGN KEY ("teams_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_seasons_fk" FOREIGN KEY ("seasons_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_competitions_fk" FOREIGN KEY ("competitions_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_matches_fk" FOREIGN KEY ("matches_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_teams_id_idx" ON "payload_locked_documents_rels" USING btree ("teams_id");
  CREATE INDEX "payload_locked_documents_rels_seasons_id_idx" ON "payload_locked_documents_rels" USING btree ("seasons_id");
  CREATE INDEX "payload_locked_documents_rels_competitions_id_idx" ON "payload_locked_documents_rels" USING btree ("competitions_id");
  CREATE INDEX "payload_locked_documents_rels_matches_id_idx" ON "payload_locked_documents_rels" USING btree ("matches_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "teams" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "teams_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "seasons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "competitions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "matches_result_innings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "matches" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "teams" CASCADE;
  DROP TABLE "teams_texts" CASCADE;
  DROP TABLE "seasons" CASCADE;
  DROP TABLE "competitions" CASCADE;
  DROP TABLE "matches_result_innings" CASCADE;
  DROP TABLE "matches" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_teams_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_seasons_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_competitions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_matches_fk";
  
  DROP INDEX "payload_locked_documents_rels_teams_id_idx";
  DROP INDEX "payload_locked_documents_rels_seasons_id_idx";
  DROP INDEX "payload_locked_documents_rels_competitions_id_idx";
  DROP INDEX "payload_locked_documents_rels_matches_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "teams_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "seasons_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "competitions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "matches_id";
  DROP TYPE "public"."enum_matches_result_innings_side";
  DROP TYPE "public"."enum_matches_venue";
  DROP TYPE "public"."enum_matches_result_outcome";
  DROP TYPE "public"."enum_matches_result_margin_unit";`)
}
