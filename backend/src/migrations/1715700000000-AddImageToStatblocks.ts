import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageToStatblocks1715700000000 implements MigrationInterface {
  name = 'AddImageToStatblocks1715700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure hasImage exists; skip other legacy image columns to avoid clutter
    const columns: Array<{ name: string }> = await queryRunner.query(`PRAGMA table_info('statblocks')`);
    const hasImageCol = columns.some(c => c.name === 'hasImage');
    if (!hasImageCol) {
      await queryRunner.query(`ALTER TABLE "statblocks" ADD COLUMN "hasImage" boolean NOT NULL DEFAULT (0)`);
    }
    // Optionally drop old columns if present (best-effort)
    // SQLite drop column is limited; skip to avoid destructive changes.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op safe down; optionally attempt to drop hasImage
    try { await queryRunner.query(`ALTER TABLE "statblocks" DROP COLUMN "hasImage"`); } catch {}
  }
}
