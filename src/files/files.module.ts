import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files.controller';
import { StorageService } from '../common/services/storage.service';
import { MinioConfigProvider } from '../config/minio.config';

@Module({
  imports: [ConfigModule],
  controllers: [FilesController],
  providers: [StorageService, MinioConfigProvider],
  exports: [StorageService],
})
export class FilesModule {}
