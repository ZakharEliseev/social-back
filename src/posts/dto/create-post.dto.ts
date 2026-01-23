import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Заголовок поста' })
  @IsString({ message: 'Заголовок должен быть строкой' })
  @IsNotEmpty({ message: 'Заголовок не может быть пустым' })
  @Length(1, 50, {
    message: 'Заголовок должен быть длиной от 1 до 50 символов',
  })
  title: string;

  @ApiProperty({ example: 'Текст поста' })
  @IsString({ message: 'Текст должен быть строкой' })
  @IsNotEmpty({ message: 'Текст не может быть пустым' })
  @Length(1, 100, {
    message: 'Текст должен быть длиной от 1 до 100 символов',
  })
  text: string;
}
