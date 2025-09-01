export interface SmsModuleOptions {
  username: string;
  password: string;
  defaultSenderId: string;
  defaultPriority?: number;
  isSandbox?: boolean;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}
