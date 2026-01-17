import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../entities/user.entity';
import { Follower } from '../entities/follower.entity';
import { Post } from '../entities/post.entity';
import { StorageService } from '../common/services/storage.service';
import { MinioConfigProvider } from '../config/minio.config';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follower, Post]), ConfigModule],
  controllers: [UsersController],
  providers: [UsersService, StorageService, MinioConfigProvider],
})
export class UsersModule {}
