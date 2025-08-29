// src/modules/storage/interfaces/storage-client.interface.ts
export interface StorageClient {
  /**
   * Upload a file to storage
   * @param buffer File buffer
   * @param fileName File name (without path)
   * @param contentType MIME type of the file
   * @returns Public ID or key of the uploaded file
   */
  uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<string>;

  /**
   * Get a signed URL for temporary access to a file
   * @param publicId Public ID or key of the file
   * @param expiresIn Expiration time in seconds (default: 3600)
   * @returns Signed URL
   */
  getSignedUrl(publicId: string, expiresIn?: number): Promise<string>;

  /**
   * Delete a file from storage
   * @param publicId Public ID or key of the file
   */
  deleteFile(publicId: string): Promise<void>;

  /**
   * Get public URL for a file
   * @param publicId Public ID or key of the file
   * @returns Public URL
   */
  getPublicUrl(publicId: string): string;
}
