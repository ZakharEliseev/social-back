import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: 'offset должен быть целым числом' })
  @IsOptional()
  @Min(0, { message: 'offset не может быть меньше 0' })
  offset?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt({ message: 'limit должен быть целым числом' })
  @IsOptional()
  @Min(1, { message: 'limit не может быть меньше 1' })
  @Max(100, { message: 'limit не может быть больше 100' })
  limit?: number;
}
