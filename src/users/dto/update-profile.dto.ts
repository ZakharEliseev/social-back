import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsEmail,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'newemail@example.com',
    description: 'Email адрес',
    required: false,
  })
  @IsEmail({}, { message: 'Неверный формат email' })
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiProperty({
    example: 'Люблю искусство и дизайн',
    description: 'Описание профиля (био)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Био не может быть длиннее 500 символов' })
  bio?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'oldPassword123',
    description: 'Текущий пароль',
  })
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
  currentPassword: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Новый пароль',
  })
  @IsString()
  @MinLength(6, { message: 'Новый пароль должен быть минимум 6 символов' })
  @MaxLength(100)
  newPassword: string;
}
