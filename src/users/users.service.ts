import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
import { User } from '../entities/user.entity';
import { Follower } from '../entities/follower.entity';
import { Post } from '../entities/post.entity';
import { ERROR_MESSAGES } from '../common/constants';

export interface UserSearchResult {
  id: number;
  username: string;
  avatar: string | null;
  isFollowing: boolean;
}

export interface UserProfileResult {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Follower)
    private readonly followerRepository: Repository<Follower>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async searchUsers(params: {
    q?: string;
    activeUserId: number;
  }): Promise<UserSearchResult[]> {
    const { q, activeUserId } = params;

    const [users, following] = await Promise.all([
      this.userRepository.find({
        where: q
          ? {
              username: ILike(`%${q}%`),
              id: Not(activeUserId),
            }
          : {
              id: Not(activeUserId),
            },
        select: ['id', 'username', 'avatar'],
        take: 50,
      }),
      this.followerRepository.find({
        where: { followerId: activeUserId },
        select: ['followingId'],
      }),
    ]);

    const followingIds = new Set(following.map((f) => f.followingId));

    const result = users.map((user) => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      isFollowing: followingIds.has(user.id),
    }));

    this.logger.log(
      `Search users (q="${q ?? ''}") for user ${activeUserId}: ${result.length} results`,
    );

    return result;
  }

  async follow(params: {
    followerId: number;
    followingId: number;
  }): Promise<Follower> {
    const { followerId, followingId } = params;

    if (followerId === followingId) {
      throw new ConflictException('Cannot follow yourself');
    }

    const targetExists = await this.userRepository.exists({
      where: { id: followingId },
    });
    if (!targetExists) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const existing = await this.followerRepository.findOne({
      where: { followerId, followingId },
    });
    if (existing) {
      throw new ConflictException('Already following');
    }

    const relation = this.followerRepository.create({
      followerId,
      followingId,
    });
    const saved = await this.followerRepository.save(relation);
    this.logger.log(`User ${followerId} followed user ${followingId}`);
    return saved;
  }

  async unfollow(params: {
    followerId: number;
    followingId: number;
  }): Promise<void> {
    const { followerId, followingId } = params;

    const result = await this.followerRepository.delete({
      followerId,
      followingId,
    });

    if (!result.affected) {
      throw new NotFoundException('Follow relation not found');
    }

    this.logger.log(`User ${followerId} unfollowed user ${followingId}`);
  }

  async getUserProfile(params: {
    userId: number;
    activeUserId: number;
  }): Promise<UserProfileResult> {
    const { userId, activeUserId } = params;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'bio', 'avatar', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Параллельно получаем все счетчики
    const [postsCount, followersCount, followingCount, isFollowing] =
      await Promise.all([
        this.postRepository.count({ where: { authorId: userId } }),
        this.followerRepository.count({ where: { followingId: userId } }),
        this.followerRepository.count({ where: { followerId: userId } }),
        userId !== activeUserId
          ? this.followerRepository.exists({
              where: { followerId: activeUserId, followingId: userId },
            })
          : Promise.resolve(false),
      ]);

    this.logger.log(`User profile fetched for user ${userId}`);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      postsCount,
      followersCount,
      followingCount,
      isFollowing,
      isOwnProfile: userId === activeUserId,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(params: {
    userId: number;
    email?: string;
    bio?: string;
    avatar?: string | null;
  }): Promise<User> {
    const { userId, email, bio, avatar } = params;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Проверяем уникальность email если он меняется
    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('Email уже используется');
      }
      user.email = email;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    const updated = await this.userRepository.save(user);
    this.logger.log(`User ${userId} updated their profile`);

    return updated;
  }

  async changePassword(params: {
    userId: number;
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const { userId, currentPassword, newPassword } = params;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Проверяем текущий пароль
    const isPasswordValid = await import('bcrypt').then((bcrypt) =>
      bcrypt.compare(currentPassword, user.password),
    );

    if (!isPasswordValid) {
      throw new ConflictException('Неверный текущий пароль');
    }

    // Хешируем новый пароль
    const hashedPassword = await import('bcrypt').then((bcrypt) =>
      bcrypt.hash(newPassword, 10),
    );

    user.password = hashedPassword;
    await this.userRepository.save(user);

    this.logger.log(`User ${userId} changed their password`);
  }
}
