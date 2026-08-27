import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_matches_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__matches_v_version_result_innings_side" AS ENUM('hku', 'opponent');
  CREATE TYPE "public"."enum__matches_v_version_venue" AS ENUM('home', 'away');
  CREATE TYPE "public"."enum__matches_v_version_result_outcome" AS ENUM('won', 'lost', 'drawn', 'tied', 'abandoned', 'conceded');
  CREATE TYPE "public"."enum__matches_v_version_result_margin_unit" AS ENUM('runs', 'wickets');
  CREATE TYPE "public"."enum__matches_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_matches_v_version_result_innings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"side" "enum__matches_v_version_result_innings_side",
  	"runs" numeric,
  	"wickets" numeric,
  	"overs" varchar,
  	"extras" numeric,
  	"byes" numeric,
  	"leg_byes" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_matches_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_team_id" integer,
  	"version_season_id" integer,
  	"version_competition_id" integer,
  	"version_date" timestamp(3) with time zone,
  	"version_start_time" varchar,
  	"version_opponent" varchar,
  	"version_venue" "enum__matches_v_version_venue",
  	"version_ground" varchar,
  	"version_format" varchar,
  	"version_scorecard" varchar,
  	"version_result_outcome" "enum__matches_v_version_result_outcome",
  	"version_result_margin_value" numeric,
  	"version_result_margin_unit" "enum__matches_v_version_result_margin_unit",
  	"version_summary" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__matches_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "matches_result_innings" ALTER COLUMN "side" DROP NOT NULL;
  ALTER TABLE "matches_result_innings" ALTER COLUMN "runs" DROP NOT NULL;
  ALTER TABLE "matches" ALTER COLUMN "team_id" DROP NOT NULL;
  ALTER TABLE "matches" ALTER COLUMN "season_id" DROP NOT NULL;
  ALTER TABLE "matches" ALTER COLUMN "date" DROP NOT NULL;
  ALTER TABLE "matches" ALTER COLUMN "opponent" DROP NOT NULL;
  ALTER TABLE "matches" ALTER COLUMN "venue" DROP NOT NULL;
  -- Hand-edited, and this is the line that matters in the whole file.
  --
  -- Payload generates the column with DEFAULT 'draft', which is right for
  -- everything written from here on and catastrophic for everything already
  -- there: every Match the club has ever entered would become a draft, and
  -- drafts are invisible to an unauthenticated reader — which is what the
  -- public site is. The migration would succeed, the deploy would go green,
  -- and the season table would empty itself.
  --
  -- Nothing that predates this migration was ever held back, because there was
  -- no way to hold anything back. So they are all published, and saying so is
  -- the difference between a schema change and an outage.
  ALTER TABLE "matches" ADD COLUMN "_status" "enum_matches_status" DEFAULT 'draft';
  UPDATE "matches" SET "_status" = 'published' WHERE "_status" IS NULL OR "_status" = 'draft';
  ALTER TABLE "_matches_v_version_result_innings" ADD CONSTRAINT "_matches_v_version_result_innings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_matches_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_matches_v" ADD CONSTRAINT "_matches_v_parent_id_matches_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_matches_v" ADD CONSTRAINT "_matches_v_version_team_id_teams_id_fk" FOREIGN KEY ("version_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_matches_v" ADD CONSTRAINT "_matches_v_version_season_id_seasons_id_fk" FOREIGN KEY ("version_season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_matches_v" ADD CONSTRAINT "_matches_v_version_competition_id_competitions_id_fk" FOREIGN KEY ("version_competition_id") REFERENCES "public"."competitions"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_matches_v_version_result_innings_order_idx" ON "_matches_v_version_result_innings" USING btree ("_order");
  CREATE INDEX "_matches_v_version_result_innings_parent_id_idx" ON "_matches_v_version_result_innings" USING btree ("_parent_id");
  CREATE INDEX "_matches_v_parent_idx" ON "_matches_v" USING btree ("parent_id");
  CREATE INDEX "_matches_v_version_version_team_idx" ON "_matches_v" USING btree ("version_team_id");
  CREATE INDEX "_matches_v_version_version_season_idx" ON "_matches_v" USING btree ("version_season_id");
  CREATE INDEX "_matches_v_version_version_competition_idx" ON "_matches_v" USING btree ("version_competition_id");
  CREATE INDEX "_matches_v_version_version_date_idx" ON "_matches_v" USING btree ("version_date");
  CREATE INDEX "_matches_v_version_version_summary_idx" ON "_matches_v" USING btree ("version_summary");
  CREATE INDEX "_matches_v_version_version_updated_at_idx" ON "_matches_v" USING btree ("version_updated_at");
  CREATE INDEX "_matches_v_version_version_created_at_idx" ON "_matches_v" USING btree ("version_created_at");
  CREATE INDEX "_matches_v_version_version__status_idx" ON "_matches_v" USING btree ("version__status");
  CREATE INDEX "_matches_v_created_at_idx" ON "_matches_v" USING btree ("created_at");
  CREATE INDEX "_matches_v_updated_at_idx" ON "_matches_v" USING btree ("updated_at");
  CREATE INDEX "_matches_v_latest_idx" ON "_matches_v" USING btree ("latest");
  CREATE INDEX "matches__status_idx" ON "matches" USING btree ("_status");`)

  // Hand-added, and the second thing this migration would have got wrong.
  //
  // Payload's Matches *list* reads through the versions table, so a Match with
  // no version row does not appear in it at all — while the document itself
  // still opens fine and the public site still sees it. The failure is
  // therefore invisible to every check we have: the site is correct, the API is
  // correct, and the committee opens the panel to find one match instead of a
  // season. Found by enabling drafts against a database that had matches in it
  // and counting the rows on screen.
  //
  // So every existing Match gets the version it never had, marked published for
  // the same reason the column above is: nothing predating this could have been
  // held back.
  await db.execute(sql`
  INSERT INTO "_matches_v" (
    "parent_id", "version_team_id", "version_season_id", "version_competition_id",
    "version_date", "version_start_time", "version_opponent", "version_venue",
    "version_ground", "version_format", "version_scorecard", "version_result_outcome",
    "version_result_margin_value", "version_result_margin_unit", "version_summary",
    "version_updated_at", "version_created_at", "version__status",
    "created_at", "updated_at", "latest"
  )
  SELECT
    m."id", m."team_id", m."season_id", m."competition_id",
    m."date", m."start_time", m."opponent", m."venue"::text::"enum__matches_v_version_venue",
    m."ground", m."format", m."scorecard", m."result_outcome"::text::"enum__matches_v_version_result_outcome",
    m."result_margin_value", m."result_margin_unit"::text::"enum__matches_v_version_result_margin_unit", m."summary",
    m."updated_at", m."created_at", 'published',
    now(), now(), true
  FROM "matches" m
  WHERE NOT EXISTS (SELECT 1 FROM "_matches_v" v WHERE v."parent_id" = m."id");`)

  // The innings go with it. Without them the version is a hollow copy, and
  // "restore this version" in the panel would quietly wipe a scorecard —
  // a destructive button that looks like an undo.
  await db.execute(sql`
  INSERT INTO "_matches_v_version_result_innings" (
    "_order", "_parent_id", "_uuid", "side", "runs", "wickets", "overs", "extras", "byes", "leg_byes"
  )
  SELECT
    i."_order", v."id", i."id",
    i."side"::text::"enum__matches_v_version_result_innings_side",
    i."runs", i."wickets", i."overs", i."extras", i."byes", i."leg_byes"
  FROM "matches_result_innings" i
  JOIN "_matches_v" v ON v."parent_id" = i."_parent_id"
  WHERE NOT EXISTS (
    SELECT 1 FROM "_matches_v_version_result_innings" existing
    WHERE existing."_parent_id" = v."id"
  );`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_matches_v_version_result_innings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_matches_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_matches_v_version_result_innings" CASCADE;
  DROP TABLE "_matches_v" CASCADE;
  DROP INDEX "matches__status_idx";
  ALTER TABLE "matches_result_innings" ALTER COLUMN "side" SET NOT NULL;
  ALTER TABLE "matches_result_innings" ALTER COLUMN "runs" SET NOT NULL;
  ALTER TABLE "matches" ALTER COLUMN "team_id" SET NOT NULL;
  ALTER TABLE "matches" ALTER COLUMN "season_id" SET NOT NULL;
  ALTER TABLE "matches" ALTER COLUMN "date" SET NOT NULL;
  ALTER TABLE "matches" ALTER COLUMN "opponent" SET NOT NULL;
  ALTER TABLE "matches" ALTER COLUMN "venue" SET NOT NULL;
  ALTER TABLE "matches" DROP COLUMN "_status";
  DROP TYPE "public"."enum_matches_status";
  DROP TYPE "public"."enum__matches_v_version_result_innings_side";
  DROP TYPE "public"."enum__matches_v_version_venue";
  DROP TYPE "public"."enum__matches_v_version_result_outcome";
  DROP TYPE "public"."enum__matches_v_version_result_margin_unit";
  DROP TYPE "public"."enum__matches_v_version_status";`)
}
