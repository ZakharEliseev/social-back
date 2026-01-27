import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTitleFromPosts1737159000000 implements MigrationInterface {
  name = 'DropTitleFromPosts1737159000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE posts DROP COLUMN IF EXISTS title;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    `);
  }
}
