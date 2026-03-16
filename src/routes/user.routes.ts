/**
 * User Routes
 * User management endpoints with RBAC
 */

import { Router } from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uuidParamSchema, updateUserSchema } from '../validation/auth.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin'), getUsers);

// Routes accessible by owner or admin
router.get('/:id', validate(uuidParamSchema), getUser);
router.put('/:id', validate(uuidParamSchema), updateUser);
router.delete('/:id', validate(uuidParamSchema), deleteUser);

export default router;
