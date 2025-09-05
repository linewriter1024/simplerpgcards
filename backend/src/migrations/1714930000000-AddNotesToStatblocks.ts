import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddNotesToStatblocks1714930000000 implements MigrationInterface {
  name = 'AddNotesToStatblocks1714930000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'statblocks',
      new TableColumn({
        name: 'notes',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('statblocks', 'notes');
  }
}
