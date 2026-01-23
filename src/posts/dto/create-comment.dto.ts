import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Отличный пост!',
    description: 'Текст комментария',
  })
  @IsString({ message: 'Комментарий должен быть строкой' })
  @IsNotEmpty({ message: 'Комментарий не может быть пустым' })
  @MaxLength(1000, {
    message: 'Комментарий не может быть длиннее 1000 символов',
  })
  text: string;
}
