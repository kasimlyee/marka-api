import { ValidationPipe, ArgumentMetadata, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SmartValidationPipe extends ValidationPipe {
  constructor(private readonly reflector: Reflector) {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
    });
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    // Check for skip validation decorator first
    const skipValidation = this.reflector.getAllAndOverride<boolean>(
      'skipValidation',
      [metadata.metatype, metadata.metatype?.prototype],
    );

    if (skipValidation) {
      return value;
    }

    // Skip validation for file uploads
    if (this.isFileUpload(value, metadata)) {
      return value;
    }

    // Skip validation if no metatype or not a class
    if (!metadata.metatype || !this.toValidate(metadata)) {
      return value;
    }

    // Use the parent ValidationPipe for normal validation
    return super.transform(value, metadata);
  }

  private isFileUpload(value: any, metadata: ArgumentMetadata): boolean {
    // Check if it's a file object from multer
    if (value && typeof value === 'object') {
      // Multer file object has these properties
      if (value.fieldname && value.originalname && value.buffer) {
        return true;
      }

      // Check for multipart form data indicators
      if (value.constructor && value.constructor.name === 'File') {
        return true;
      }
    }

    // Check if the parameter type suggests file upload
    if (metadata.type === 'custom' && metadata.data === 'file') {
      return true;
    }

    // Check if metadata indicates this is likely a file parameter
    if (metadata.data === 'file' || metadata.data === 'files') {
      return true;
    }

    return false;
  }

  protected toValidate(metadata: ArgumentMetadata): boolean {
    const { metatype } = metadata;
    if (!metatype) {
      return false;
    }
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
