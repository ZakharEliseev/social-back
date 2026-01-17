import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init0011700000000000 implements MigrationInterface {
  name = 'Init0011700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(30) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // upgrade: add created_at if missing
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    `);

    // upgrade: add bio if missing
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bio TEXT;
    `);

    // upgrade: add avatar_url if missing
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);

    // upgrade: rename old name column to username if it exists
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

    // upgrade: add username column if it doesn't exist (for very old schemas)
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username VARCHAR(30);
    `);

    // upgrade: ensure username is unique
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

    // upgrade: update email length
    await queryRunner.query(`
      DO $$
      BEGIN
        ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(100);
      EXCEPTION WHEN OTHERS THEN
        NULL; -- ignore if already correct type
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // upgrade: add created_at if missing (old schema had 'date' string)
    await queryRunner.query(`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    `);

    // upgrade: drop weird unique constraint on posts.text if it exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'posts_text_key'
        ) THEN
          ALTER TABLE posts DROP CONSTRAINT posts_text_key;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS followers (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_followers_follower_following UNIQUE (follower_id, following_id)
      );
    `);

    // upgrade: rename old columns (follower/following) if present
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='followers' AND column_name='follower'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='followers' AND column_name='follower_id'
        ) THEN
          ALTER TABLE followers RENAME COLUMN follower TO follower_id;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='followers' AND column_name='following'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='followers' AND column_name='following_id'
        ) THEN
          ALTER TABLE followers RENAME COLUMN following TO following_id;
        END IF;
      END $$;
    `);

    // upgrade: add created_at if missing
    await queryRunner.query(`
      ALTER TABLE followers
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    `);

    // upgrade: ensure unique constraint exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'uq_followers_follower_following'
        ) THEN
          ALTER TABLE followers
          ADD CONSTRAINT uq_followers_follower_following UNIQUE (follower_id, following_id);
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);`,
    );

    // Likes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_likes_user_post UNIQUE (user_id, post_id)
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);`,
    );

    // Comments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS comments;`);
    await queryRunner.query(`DROP TABLE IF EXISTS likes;`);
    await queryRunner.query(`DROP TABLE IF EXISTS followers;`);
    await queryRunner.query(`DROP TABLE IF EXISTS posts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
