/**
 * Auth Controller
 * Handles authentication endpoints with refresh token support
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../models/db';
import { AppError, badRequest, unauthorized } from '../middleware/error.middleware';

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
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Validation error or email already registered
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
    
    // Generate tokens
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
      },
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
