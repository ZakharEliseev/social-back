import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBioToUsers1737157000000 implements MigrationInterface {
  name = 'AddBioToUsers1737157000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем колонку bio в таблицу users
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bio TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS bio;
    `);
  }
}
