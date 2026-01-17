import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Like } from '../entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ERROR_MESSAGES } from '../common/constants';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async createPost(
    createPostDto: CreatePostDto,
    userId: number,
  ): Promise<Post> {
    // Валидация что пользователь существует
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const post = this.postRepository.create({
      ...createPostDto,
      authorId: userId,
    });

    const savedPost = await this.postRepository.save(post);
    this.logger.log(`Post created by user ${userId}: ${savedPost.id}`);

    // hydrate author for controller mapping
    return await this.postRepository.findOne({
      where: { id: savedPost.id },
      relations: ['author'],
    });
  }

  async getMyPosts(
    userId: number,
    options?: { limit?: number; offset?: number },
  ): Promise<Post[]> {
    const posts = await this.postRepository.find({
      where: { authorId: userId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
    });

    this.logger.log(`Retrieved ${posts.length} posts for user ${userId}`);
    return posts;
  }

  async getUserPosts(
    userId: number,
    options?: { limit?: number; offset?: number },
  ): Promise<Post[]> {
    // Проверяем что пользователь существует
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const posts = await this.postRepository.find({
      where: { authorId: userId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
    });

    this.logger.log(`Retrieved ${posts.length} posts for user ${userId}`);
    return posts;
  }

  async getFeed(
    userId: number,
    options?: { limit?: number; offset?: number },
  ): Promise<Post[]> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    // canonical feed: posts of users that current user follows
    const posts = await this.postRepository
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.author', 'author')
      .innerJoin(
        'followers',
        'f',
        'f.following_id = post.author_id AND f.follower_id = :userId',
        { userId },
      )
      .orderBy('post.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();

    this.logger.log(
      `Retrieved feed posts for user ${userId} (count=${posts.length})`,
    );
    return posts;
  }

  async toggleLike(
    postId: number,
    userId: number,
  ): Promise<{ liked: boolean }> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(
        ERROR_MESSAGES.POST_NOT_FOUND || 'Post not found',
      );
    }

    const existingLike = await this.likeRepository.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      this.logger.log(`User ${userId} unliked post ${postId}`);
      return { liked: false };
    } else {
      const like = this.likeRepository.create({ postId, userId });
      await this.likeRepository.save(like);
      this.logger.log(`User ${userId} liked post ${postId}`);
      return { liked: true };
    }
  }

  async createComment(
    postId: number,
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(
        ERROR_MESSAGES.POST_NOT_FOUND || 'Post not found',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      postId,
      userId,
    });

    const savedComment = await this.commentRepository.save(comment);
    this.logger.log(`Comment created by user ${userId} on post ${postId}`);

    return await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });
  }

  async getPostComments(
    postId: number,
    options?: { limit?: number; offset?: number },
  ): Promise<Comment[]> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(
        ERROR_MESSAGES.POST_NOT_FOUND || 'Post not found',
      );
    }

    const comments = await this.commentRepository.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });

    return comments;
  }

  async deletePost(postId: number, userId: number): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException(
        ERROR_MESSAGES.POST_NOT_FOUND || 'Post not found',
      );
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postRepository.remove(post);
    this.logger.log(`Post ${postId} deleted by user ${userId}`);
  }

  async enrichPostsWithLikesAndComments(
    posts: Post[],
    userId: number,
  ): Promise<Post[]> {
    if (posts.length === 0) {
      return posts;
    }

    const postIds = posts.map((p) => p.id);

    // Получаем лайки текущего пользователя для этих постов
    const userLikes = await this.likeRepository.find({
      where: { userId, postId: In(postIds) },
    });
    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    // Получаем счетчики лайков
    const likesCounts = await this.likeRepository
      .createQueryBuilder('like')
      .select('like.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('like.postId IN (:...postIds)', { postIds })
      .groupBy('like.postId')
      .getRawMany();

    const likesCountMap = new Map(
      likesCounts.map((item) => [item.postId, parseInt(item.count)]),
    );

    // Получаем счетчики комментариев
    const commentsCounts = await this.commentRepository
      .createQueryBuilder('comment')
      .select('comment.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('comment.postId IN (:...postIds)', { postIds })
      .groupBy('comment.postId')
      .getRawMany();

    const commentsCountMap = new Map(
      commentsCounts.map((item) => [item.postId, parseInt(item.count)]),
    );

    // Получаем последние комментарии для каждого поста
    const recentComments = await this.commentRepository
      .createQueryBuilder('comment')
      .innerJoin('comment.post', 'post')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.postId IN (:...postIds)', { postIds })
      .orderBy('comment.createdAt', 'DESC')
      .getMany();

    const commentsByPostId = new Map<number, Comment[]>();
    for (const comment of recentComments) {
      if (!commentsByPostId.has(comment.postId)) {
        commentsByPostId.set(comment.postId, []);
      }
      const postComments = commentsByPostId.get(comment.postId);
      if (postComments && postComments.length < 5) {
        postComments.push(comment);
      }
    }

    // Обогащаем посты
    return posts.map((post) => {
      (post as any).likesCount = likesCountMap.get(post.id) || 0;
      (post as any).isLiked = likedPostIds.has(post.id);
      (post as any).commentsCount = commentsCountMap.get(post.id) || 0;
      (post as any).comments = commentsByPostId.get(post.id) || [];
      return post;
    });
  }
}
