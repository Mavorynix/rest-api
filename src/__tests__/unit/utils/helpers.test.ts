/**
 * Unit Tests for Utility Functions
 * Tests for src/utils/helpers.ts
 */

import {
  formatBytes,
  isValidEmail,
  isValidUUID,
  sanitizeString,
  generateRandomString,
  getPagination,
  buildPaginationMeta,
  removeEmptyFields,
  sleep,
} from '../../utils/helpers';

describe('Utility Functions', () => {
  
  // ==========================================
  // formatBytes
  // ==========================================
  describe('formatBytes', () => {
    it('should return "0 Bytes" for 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1234, 2)).toBe('1.21 KB');
    });
  });

  // ==========================================
  // isValidEmail
  // ==========================================
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  // ==========================================
  // isValidUUID
  // ==========================================
  describe('isValidUUID', () => {
    it('should return true for valid UUID', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
      expect(isValidUUID('invalid')).toBe(false);
      expect(isValidUUID('12345')).toBe(false);
    });
  });

  // ==========================================
  // sanitizeString
  // ==========================================
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<p>Hello</p>')).toBe('Hello');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });
  });

  // ==========================================
  // generateRandomString
  // ==========================================
  describe('generateRandomString', () => {
    it('should generate string of default length', () => {
      const result = generateRandomString();
      expect(result.length).toBe(10);
    });

    it('should generate string of custom length', () => {
      expect(generateRandomString(5).length).toBe(5);
    });

    it('should generate different strings', () => {
      const str1 = generateRandomString();
      const str2 = generateRandomString();
      expect(str1).not.toBe(str2);
    });
  });

  // ==========================================
  // getPagination
  // ==========================================
  describe('getPagination', () => {
    it('should calculate correct offset for page 1', () => {
      expect(getPagination(1, 10)).toEqual({ offset: 0, limit: 10 });
    });

    it('should calculate correct offset for page 2', () => {
      expect(getPagination(2, 10)).toEqual({ offset: 10, limit: 10 });
    });
  });

  // ==========================================
  // buildPaginationMeta
  // ==========================================
  describe('buildPaginationMeta', () => {
    it('should build correct pagination metadata', () => {
      const meta = buildPaginationMeta(100, 1, 10);
      
      expect(meta).toEqual({
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it('should handle last page correctly', () => {
      const meta = buildPaginationMeta(100, 10, 10);
      
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPrevPage).toBe(true);
    });
  });

  // ==========================================
  // removeEmptyFields
  // ==========================================
  describe('removeEmptyFields', () => {
    it('should remove undefined fields', () => {
      const obj = { a: 1, b: undefined, c: 3 };
      const result = removeEmptyFields(obj);
      
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should remove null fields', () => {
      const obj = { a: 1, b: null, c: 3 };
      const result = removeEmptyFields(obj);
      
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should keep empty strings and zero values', () => {
      const obj = { a: '', b: 0, c: false };
      const result = removeEmptyFields(obj);
      
      expect(result).toEqual({ a: '', b: 0, c: false });
    });
  });

  // ==========================================
  // sleep
  // ==========================================
  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });
  });
});
