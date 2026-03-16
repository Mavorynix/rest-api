/**
 * Notification Routes
 * Notification management endpoints
 */

import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendTestNotification,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uuidParamSchema } from '../validation/auth.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time notification endpoints
 */

// All routes require authentication
router.get('/', authenticate, getNotifications);
router.put('/read-all', authenticate, markAllAsRead);
router.post('/test', authenticate, sendTestNotification);
router.put('/:id/read', authenticate, validate(uuidParamSchema), markAsRead);
router.delete('/:id', authenticate, validate(uuidParamSchema), deleteNotification);

export default router;
