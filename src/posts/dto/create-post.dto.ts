import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'My Post Title' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  title: string;

  @ApiProperty({ example: 'Post content text' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  text: string;
}
