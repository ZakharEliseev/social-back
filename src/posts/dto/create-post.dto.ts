import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Текст поста' })
  @IsString({ message: 'Текст должен быть строкой' })
  @IsNotEmpty({ message: 'Текст не может быть пустым' })
  @Length(1, 100, {
    message: 'Текст должен быть длиной от 1 до 100 символов',
  })
  text: string;
}
