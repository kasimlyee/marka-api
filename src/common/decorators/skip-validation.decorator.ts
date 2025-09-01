import { SetMetadata } from '@nestjs/common';

export const SKIP_VALIDATION_KEY = 'skipValidation';
export const SkipValidation = () => SetMetadata(SKIP_VALIDATION_KEY, true);
