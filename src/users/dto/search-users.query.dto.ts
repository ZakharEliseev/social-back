import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class SearchUsersQueryDto {
  @ApiPropertyOptional({
    example: 'john',
    description: 'Поиск по имени (ILIKE)',
  })
  @IsString({ message: 'Параметр q должен быть строкой' })
  @IsOptional()
  @Length(1, 50, {
    message: 'Параметр q должен быть длиной от 1 до 50 символов',
  })
  q?: string;
}
