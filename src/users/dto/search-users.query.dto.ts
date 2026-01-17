import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class SearchUsersQueryDto {
  @ApiPropertyOptional({
    example: 'john',
    description: 'Search by name (ILIKE)',
  })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  q?: string;
}
