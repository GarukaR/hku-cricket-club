import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The club has no home ground — it plays wherever it is allocated — so home
// and away were never facts about a match here, and the column held an
// editor's guess. `ground` is the field that is true, and it stays.
//
// Nothing is carried across. Reading "home" as Sandy Bay would turn every one
// of those guesses into a stated ground on a page the other club also reads,
// which is the failure this ticket exists to end. `down` therefore restores
// the column empty: the guesses do not come back, and should not.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "matches" DROP COLUMN "venue";
  ALTER TABLE "_matches_v" DROP COLUMN "version_venue";
  DROP TYPE "public"."enum_matches_venue";
  DROP TYPE "public"."enum__matches_v_version_venue";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_matches_venue" AS ENUM('home', 'away');
  CREATE TYPE "public"."enum__matches_v_version_venue" AS ENUM('home', 'away');
  ALTER TABLE "matches" ADD COLUMN "venue" "enum_matches_venue";
  ALTER TABLE "_matches_v" ADD COLUMN "version_venue" "enum__matches_v_version_venue";`)
}
