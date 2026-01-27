import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { Follower } from './entities/follower.entity';
import * as bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 10;

async function seedDatabase() {
  try {
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

    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const postRepository = dataSource.getRepository(Post);
    const likeRepository = dataSource.getRepository(Like);
    const commentRepository = dataSource.getRepository(Comment);
    const followerRepository = dataSource.getRepository(Follower);

    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      await dataSource.destroy();
      return;
    }

    const usersData = [
      { name: 'Alice Johnson', email: 'alice@example.com' },
      { name: 'Bob Smith', email: 'bob@example.com' },
      { name: 'Charlie Brown', email: 'charlie@example.com' },
      { name: 'Diana Prince', email: 'diana@example.com' },
      { name: 'Eve Wilson', email: 'eve@example.com' },
      { name: 'Frank Miller', email: 'frank@example.com' },
      { name: 'Grace Lee', email: 'grace@example.com' },
      { name: 'Henry Davis', email: 'henry@example.com' },
      { name: 'Ivy Chen', email: 'ivy@example.com' },
      { name: 'Jack Taylor', email: 'jack@example.com' },
    ];

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

    console.log(
      '✅ Database seeded with 10 users, posts, likes, comments, and follow relations',
    );
    console.log('   All users password: password123');

    await dataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Seed database in development mode if empty
  if (process.env.NODE_ENV === 'development') {
    await seedDatabase();
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Social API')
    .setDescription('Social API documentation with NestJS')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('PORT', 5000);
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();
