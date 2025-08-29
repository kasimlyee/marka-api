import { Injectable, Inject } from '@nestjs/common';
import type { StorageClient } from './interfaces/storage-client.interface';

export interface ImageTransformation {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
  effect?: string;
}

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  contentType?: string;
  transformations?: any[]; // Cloudinary transformations
}

@Injectable()
export class StoreService {
  constructor(
    @Inject('STORAGE_CLIENT') private readonly storageClient: StorageClient,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<{ publicId: string; url: string }> {
    const { fileName, contentType, transformations } = options;
    const finalFileName = fileName || `${Date.now()}-${file.originalname}`;

    let publicId: string;

    // Use Cloudinary-specific method for images with transformations
    if (transformations && file.mimetype.startsWith('image/')) {
      const result = await (
        this.storageClient as any
      ).uploadImageWithTransformations?.(
        file.buffer,
        finalFileName,
        transformations,
      );
      return result;
    } else {
      publicId = await this.storageClient.uploadFile(
        file.buffer,
        finalFileName,
        contentType || file.mimetype,
      );
    }

    return {
      publicId,
      url: this.storageClient.getPublicUrl(publicId),
    };
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    options: Omit<UploadOptions, 'fileName' | 'contentType'> = {},
  ): Promise<{ publicId: string; url: string }> {
    const publicId = await this.storageClient.uploadFile(
      buffer,
      fileName,
      contentType,
    );

    return {
      publicId,
      url: this.storageClient.getPublicUrl(publicId),
    };
  }

  async getSignedUrl(publicId: string, expiresIn = 3600): Promise<string> {
    return this.storageClient.getSignedUrl(publicId, expiresIn);
  }

  async deleteFile(publicId: string): Promise<void> {
    await this.storageClient.deleteFile(publicId);
  }

  getPublicUrl(publicId: string): string {
    return this.storageClient.getPublicUrl(publicId);
  }

  // Cloudinary-specific helper methods
  async uploadStudentPhoto(file: Express.Multer.File, studentId: string) {
    const transformations = [
      { width: 500, height: 500, crop: 'fill' },
      { quality: 'auto' },
      { format: 'jpg' },
    ];

    return this.uploadFile(file, {
      fileName: `student-${studentId}`,
      contentType: 'image/jpeg',
      transformations,
    });
  }

  async uploadReport(buffer: Buffer, reportName: string) {
    return this.uploadBuffer(
      buffer,
      `reports/${reportName}`,
      'application/pdf',
    );
  }

  async generateThumbnail(
    publicId: string,
    width: number = 300,
    height: number = 300,
  ): Promise<string> {
    if (
      typeof (this.storageClient as any).generateImageThumbnail === 'function'
    ) {
      return (this.storageClient as any).generateImageThumbnail(
        publicId,
        width,
        height,
      );
    }
    return this.getPublicUrl(publicId);
  }

  getOptimizedImageUrlV2(
    publicId: string,
    options: ImageTransformation = {},
  ): string {
    const cloudinaryClient = this.storageClient as any;

    if (cloudinaryClient.getPublicUrlWithTransformations) {
      return cloudinaryClient.getPublicUrlWithTransformations(
        publicId,
        options,
      );
    }

    // Fallback: manually construct URL with transformations
    const transformations: string[] = [];

    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    if (options.effect) transformations.push(`e_${options.effect}`);

    if (transformations.length > 0) {
      const url = this.getPublicUrl(publicId);
      return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
    }

    return this.getPublicUrl(publicId);
  }
}
