/**
 * Utility Functions
 * Shared helper functions for the API
 */

import { v4 as uuidv4 } from 'uuid';
import sanitizeHtml from 'sanitize-html';

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Check if string is valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if string is valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Sanitize string - remove dangerous HTML content
 * Uses sanitize-html library for robust XSS protection
 * @see https://github.com/apostrophecms/sanitize-html
 */
export const sanitizeString = (str: string): string => {
  if (!str) return '';
  
  // Configure sanitize-html to strip all HTML tags but keep text content
  // This is safer than regex-based approaches which can be bypassed
  const sanitized = sanitizeHtml(str, {
    allowedTags: [],           // Strip all HTML tags
    allowedAttributes: {},     // No attributes allowed
    disallowedTagsMode: 'discard',  // Completely remove disallowed tags
    allowProtocolRelative: false,   // Block protocol-relative URLs
    enforceHtmlBoundary: false,
  });
  
  // Decode common HTML entities
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&nbsp;': ' ',
  };
  
  let decoded = sanitized;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  return decoded.trim();
};

/**
 * Sanitize HTML content allowing safe tags
 * Use this when you need to preserve some HTML formatting
 */
export const sanitizeHtmlContent = (str: string): string => {
  if (!str) return '';
  
  return sanitizeHtml(str, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
    },
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
    allowProtocolRelative: false,
  }).trim();
};

/**
 * Generate random string
 */
export const generateRandomString = (length = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Calculate pagination offset and limit
 */
export const getPagination = (page: number, limit: number) => {
  const offset = (page - 1) * limit;
  return { offset, limit };
};

/**
 * Build pagination metadata
 */
export const buildPaginationMeta = (total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Sleep function for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Remove undefined/null fields from object
 */
export const removeEmptyFields = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  
  return result as Partial<T>;
};
