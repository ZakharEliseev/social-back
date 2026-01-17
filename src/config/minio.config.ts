import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client } from 'minio';

export const MinioConfigProvider = {
  provide: 'MINIO_CLIENT',
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const client = new Client({
      endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(configService.get<string>('MINIO_PORT', '9000'), 10),
      useSSL: configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });

    const bucketName = configService.get<string>('MINIO_BUCKET', 'avatars');

    // Создаем bucket если не существует
    const bucketExists = await client.bucketExists(bucketName);
    if (!bucketExists) {
      await client.makeBucket(bucketName, 'us-east-1');

      // Делаем bucket публичным для чтения
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await client.setBucketPolicy(bucketName, JSON.stringify(policy));
    }

    return client;
  },
};
