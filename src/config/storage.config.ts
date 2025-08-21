import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  provider: process.env.STORAGE_PROVIDER || 's3',
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'marka-reports',
  },
  gcs: {
    keyFilename: process.env.GCS_KEY_FILENAME || '',
    bucket: process.env.GCS_BUCKET || 'marka-reports',
  },
}));