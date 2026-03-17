/**
 * Analytics Routes
 * Admin analytics endpoints with Swagger documentation
 */

import { Router } from 'express';
import {
  getOverview,
  getPostAnalytics,
  getUserAnalytics,
  getTagAnalytics,
} from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Admin analytics endpoints
 */

// All analytics routes are admin only
router.get('/overview', authenticate, authorize('admin'), getOverview);
router.get('/posts', authenticate, authorize('admin'), getPostAnalytics);
router.get('/users', authenticate, authorize('admin'), getUserAnalytics);
router.get('/tags', authenticate, authorize('admin'), getTagAnalytics);

export default router;
