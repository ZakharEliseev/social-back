import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Great post!',
    description: 'Comment text',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;
}
