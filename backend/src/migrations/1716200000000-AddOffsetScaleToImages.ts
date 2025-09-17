import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOffsetScaleToImages1716200000000 implements MigrationInterface {
  name = 'AddOffsetScaleToImages1716200000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns if they don't exist
    await queryRunner.query(`ALTER TABLE "statblock_images" ADD COLUMN IF NOT EXISTS "offset" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "statblock_images" ADD COLUMN IF NOT EXISTS "scale" real NOT NULL DEFAULT 1.0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite doesn't support DROP COLUMN easily; leave as no-op or recreate table if needed.
  }
}
