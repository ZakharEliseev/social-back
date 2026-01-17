import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { StorageService } from '../common/services/storage.service';
import { Inject } from '@nestjs/common';
import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';

@ApiTags('files')
@Controller('api/v1/files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);
  private readonly bucketName: string;

  constructor(
    @Inject('MINIO_CLIENT')
    private readonly minioClient: Client,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'avatars');
  }

  @Get('avatars/:filename')
  @ApiOperation({ summary: 'Получить аватар пользователя' })
  @ApiParam({
    name: 'filename',
    description: 'Имя файла аватара',
    example: 'avatars/550e8400-e29b-41d4-a716-446655440000.jpg',
  })
  @ApiResponse({ status: 200, description: 'Файл успешно получен' })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  async getAvatar(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      // Получаем объект из MinIO
      const dataStream = await this.minioClient.getObject(
        this.bucketName,
        filename,
      );

      // Получаем метаданные для определения Content-Type
      const stat = await this.minioClient.statObject(this.bucketName, filename);
      const contentType = stat.metaData?.['content-type'] || 'image/jpeg';

      // Устанавливаем заголовки
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Кеш на год

      // Проксируем поток данных
      dataStream.pipe(res);
    } catch (error) {
      this.logger.warn(`File not found: ${filename}`, error);
      throw new NotFoundException('Файл не найден');
    }
  }
}
