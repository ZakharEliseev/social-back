import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarUrlToUsers1737158000000 implements MigrationInterface {
  name = 'AddAvatarUrlToUsers1737158000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем колонку avatar_url в таблицу users
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS avatar_url;
    `);
  }
}
