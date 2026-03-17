import { Router } from 'express';
import {
  likePost,
  unlikePost,
  getPostLikes,
  getPostLikeStatus,
} from '../controllers/like.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: Like/Unlike posts
 */

// Public routes
router.get('/status', optionalAuth, getPostLikeStatus);
router.get('/', getPostLikes);

// Protected routes
router.post('/', authenticate, likePost);
router.delete('/', authenticate, unlikePost);

export default router;
