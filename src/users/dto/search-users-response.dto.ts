import { ApiProperty } from '@nestjs/swagger';

export class SearchUsersResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'alice' })
  username: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000.jpg',
    description: 'Имя файла аватара. Для получения картинки используйте GET /api/v1/files/avatars/{avatar}',
    nullable: true,
    required: false,
  })
  avatar: string | null;

  @ApiProperty({ example: false })
  isFollowing: boolean;
}
