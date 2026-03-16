/**
 * Unit Tests for Validation Schemas
 * Tests for src/validation/auth.validation.ts
 */

import { ZodError } from 'zod';
import {
  registerSchema,
  loginSchema,
  createPostSchema,
  paginationSchema,
  uuidParamSchema,
} from '../../validation/auth.validation';

describe('Validation Schemas', () => {
  
  // ==========================================
  // registerSchema
  // ==========================================
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        body: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123',
        },
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        body: {
          email: 'invalid-email',
          username: 'testuser',
          password: 'Password123',
        },
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short username', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          username: 'ab',
          password: 'Password123',
        },
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject username with special characters', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          username: 'test@user',
          password: 'Password123',
        },
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password (no uppercase)', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        },
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password (no number)', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'PasswordOnly',
        },
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'Pass1',
        },
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
        },
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================
  // loginSchema
  // ==========================================
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        body: {
          email: 'test@example.com',
          password: 'anypassword',
        },
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        body: {
          email: 'invalid',
          password: 'password',
        },
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          password: '',
        },
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
        },
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================
  // createPostSchema
  // ==========================================
  describe('createPostSchema', () => {
    it('should validate valid post data', () => {
      const validData = {
        body: {
          title: 'Test Post',
          content: 'This is the content of the post.',
        },
      };

      const result = createPostSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const invalidData = {
        body: {
          title: '',
          content: 'Content here',
        },
      };

      const result = createPostSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject title too long', () => {
      const invalidData = {
        body: {
          title: 'a'.repeat(201),
          content: 'Content here',
        },
      };

      const result = createPostSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const invalidData = {
        body: {
          title: 'Test Post',
          content: '',
        },
      };

      const result = createPostSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject content too long', () => {
      const invalidData = {
        body: {
          title: 'Test Post',
          content: 'a'.repeat(10001),
        },
      };

      const result = createPostSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================
  // paginationSchema
  // ==========================================
  describe('paginationSchema', () => {
    it('should validate valid pagination params', () => {
      const validData = {
        query: {
          page: '1',
          limit: '10',
        },
      };

      const result = paginationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should use default values when not provided', () => {
      const validData = {
        query: {},
      };

      const result = paginationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.page).toBe('1');
        expect(result.data.query.limit).toBe('10');
      }
    });

    it('should reject non-numeric page', () => {
      const invalidData = {
        query: {
          page: 'abc',
          limit: '10',
        },
      };

      const result = paginationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject limit above 100', () => {
      const invalidData = {
        query: {
          page: '1',
          limit: '101',
        },
      };

      const result = paginationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject page less than 1', () => {
      const invalidData = {
        query: {
          page: '0',
          limit: '10',
        },
      };

      const result = paginationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================
  // uuidParamSchema
  // ==========================================
  describe('uuidParamSchema', () => {
    it('should validate valid UUID', () => {
      const validData = {
        params: {
          id: '550e8400-e29b-41d4-a716-446655440000',
        },
      };

      const result = uuidParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        params: {
          id: 'invalid-uuid',
        },
      };

      const result = uuidParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject numeric ID', () => {
      const invalidData = {
        params: {
          id: '12345',
        },
      };

      const result = uuidParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
