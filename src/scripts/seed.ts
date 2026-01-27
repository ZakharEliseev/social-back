import { DataSource, DataSourceOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Like } from '../entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { Follower } from '../entities/follower.entity';

const BCRYPT_SALT_ROUNDS = 10;

async function seed() {
  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'social_db',
    entities: [User, Post, Like, Comment, Follower],
    logging: process.env.NODE_ENV === 'development',
  };
  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const userRepository = dataSource.getRepository(User);
    const postRepository = dataSource.getRepository(Post);
    const likeRepository = dataSource.getRepository(Like);
    const commentRepository = dataSource.getRepository(Comment);
    const followerRepository = dataSource.getRepository(Follower);

    // Проверяем, есть ли уже пользователи
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log('Database already seeded, skipping...');
      await dataSource.destroy();
      return;
    }

    const usersData = [
      { username: 'alice', email: 'alice@example.com', bio: 'Lover of art and photography' },
      { username: 'bob', email: 'bob@example.com', bio: 'Software engineer and tech enthusiast' },
      { username: 'charlie', email: 'charlie@example.com', bio: null },
      { username: 'diana', email: 'diana@example.com', bio: 'Travel blogger 🌍' },
      { username: 'eve', email: 'eve@example.com', bio: null },
      { username: 'frank', email: 'frank@example.com', bio: 'Coffee addict ☕' },
      { username: 'grace', email: 'grace@example.com', bio: 'Designer & creative thinker' },
      { username: 'henry', email: 'henry@example.com', bio: null },
      { username: 'ivy', email: 'ivy@example.com', bio: 'Bookworm 📚' },
      { username: 'jack', email: 'jack@example.com', bio: 'Music producer' },
    ];

    // Создаем пользователей
    const hashedPassword = await bcrypt.hash('password123', BCRYPT_SALT_ROUNDS);
    const users = await Promise.all(
      usersData.map((userData) =>
        userRepository.save(
          userRepository.create({
            ...userData,
            password: hashedPassword,
          }),
        ),
      ),
    );

    console.log(`Created ${users.length} users`);

    // Создаем посты для некоторых пользователей
    const postsData = [
      { author: users[0], text: 'This is my first post. Hope you enjoy reading!' },
      { author: users[1], text: 'TypeScript is amazing for large projects.' },
      { author: users[2], text: 'NestJS makes building scalable applications easy.' },
      { author: users[3], text: 'Always normalize your database schema.' },
      { author: users[4], text: 'RESTful APIs should follow HTTP standards.' },
      { author: users[0], text: 'Another interesting topic to discuss.' },
      { author: users[1], text: 'Unit tests and integration tests are crucial.' },
    ];

    const posts = await Promise.all(
      postsData.map((postData) =>
        postRepository.save(postRepository.create(postData)),
      ),
    );

    console.log(`Created ${posts.length} posts`);

    // Создаем подписки между пользователями
    const followRelations = [
      { follower: users[0], following: users[1] },
      { follower: users[0], following: users[2] },
      { follower: users[1], following: users[0] },
      { follower: users[2], following: users[0] },
      { follower: users[2], following: users[1] },
      { follower: users[3], following: users[0] },
      { follower: users[3], following: users[1] },
      { follower: users[4], following: users[0] },
    ];

    await Promise.all(
      followRelations.map((rel) =>
        followerRepository.save(
          followerRepository.create({
            followerId: rel.follower.id,
            followingId: rel.following.id,
          }),
        ),
      ),
    );

    console.log(`Created ${followRelations.length} follow relations`);

    // Создаем лайки
    const likesData = [
      { user: users[1], post: posts[0] },
      { user: users[2], post: posts[0] },
      { user: users[3], post: posts[0] },
      { user: users[0], post: posts[1] },
      { user: users[2], post: posts[1] },
      { user: users[0], post: posts[2] },
      { user: users[1], post: posts[2] },
      { user: users[3], post: posts[2] },
      { user: users[4], post: posts[2] },
    ];

    await Promise.all(
      likesData.map((likeData) =>
        likeRepository.save(
          likeRepository.create({
            userId: likeData.user.id,
            postId: likeData.post.id,
          }),
        ),
      ),
    );

    console.log(`Created ${likesData.length} likes`);

    // Создаем комментарии
    const commentsData = [
      { user: users[1], post: posts[0], text: 'Great first post!' },
      {
        user: users[2],
        post: posts[0],
        text: 'Looking forward to more content.',
      },
      { user: users[0], post: posts[1], text: 'I totally agree with you!' },
      {
        user: users[2],
        post: posts[1],
        text: 'TypeScript is indeed powerful.',
      },
      {
        user: users[1],
        post: posts[2],
        text: 'NestJS is my favorite framework.',
      },
      { user: users[3], post: posts[2], text: 'Thanks for sharing!' },
    ];

    await Promise.all(
      commentsData.map((commentData) =>
        commentRepository.save(
          commentRepository.create({
            userId: commentData.user.id,
            postId: commentData.post.id,
            text: commentData.text,
          }),
        ),
      ),
    );

    console.log(`Created ${commentsData.length} comments`);

    console.log('✅ Database seeded successfully!');
    console.log('\nTest users created (password for all: password123):');
    users.forEach((user) => {
      console.log(`  - ${user.username} (${user.email})`);
    });

    await dataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seed();
