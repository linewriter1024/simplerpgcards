import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class RemoveSpellSaveAndAttackMod1714930100000 implements MigrationInterface {
  name = 'RemoveSpellSaveAndAttackMod1714930100000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop columns if they exist (SQLite allows IF EXISTS starting from 3.35, TypeORM handles dialect specifics)
    await queryRunner.dropColumn('statblocks', 'spellSaveDC');
    await queryRunner.dropColumn('statblocks', 'spellAttackModifier');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'statblocks',
      new TableColumn({ name: 'spellSaveDC', type: 'integer', isNullable: true })
    );
    await queryRunner.addColumn(
      'statblocks',
      new TableColumn({ name: 'spellAttackModifier', type: 'integer', isNullable: true })
    );
  }
}
