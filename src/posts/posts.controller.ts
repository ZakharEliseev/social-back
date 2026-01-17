import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { PostDto, CommentDto } from './dto/post-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Post as PostEntity } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';

@ApiTags('posts')
@Controller('api/v1/posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  private toPostDto(
    post: PostEntity & {
      likesCount?: number;
      isLiked?: boolean;
      commentsCount?: number;
      comments?: Comment[];
    },
  ): PostDto {
    return {
      id: post.id,
      title: post.title,
      text: post.text,
      createdAt: post.createdAt.toISOString(),
      author: {
        id: post.author?.id ?? post.authorId,
        username: post.author?.username ?? '',
      },
      likesCount: (post as any).likesCount ?? 0,
      isLiked: (post as any).isLiked ?? false,
      commentsCount: (post as any).commentsCount ?? 0,
      comments: (post as any).comments?.map((c: Comment) =>
        this.toCommentDto(c),
      ),
    };
  }

  private toCommentDto(comment: Comment): CommentDto {
    return {
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.user?.id ?? comment.userId,
        username: comment.user?.username ?? '',
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать новый пост' })
  @ApiResponse({
    status: 201,
    description: 'Пост успешно создан',
    type: PostDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const post = await this.postsService.createPost(createPostDto, user.id);
    return this.toPostDto(post);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Список моих постов' })
  @ApiResponse({
    status: 200,
    description: 'Мои посты успешно получены',
    type: [PostDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPosts(
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const posts = await this.postsService.getMyPosts(user.id, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
    const enrichedPosts =
      await this.postsService.enrichPostsWithLikesAndComments(posts, user.id);
    return enrichedPosts.map((p) => this.toPostDto(p));
  }

  @Put(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Лайкнуть/убрать лайк с поста' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Лайк переключен',
    schema: {
      type: 'object',
      properties: {
        liked: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async toggleLike(
    @Param('id', ParseIntPipe) postId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return await this.postsService.toggleLike(postId, user.id);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Добавить комментарий к посту' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({
    status: 201,
    description: 'Комментарий создан',
    type: CommentDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createComment(
    @Param('id', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const comment = await this.postsService.createComment(
      postId,
      user.id,
      createCommentDto,
    );
    return this.toCommentDto(comment);
  }

  @Get(':id/comments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить комментарии к посту' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Комментарии получены',
    type: [CommentDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostComments(
    @Param('id', ParseIntPipe) postId: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    const comments = await this.postsService.getPostComments(postId, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return comments.map((c) => this.toCommentDto(c));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить свой пост' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({
    status: 204,
    description: 'Пост успешно удален',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - можно удалять только свои посты',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(
    @Param('id', ParseIntPipe) postId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.postsService.deletePost(postId, user.id);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить посты пользователя по ID' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Посты пользователя успешно получены',
    type: [PostDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPosts(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const posts = await this.postsService.getUserPosts(userId, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
    const enrichedPosts =
      await this.postsService.enrichPostsWithLikesAndComments(posts, user.id);
    return enrichedPosts.map((p) => this.toPostDto(p));
  }
}
