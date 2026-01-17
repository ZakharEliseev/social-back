import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'marina' })
  username: string;

  @ApiProperty({ example: 'marina@example.com' })
  email: string;

  @ApiProperty({ example: 'Люблю искусство и дизайн', required: false })
  bio?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000.jpg',
    description:
      'Имя файла аватара. Для получения картинки используйте GET /api/v1/files/avatars/{avatar}',
    required: false,
  })
  avatar?: string;

  @ApiProperty({ example: 12, description: 'Количество постов' })
  postsCount: number;

  @ApiProperty({ example: 256, description: 'Количество подписчиков' })
  followersCount: number;

  @ApiProperty({ example: 143, description: 'Количество подписок' })
  followingCount: number;

  @ApiProperty({
    example: false,
    description: 'Подписан ли текущий пользователь на этого',
  })
  isFollowing: boolean;

  @ApiProperty({
    example: false,
    description: 'Это профиль текущего пользователя',
  })
  isOwnProfile: boolean;

  @ApiProperty({ example: '2026-01-14T18:13:29.000Z' })
  createdAt: string;
}
