import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @Length(6, 50)
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @Length(6, 50)
  password: string;
}
