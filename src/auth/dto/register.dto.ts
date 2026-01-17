import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'Имя пользователя (username)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Имя пользователя обязательно' })
  @Length(2, 30, {
    message: 'Имя пользователя должно быть от 2 до 30 символов',
  })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Имя пользователя может содержать только латинские буквы, цифры, _ и -',
  })
  username: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email адрес',
  })
  @IsEmail({}, { message: 'Неверный формат email' })
  @Length(6, 100, { message: 'Email должен быть от 6 до 100 символов' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Пароль (минимум 6 символов)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @Length(6, 100, { message: 'Пароль должен быть от 6 до 100 символов' })
  password: string;
}
