/**
 * Activity Routes
 * Activity feed and trending endpoints with Swagger documentation
 */

import { Router } from 'express';
import {
  getActivityFeed,
  getTrendingPosts,
  getRecentActivity,
} from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Activity
 *   description: Activity feed and trending endpoints
 */

// Public routes
router.get('/trending', getTrendingPosts);

// Protected routes
router.get('/feed', authenticate, getActivityFeed);
router.get('/recent', authenticate, getRecentActivity);

export default router;
