/**
 * Post Routes
 * Post CRUD endpoints with Swagger documentation
 */

import { Router } from 'express';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getMyPosts,
} from '../controllers/post.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createPostSchema, uuidParamSchema } from '../validation/auth.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management endpoints
 */

// Public routes
router.get('/', getPosts);
router.get('/user/me', authenticate, getMyPosts);
router.get('/:id', validate(uuidParamSchema), getPost);

// Protected routes
router.post('/', authenticate, validate(createPostSchema), createPost);
router.put('/:id', authenticate, validate(uuidParamSchema), updatePost);
router.delete('/:id', authenticate, validate(uuidParamSchema), deletePost);

export default router;
