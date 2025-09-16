import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStatblockImagesTable1715700100000 implements MigrationInterface {
  name = 'CreateStatblockImagesTable1715700100000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "statblock_images" (
      "id" varchar PRIMARY KEY NOT NULL,
      "statblockId" varchar NOT NULL,
      "data" BLOB NOT NULL,
      "mime" varchar(100),
      "filename" varchar(255),
      "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
      "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_statblock_images_statblockId" ON "statblock_images" ("statblockId")`);

    // If old columns existed, leave them; we won't drop here to avoid SQLite limitations.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_statblock_images_statblockId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "statblock_images"`);
  }
}
