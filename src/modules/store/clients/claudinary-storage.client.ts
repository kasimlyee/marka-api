import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { StorageClient } from '../interfaces/storage-client.interface';

type ContentType = 'image' | 'video' | 'raw' | 'auto' | undefined;
@Injectable()
export class CloudinaryStorageClient implements StorageClient {
  private folder: string;

  constructor(config: any) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });

    this.folder = config.folder;
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          public_id: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
          resource_type: this.getResourceType(contentType),
          overwrite: true,
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.public_id);
          }
        },
      );

      stream.end(buffer);
    });
  }

  async getSignedUrl(publicId: string, expiresIn = 3600): Promise<string> {
    // Cloudinary doesn't need signed URLs for public resources
    // For private resources, you'd use cloudinary.url(publicId, { sign_url: true })
    return this.getPublicUrl(publicId);
  }

  async deleteFile(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  getPublicUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      secure: true,
      type: 'upload',
    });
  }

  private getResourceType(contentType: string): ContentType {
    if (contentType.startsWith('image/')) {
      return 'image';
    } else if (contentType.startsWith('video/')) {
      return 'video';
    } else if (contentType.startsWith('application/pdf')) {
      return 'raw'; // PDFs are treated as raw files
    } else {
      return 'auto';
    }
  }

  // Cloudinary-specific methods
  async uploadImageWithTransformations(
    buffer: Buffer,
    fileName: string,
    transformations: any[] = [],
  ): Promise<{ publicId: string; url: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          public_id: fileName.replace(/\.[^/.]+$/, ''),
          transformation: transformations,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            if (result)
              resolve({
                publicId: result.public_id,
                url: result.secure_url,
              });
          }
        },
      );

      stream.end(buffer);
    });
  }

  async generateImageThumbnail(
    publicId: string,
    width: number = 300,
    height: number = 300,
  ): Promise<string> {
    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill' },
        { quality: 'auto' },
        { format: 'jpg' },
      ],
    });
  }
}
