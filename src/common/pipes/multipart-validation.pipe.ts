import { ValidationPipe, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class MultipartValidationPipe extends ValidationPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    // Skip validation for multipart/form-data requests
    if (this.isMultipartRequest(value)) {
      return value;
    }

    // Proceed with normal validation for other requests
    return super.transform(value, metadata);
  }

  private isMultipartRequest(value: any): boolean {
    // Check if the value looks like a multipart request
    // Multipart requests typically have file objects or complex structures
    if (value && typeof value === 'object') {
      // Check for common multipart indicators
      const hasFile = Object.values(value).some(
        (field: any) => field && field.fieldname && field.buffer,
      );

      const hasMultipartFields = Object.keys(value).some(
        (key) =>
          key.includes('file') || key.includes('logo') || key.includes('photo'),
      );

      return hasFile || hasMultipartFields;
    }
    return false;
  }
}
