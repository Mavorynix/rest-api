/**
 * Upload Routes
 * File upload endpoints
 */

import { Router } from 'express';
import {
  uploadAvatarHandler,
  uploadPostImageHandler,
  deleteAvatarHandler,
} from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload endpoints
 */

// All routes require authentication
router.post('/avatar', authenticate, uploadAvatarHandler);
router.post('/post-image', authenticate, uploadPostImageHandler);
router.delete('/avatar', authenticate, deleteAvatarHandler);

export default router;
