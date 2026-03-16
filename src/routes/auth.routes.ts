/**
 * Auth Routes
 * Authentication endpoints with rate limiting
 */

import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  deleteAccount,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, updateUserSchema } from '../validation/auth.validation';
import { authLimiter, loginLimiter } from '../config/rateLimit';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

// Public routes with rate limiting
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, refreshToken);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, validate(updateUserSchema), updateProfile);
router.delete('/me', authenticate, deleteAccount);
router.post('/logout', authenticate, logout);

export default router;
