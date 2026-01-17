import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucketName: string;

  constructor(
    @Inject('MINIO_CLIENT')
    private readonly minioClient: Client,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'avatars');
  }

  async uploadFile(file: Express.Multer.File, prefix = ''): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const fileName = `${prefix}${uuidv4()}.${ext}`;

    await this.minioClient.putObject(
      this.bucketName,
      fileName,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
      },
    );

    this.logger.log(`File uploaded: ${fileName}`);
    return fileName;
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, fileName);
      this.logger.log(`File deleted: ${fileName}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${fileName}`, error);
    }
  }

  getFileName(fileName: string): string {
    // Возвращаем только имя файла, клиент сам соберёт URL
    return fileName;
  }
}
