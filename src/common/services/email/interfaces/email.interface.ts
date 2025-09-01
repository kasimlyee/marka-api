export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  //from: {
  // name: string;
  // email: string;
  //};
  replyTo?: string;
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  cid?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
  category: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  priority?: 'high' | 'normal' | 'low';
  headers?: Record<string, string>;
  messageId?: string;
  references?: string[];
  inReplyTo?: string;
  replyTo?: string;
  sender?: string;
  from?: string;
}

export interface EmailJob {
  id: string;
  emailOptions: EmailOptions;
  priority: number;
  attempts: number;
  delay?: number;
  metadata?: Record<string, any>;
}

export interface EmailAnalytics {
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  date: Date;
}
