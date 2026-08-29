import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_players_playing_role" AS ENUM('batter', 'bowler', 'wicketkeeper', 'all-rounder');
  ALTER TABLE "players" ADD COLUMN "playing_role" "enum_players_playing_role";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "players" DROP COLUMN "playing_role";
  DROP TYPE "public"."enum_players_playing_role";`)
}
