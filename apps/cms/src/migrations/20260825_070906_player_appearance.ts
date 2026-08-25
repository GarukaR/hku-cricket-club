import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_teams_role" AS ENUM('league', 'challenge-league', 'social', 'student');
  CREATE TABLE "players" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "players_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"player_id" integer NOT NULL,
  	"team_id" integer NOT NULL,
  	"season_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "appearances" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"match_id" integer NOT NULL,
  	"player_id" integer NOT NULL,
  	"batted" boolean,
  	"batting_runs" numeric,
  	"batting_balls" numeric,
  	"batting_fours" numeric,
  	"batting_sixes" numeric,
  	"batting_not_out" boolean,
  	"batting_how_out" varchar,
  	"batting_fielder" varchar,
  	"batting_bowler" varchar,
  	"bowled" boolean,
  	"bowling_overs" varchar,
  	"bowling_maidens" numeric,
  	"bowling_runs" numeric,
  	"bowling_wickets" numeric,
  	"bowling_wides" numeric,
  	"bowling_no_balls" numeric,
  	"fielding_catches" numeric,
  	"fielding_run_outs" numeric,
  	"fielding_stumpings" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  -- Hand-edited. Payload generates this as a bare NOT NULL column, which fails
  -- against any teams table that already has rows in it:
  --   ERROR: column "role" of relation "teams" contains null values
  -- CI would not have caught that, because CI starts from an empty database and
  -- production does not. So: add it nullable, fill it, then tighten it.
  --
  -- The backfill reads the slug because the slug is the only thing an existing
  -- row carries that says which side it is. Anything unrecognised becomes
  -- 'social', which is the one role with no eligibility rule attached to it —
  -- so a wrong guess here can neither grant nor withhold eligibility, only be
  -- visibly wrong in the panel where somebody will fix it. Guessing 'league'
  -- would have been the guess that quietly changes who is allowed to play.
  ALTER TABLE "teams" ADD COLUMN "role" "enum_teams_role";
  UPDATE "teams" SET "role" = CASE
    WHEN "slug" = 'league' THEN 'league'
    WHEN "slug" = 'challenge-league' THEN 'challenge-league'
    WHEN "slug" = 'student' THEN 'student'
    ELSE 'social'
  END::"enum_teams_role" WHERE "role" IS NULL;
  ALTER TABLE "teams" ALTER COLUMN "role" SET NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "players_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "registrations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "appearances_id" integer;
  ALTER TABLE "players_texts" ADD CONSTRAINT "players_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appearances" ADD CONSTRAINT "appearances_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appearances" ADD CONSTRAINT "appearances_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "players_name_idx" ON "players" USING btree ("name");
  CREATE INDEX "players_updated_at_idx" ON "players" USING btree ("updated_at");
  CREATE INDEX "players_created_at_idx" ON "players" USING btree ("created_at");
  CREATE INDEX "players_texts_order_parent" ON "players_texts" USING btree ("order","parent_id");
  CREATE INDEX "registrations_player_idx" ON "registrations" USING btree ("player_id");
  CREATE INDEX "registrations_team_idx" ON "registrations" USING btree ("team_id");
  CREATE INDEX "registrations_season_idx" ON "registrations" USING btree ("season_id");
  CREATE INDEX "registrations_updated_at_idx" ON "registrations" USING btree ("updated_at");
  CREATE INDEX "registrations_created_at_idx" ON "registrations" USING btree ("created_at");
  CREATE INDEX "appearances_match_idx" ON "appearances" USING btree ("match_id");
  CREATE INDEX "appearances_player_idx" ON "appearances" USING btree ("player_id");
  CREATE INDEX "appearances_updated_at_idx" ON "appearances" USING btree ("updated_at");
  CREATE INDEX "appearances_created_at_idx" ON "appearances" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_players_fk" FOREIGN KEY ("players_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_registrations_fk" FOREIGN KEY ("registrations_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_appearances_fk" FOREIGN KEY ("appearances_id") REFERENCES "public"."appearances"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_players_id_idx" ON "payload_locked_documents_rels" USING btree ("players_id");
  CREATE INDEX "payload_locked_documents_rels_registrations_id_idx" ON "payload_locked_documents_rels" USING btree ("registrations_id");
  CREATE INDEX "payload_locked_documents_rels_appearances_id_idx" ON "payload_locked_documents_rels" USING btree ("appearances_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "players" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "players_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "registrations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "appearances" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "players" CASCADE;
  DROP TABLE "players_texts" CASCADE;
  DROP TABLE "registrations" CASCADE;
  DROP TABLE "appearances" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_players_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_registrations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_appearances_fk";
  
  DROP INDEX "payload_locked_documents_rels_players_id_idx";
  DROP INDEX "payload_locked_documents_rels_registrations_id_idx";
  DROP INDEX "payload_locked_documents_rels_appearances_id_idx";
  ALTER TABLE "teams" DROP COLUMN "role";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "players_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "registrations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "appearances_id";
  DROP TYPE "public"."enum_teams_role";`)
}
