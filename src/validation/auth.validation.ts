/**
 * Validation Schemas using Zod
 * Input validation for API endpoints
 */

import { z } from 'zod';

/**
 * User registration schema
 */
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required')
      .max(255, 'Email too long'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username too long')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

/**
 * User login schema
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(1, 'Password is required'),
  }),
});

/**
 * Update user schema
 */
export const updateUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username too long')
      .regex(/^[a-zA-Z0-9_]+$/, 'Invalid username format')
      .optional(),
    email: z
      .string()
      .email('Invalid email format')
      .max(255, 'Email too long')
      .optional(),
  }),
});

/**
 * Create post schema
 */
export const createPostSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title too long'),
    content: z
      .string()
      .min(1, 'Content is required')
      .max(10000, 'Content too long'),
  }),
});

/**
 * Update post schema
 */
export const updatePostSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title too long')
      .optional(),
    content: z
      .string()
      .min(1, 'Content cannot be empty')
      .max(10000, 'Content too long')
      .optional(),
  }),
});

/**
 * Pagination query schema
 */
export const paginationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .refine(n => n > 0, 'Page must be greater than 0')
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('10'),
  }),
});

/**
 * UUID param schema
 */
export const uuidParamSchema = z.object({
  params: z.object({
    id: z
      .string()
      .uuid('Invalid ID format'),
  }),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type CreatePostInput = z.infer<typeof createPostSchema>['body'];
export type UpdatePostInput = z.infer<typeof updatePostSchema>['body'];
