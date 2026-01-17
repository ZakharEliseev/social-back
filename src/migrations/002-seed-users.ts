import { MigrationInterface, QueryRunner } from 'typeorm';

// Предварительно хешированный пароль "password123"
const HASHED_PASSWORD =
  '$2b$10$fy37v91vHSJCAm.9dmTJPOytLtDZ/Yjt9FaHgli5ch0hm5LrrGpL6';

export class SeedUsers0021700000001000 implements MigrationInterface {
  name = 'SeedUsers0021700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем что таблица users существует
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('Table users does not exist yet, skipping seed');
      return;
    }

    // Проверяем, есть ли уже пользователи
    const existingUsers = await queryRunner.query(
      `SELECT COUNT(*) as count FROM users`,
    );

    if (parseInt(existingUsers[0].count) > 0) {
      console.log('Users already exist, skipping seed');
      return;
    }

    const users = [
      {
        username: 'alice',
        email: 'alice@example.com',
        bio: 'Lover of art and photography',
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        bio: 'Software engineer and tech enthusiast',
      },
      { username: 'charlie', email: 'charlie@example.com', bio: null },
      {
        username: 'diana',
        email: 'diana@example.com',
        bio: 'Travel blogger 🌍',
      },
      { username: 'eve', email: 'eve@example.com', bio: null },
      {
        username: 'frank',
        email: 'frank@example.com',
        bio: 'Coffee addict ☕',
      },
      {
        username: 'grace',
        email: 'grace@example.com',
        bio: 'Designer & creative thinker',
      },
      { username: 'henry', email: 'henry@example.com', bio: null },
      { username: 'ivy', email: 'ivy@example.com', bio: 'Bookworm 📚' },
      { username: 'jack', email: 'jack@example.com', bio: 'Music producer' },
    ];

    for (const user of users) {
      await queryRunner.query(
        `INSERT INTO users (username, email, password, bio, created_at) 
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (email) DO NOTHING`,
        [user.username, user.email, HASHED_PASSWORD, user.bio],
      );
    }

    console.log(`Seeded ${users.length} users`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем seed пользователей по email
    const seedEmails = [
      'alice@example.com',
      'bob@example.com',
      'charlie@example.com',
      'diana@example.com',
      'eve@example.com',
      'frank@example.com',
      'grace@example.com',
      'henry@example.com',
      'ivy@example.com',
      'jack@example.com',
    ];

    await queryRunner.query(`DELETE FROM users WHERE email = ANY($1)`, [
      seedEmails,
    ]);
  }
}
