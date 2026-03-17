/**
 * User Controller
 * Handles user management endpoints with RBAC
 */

import { Request, Response, NextFunction } from 'express';
import { db, UserRole } from '../models/db';
import { notFound, forbidden, badRequest } from '../middleware/error.middleware';
import { getPagination } from '../utils/helpers';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user]
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden - admin only
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const sort = (req.query.sort as string) || 'createdAt';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';
    const role = req.query.role as UserRole;
    
    const { offset } = getPagination(page, limit);
    
    const { users, total } = await db.user.findMany({ 
      limit, 
      offset, 
      sort, 
      order,
      role 
    });
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const user = await db.user.findById(id);
    
    if (!user) {
      throw notFound('User');
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
 * /api/users/{id}:
 *   put:
 *     summary: Update user (owner or admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 description: Admin only
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Forbidden
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const id = req.params.id as string;
    const { username, email, role } = req.body;
    
    // Check if user exists
    const existingUser = await db.user.findById(id);
    if (!existingUser) {
      throw notFound('User');
    }
    
    // Check permission (admin can update anyone, user can only update themselves)
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw forbidden('You can only update your own profile');
    }
    
    // Only admin can change role
    let updateData: { username?: string; email?: string; role?: UserRole } = { username, email };
    if (role && req.user.role === 'admin') {
      updateData.role = role;
    } else if (role && req.user.role !== 'admin') {
      throw forbidden('Only admins can change user roles');
    }
    
    // Check if email is taken
    if (email) {
      const userWithEmail = await db.user.findByEmail(email);
      if (userWithEmail && userWithEmail.id !== id) {
        throw badRequest('Email is already taken');
      }
    }
    
    const updatedUser = await db.user.update(id, updateData);
    
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
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (owner or admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const id = req.params.id as string;
    
    // Check if user exists
    const existingUser = await db.user.findById(id);
    if (!existingUser) {
      throw notFound('User');
    }
    
    // Check permission (admin can delete anyone, user can only delete themselves)
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw forbidden('You can only delete your own account');
    }
    
    // Delete refresh tokens
    await db.refreshToken.deleteByUserId(id);
    
    // Delete user
    await db.user.delete(id);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
