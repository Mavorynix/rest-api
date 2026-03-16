/**
 * Auth Routes
 * Authentication endpoints with rate limiting
 * Includes email verification and password reset
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
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
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
 *   description: Authentication and email verification endpoints
 */

// Public routes with rate limiting
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, refreshToken);

// Email verification routes
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);

// Password reset routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, validate(updateUserSchema), updateProfile);
router.delete('/me', authenticate, deleteAccount);
router.post('/logout', authenticate, logout);

export default router;
