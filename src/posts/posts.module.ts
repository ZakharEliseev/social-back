import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { FeedController } from './feed.controller';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Like } from '../entities/like.entity';
import { Comment } from '../entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Like, Comment])],
  controllers: [PostsController, FeedController],
  providers: [PostsService],
})
export class PostsModule {}
