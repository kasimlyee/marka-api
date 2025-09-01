import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
//import { S3StorageClient } from './clients/s3-storage.client';
import { CloudinaryStorageClient } from './clients/claudinary-storage.client';
//import { LocalStorageClient } from './clients/local-storage.client';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'STORAGE_CLIENT',
      useFactory: (configService: ConfigService) => {
        const storageConfig = configService.get('storage');

        switch (storageConfig.provider) {
          case 'cloudinary':
            return new CloudinaryStorageClient(storageConfig.cloudinary);
          case 's3':
            return; //new S3StorageClient(storageConfig.s3);  ---> To be implemented
          case 'local':
            return; //new LocalStorageClient(storageConfig.local); ---> To be implemented
          default:
            throw new Error(
              `Unsupported storage provider: ${storageConfig.provider}`,
            );
        }
      },
      inject: [ConfigService],
    },
    StoreService,
  ],
  controllers: [StoreController],
  exports: [StoreService],
})
export class StoreModule {}
