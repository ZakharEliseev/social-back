import { ApiProperty } from '@nestjs/swagger';

export class UploadAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Файл изображения (JPEG, PNG, WebP, макс 5MB)',
  })
  avatar: Express.Multer.File;
}
