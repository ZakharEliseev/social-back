import { ApiProperty } from '@nestjs/swagger';

export class CommentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Great post!' })
  text: string;

  @ApiProperty({ example: '2026-01-14T18:13:29.000Z' })
  createdAt: string;

  @ApiProperty({
    example: { id: 1, username: 'johndoe' },
  })
  author: {
    id: number;
    username: string;
  };
}

export class PostDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'My Post Title' })
  title: string;

  @ApiProperty({ example: 'Post content text' })
  text: string;

  @ApiProperty({ example: '2026-01-14T18:13:29.000Z' })
  createdAt: string;

  @ApiProperty({
    example: { id: 1, username: 'johndoe' },
  })
  author: {
    id: number;
    username: string;
  };

  @ApiProperty({ example: 5, description: 'Number of likes' })
  likesCount: number;

  @ApiProperty({
    example: true,
    description: 'Whether current user liked this post',
  })
  isLiked: boolean;

  @ApiProperty({ example: 3, description: 'Number of comments' })
  commentsCount: number;

  @ApiProperty({
    type: [CommentDto],
    description: 'Recent comments (last 5)',
    required: false,
  })
  comments?: CommentDto[];
}

export class FeedPostDto extends PostDto {}
