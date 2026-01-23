import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Неверный формат email' })
  @Length(6, 50, { message: 'Email должен быть от 6 до 50 символов' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @Length(6, 50, { message: 'Пароль должен быть от 6 до 50 символов' })
  password: string;
}
