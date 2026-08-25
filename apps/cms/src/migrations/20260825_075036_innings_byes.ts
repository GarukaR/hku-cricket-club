import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "matches_result_innings" ADD COLUMN "byes" numeric;
  ALTER TABLE "matches_result_innings" ADD COLUMN "leg_byes" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "matches_result_innings" DROP COLUMN "byes";
  ALTER TABLE "matches_result_innings" DROP COLUMN "leg_byes";`)
}
