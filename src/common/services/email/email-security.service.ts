import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as DOMPurify from 'isomorphic-dompurify';
import domains from 'disposable-email-domains';

@Injectable()
export class EmailSecurityService {
  private readonly logger = new Logger(EmailSecurityService.name);
  private readonly blockedDomains: Set<string> = new Set();
  private readonly allowedDomains: Set<string> = new Set();

  constructor() {
    this.initializeBlockedDomains();
  }

  private initializeBlockedDomains(): void {
    // Common disposable email domains
    const disposableDomains = domains;

    disposableDomains.forEach((domain) => this.blockedDomains.add(domain));
  }

  sanitizeHtmlContent(html: string): string {
    try {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p',
          'br',
          'strong',
          'em',
          'u',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'ul',
          'ol',
          'li',
          'a',
          'img',
          'table',
          'thead',
          'tbody',
          'tr',
          'td',
          'th',
          'div',
          'span',
          'blockquote',
          'pre',
          'code',
        ],
        ALLOWED_ATTR: [
          'href',
          'target',
          'src',
          'alt',
          'title',
          'width',
          'height',
          'style',
          'class',
          'id',
        ],
        ALLOWED_URI_REGEXP:
          /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
      });
    } catch (error) {
      this.logger.error('Failed to sanitize HTML content', error);
      return html; // Return original if sanitization fails
    }
  }

  validateEmailAddress(email: string): { valid: boolean; reason?: string } {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }

    // Extract domain
    const domain = email.split('@')[1].toLowerCase();

    // Check against blocked domains
    if (this.blockedDomains.has(domain)) {
      return { valid: false, reason: 'Email domain is blocked' };
    }

    // Check against allowed domains (if whitelist is enabled)
    if (this.allowedDomains.size > 0 && !this.allowedDomains.has(domain)) {
      return { valid: false, reason: 'Email domain is not whitelisted' };
    }

    return { valid: true };
  }

  generateUnsubscribeToken(email: string, listId?: string): string {
    const data = `${email}:${listId || 'default'}:${Date.now()}`;
    return crypto
      .createHmac('sha256', process.env.EMAIL_SECRET || 'default-secret')
      .update(data)
      .digest('hex');
  }

  verifyUnsubscribeToken(
    token: string,
    email: string,
    listId?: string,
  ): boolean {
    try {
      const expectedToken = this.generateUnsubscribeToken(email, listId);
      return crypto.timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(expectedToken, 'hex'),
      );
    } catch (error) {
      this.logger.error('Failed to verify unsubscribe token', error);
      return false;
    }
  }

  detectSpamPatterns(content: string): {
    isSpam: boolean;
    score: number;
    patterns: string[];
  } {
    const spamPatterns = [
      { pattern: /click here now/gi, score: 3, name: 'urgency_language' },
      { pattern: /100% free/gi, score: 2, name: 'free_claims' },
      { pattern: /act now/gi, score: 2, name: 'action_words' },
      { pattern: /limited time/gi, score: 2, name: 'time_pressure' },
      { pattern: /\$\$\$/g, score: 3, name: 'excessive_money_symbols' },
      { pattern: /URGENT/gi, score: 2, name: 'caps_urgent' },
    ];

    let totalScore = 0;
    const matchedPatterns: string[] = [];

    for (const { pattern, score, name } of spamPatterns) {
      if (pattern.test(content)) {
        totalScore += score;
        matchedPatterns.push(name);
      }
    }

    return {
      isSpam: totalScore >= 5,
      score: totalScore,
      patterns: matchedPatterns,
    };
  }

  addBlockedDomain(domain: string): void {
    this.blockedDomains.add(domain.toLowerCase());
    this.logger.log(`Added ${domain} to blocked domains list`);
  }

  removeBlockedDomain(domain: string): void {
    this.blockedDomains.delete(domain.toLowerCase());
    this.logger.log(`Removed ${domain} from blocked domains list`);
  }

  addAllowedDomain(domain: string): void {
    this.allowedDomains.add(domain.toLowerCase());
    this.logger.log(`Added ${domain} to allowed domains list`);
  }

  getBlockedDomains(): string[] {
    return Array.from(this.blockedDomains);
  }

  getAllowedDomains(): string[] {
    return Array.from(this.allowedDomains);
  }
}
