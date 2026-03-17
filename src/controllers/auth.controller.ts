/**
 * Auth Controller
 * Handles authentication endpoints with refresh token support
 * Includes email verification functionality
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../models/db';
import { AppError, badRequest, unauthorized } from '../middleware/error.middleware';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../config/email';
import { sendNotificationToUser } from '../config/socket';

// Generate access token (short-lived)
const generateAccessToken = (id: string, email: string, role: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Generate refresh token (long-lived)
const generateRefreshToken = (): string => {
  return jwt.sign({ random: Math.random() }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *                 minLength: 3
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User registered successfully. Verification email sent.
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await db.user.findByEmail(email);
    if (existingUser) {
      throw badRequest('Email is already registered');
    }
    
    // Create user
    const user = await db.user.create({ email, username, password });
    
    // Create verification token
    const verificationToken = await db.verificationToken.create(
      user.id,
      'email_verification',
      24 // 24 hours
    );
    
    // Send verification email
    const emailResult = await sendVerificationEmail(email, username, verificationToken);
    
    // Generate tokens (user can login but with limited access until verified)
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken();
    
    // Save refresh token
    await db.refreshToken.create(user.id, refreshToken, 7);
    
    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
        isVerified: false,
        message: 'Registration successful! Please check your email to verify your account.',
        emailPreviewUrl: emailResult.previewUrl, // For development
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email address
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      throw badRequest('Verification token is required');
    }
    
    // Find verification token
    const verificationToken = await db.verificationToken.findByToken(token);
    
    if (!verificationToken) {
      throw badRequest('Invalid verification token');
    }
    
    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      await db.verificationToken.delete(token);
      throw badRequest('Verification token has expired. Please request a new one.');
    }
    
    // Check if it's an email verification token
    if (verificationToken.type !== 'email_verification') {
      throw badRequest('Invalid token type');
    }
    
    // Update user's verification status
    const user = await db.user.findById(verificationToken.userId);
    if (!user) {
      throw badRequest('User not found');
    }
    
    await db.user.update(user.id, { isVerified: true });
    
    // Delete the verification token
    await db.verificationToken.delete(token);
    
    // Send welcome email
    await sendWelcomeEmail(user.email, user.username);
    
    // Send real-time notification if user is online
    sendNotificationToUser(user.id, {
      id: Date.now().toString(),
      type: 'success',
      title: 'Email Verified!',
      message: 'Your email has been verified successfully. Welcome!',
      createdAt: new Date(),
    });
    
    res.json({
      success: true,
      message: 'Email verified successfully! You can now access all features.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: User not found or already verified
 */
export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    
    const user = await db.user.findByEmail(email);
    if (!user) {
      throw badRequest('User not found');
    }
    
    if (user.isVerified) {
      throw badRequest('Email is already verified');
    }
    
    // Delete old verification tokens
    await db.verificationToken.deleteByUserId(user.id, 'email_verification');
    
    // Create new verification token
    const verificationToken = await db.verificationToken.create(
      user.id,
      'email_verification',
      24
    );
    
    // Send verification email
    const emailResult = await sendVerificationEmail(email, user.username, verificationToken);
    
    res.json({
      success: true,
      message: 'Verification email sent successfully',
      emailPreviewUrl: emailResult.previewUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    
    const user = await db.user.findByEmail(email);
    if (!user) {
      // Don't reveal that user doesn't exist
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      return;
    }
    
    // Delete old password reset tokens
    await db.verificationToken.deleteByUserId(user.id, 'password_reset');
    
    // Create new password reset token
    const resetToken = await db.verificationToken.create(
      user.id,
      'password_reset',
      1 // 1 hour
    );
    
    // Send password reset email
    const emailResult = await sendPasswordResetEmail(email, user.username, resetToken);
    
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      emailPreviewUrl: emailResult.previewUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      throw badRequest('Token and password are required');
    }
    
    // Find reset token
    const resetToken = await db.verificationToken.findByToken(token);
    
    if (!resetToken || resetToken.type !== 'password_reset') {
      throw badRequest('Invalid reset token');
    }
    
    if (resetToken.expiresAt < new Date()) {
      await db.verificationToken.delete(token);
      throw badRequest('Reset token has expired');
    }
    
    // Get user
    const user = await db.user.findById(resetToken.userId);
    if (!user) {
      throw badRequest('User not found');
    }
    
    // Update password using the proper method
    await db.user.updatePassword(user.id, password);
    
    // Delete the reset token
    await db.verificationToken.delete(token);
    
    // Delete all refresh tokens (force re-login)
    await db.refreshToken.deleteByUserId(user.id);
    
    // Send notification
    sendNotificationToUser(user.id, {
      id: Date.now().toString(),
      type: 'warning',
      title: 'Password Changed',
      message: 'Your password has been changed. Please login with your new password.',
      createdAt: new Date(),
    });
    
    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await db.user.findByEmail(email);
    if (!user) {
      throw unauthorized('Invalid credentials');
    }
    
    // Validate password
    const isValidPassword = await db.user.validatePassword(user, password);
    if (!isValidPassword) {
      throw unauthorized('Invalid credentials');
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken();
    
    // Save refresh token
    await db.refreshToken.create(user.id, refreshToken, 7);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid or expired refresh token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw unauthorized('Refresh token is required');
    }
    
    // Find refresh token
    const storedToken = await db.refreshToken.findByToken(refreshToken);
    
    if (!storedToken) {
      throw unauthorized('Invalid refresh token');
    }
    
    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await db.refreshToken.delete(refreshToken);
      throw unauthorized('Refresh token expired');
    }
    
    // Get user
    const user = await db.user.findById(storedToken.userId);
    if (!user) {
      throw unauthorized('User not found');
    }
    
    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    
    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (revoke refresh token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await db.refreshToken.delete(refreshToken);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw unauthorized('Unauthorized');
    }
    
    const user = await db.user.findById(req.user.id);
    if (!user) {
      throw unauthorized('User not found');
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw unauthorized('Unauthorized');
    }
    
    const { username, email } = req.body;
    
    // Check if email is taken by another user
    if (email) {
      const existingUser = await db.user.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        throw badRequest('Email is already taken');
      }
    }
    
    const updatedUser = await db.user.update(req.user.id, { username, email });
    
    if (!updatedUser) {
      throw new AppError('Failed to update user', 500);
    }
    
    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw unauthorized('Unauthorized');
    }
    
    // Delete all refresh tokens for this user
    await db.refreshToken.deleteByUserId(req.user.id);
    
    // Delete user
    await db.user.delete(req.user.id);
    
    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
