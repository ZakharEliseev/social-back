import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameNameToUsername1737156000000 implements MigrationInterface {
  name = 'RenameNameToUsername1737156000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Переименовываем колонку name в username
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='name'
        ) THEN
          ALTER TABLE users RENAME COLUMN name TO username;
        END IF;
      END $$;
    `);

    // Добавляем ограничение длины и unique constraint для username
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN username TYPE VARCHAR(30);
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'users_username_key'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
        END IF;
      END $$;
    `);

    // Обновляем ограничение для email
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN email TYPE VARCHAR(100);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откатываем изменения
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='username'
        ) THEN
          ALTER TABLE users RENAME COLUMN username TO name;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN name TYPE VARCHAR(255);
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN email TYPE VARCHAR(255);
    `);
  }
}
