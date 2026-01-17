import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PostsService } from './posts.service';
import { FeedPostDto } from './dto/post-response.dto';
import { Post as PostEntity } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';

@ApiTags('feed')
@Controller('api/v1/feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FeedController {
  constructor(private readonly postsService: PostsService) {}

  private toFeedPostDto(
    post: PostEntity & {
      likesCount?: number;
      isLiked?: boolean;
      commentsCount?: number;
      comments?: Comment[];
    },
  ): FeedPostDto {
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
      comments: (post as any).comments?.map((c: Comment) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.user?.id ?? c.userId,
          username: c.user?.username ?? '',
        },
      })),
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Список постов в ленте (посты пользователей, на которых я подписан)',
  })
  @ApiResponse({ status: 200, type: [FeedPostDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFeed(
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const posts = await this.postsService.getFeed(user.id, {
      limit: pagination.limit,
      offset: pagination.offset,
    });
    const enrichedPosts =
      await this.postsService.enrichPostsWithLikesAndComments(posts, user.id);
    return enrichedPosts.map((p) => this.toFeedPostDto(p));
  }
}
