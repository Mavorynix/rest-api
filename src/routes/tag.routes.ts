/**
 * Tag Routes
 * Tag management endpoints with Swagger documentation
 */

import { Router } from 'express';
import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  getPostsByTag,
} from '../controllers/tag.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: Tag management endpoints
 */

// Validation schemas
const createTagSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Tag name is required')
      .max(50, 'Tag name too long')
      .transform(name => name.toLowerCase().trim()),
    description: z
      .string()
      .max(200, 'Description too long')
      .optional(),
  }),
});

const updateTagSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Tag name cannot be empty')
      .max(50, 'Tag name too long')
      .transform(name => name.toLowerCase().trim())
      .optional(),
    description: z
      .string()
      .max(200, 'Description too long')
      .optional(),
  }),
});

const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

// Public routes
router.get('/', getTags);
router.get('/:id', validate(uuidParamSchema), getTag);
router.get('/name/:tagName', getPostsByTag);

// Protected routes (admin only)
router.post('/', authenticate, authorize('admin'), validate(createTagSchema), createTag);
router.put('/:id', authenticate, authorize('admin'), validate(uuidParamSchema), validate(updateTagSchema), updateTag);
router.delete('/:id', authenticate, authorize('admin'), validate(uuidParamSchema), deleteTag);

export default router;
