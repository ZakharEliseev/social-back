import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    default: 1,
    description: 'Номер страницы (начинается с 1)',
  })
  @Type(() => Number)
  @IsInt({ message: 'page должен быть целым числом' })
  @IsOptional()
  @Min(1, { message: 'page не может быть меньше 1' })
  page: number = 1;

  @ApiPropertyOptional({
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Количество элементов на странице',
  })
  @Type(() => Number)
  @IsInt({ message: 'limit должен быть целым числом' })
  @IsOptional()
  @Min(1, { message: 'limit не может быть меньше 1' })
  @Max(100, { message: 'limit не может быть больше 100' })
  limit: number = 20;

  /**
   * Вычисляет offset на основе page и limit
   */
  getOffset(): number {
    return (this.page - 1) * this.limit;
  }
}
