import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCodeToMiniSheets1737150000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mini_sheets ADD COLUMN code VARCHAR(10) DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mini_sheets DROP COLUMN code
    `);
  }
}
