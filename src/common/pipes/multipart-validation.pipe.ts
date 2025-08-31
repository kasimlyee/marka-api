// src/common/pipes/multipart-validation.pipe.ts
import { ValidationPipe, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class MultipartValidationPipe extends ValidationPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    // Get the request object
    const request = this.getRequest(metadata);

    // Skip validation if the @SkipValidation() decorator was used
    if (request?._skipValidation) {
      return value;
    }

    // Proceed with normal validation for other requests
    return super.transform(value, metadata);
  }

  private getRequest(metadata: ArgumentMetadata): any {
    if (metadata.data && typeof metadata.data === 'object') {
      // The request is usually available in the metadata data
      return (metadata.data as any).req;
    }
    return null;
  }
}