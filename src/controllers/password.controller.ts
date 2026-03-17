/**
 * Password Controller
 * Handles password change endpoint
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { unauthorized, badRequest } from '../middleware/error.middleware';
import { sendNotificationToUser } from '../config/socket';

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change password (requires current password)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 minLength: 6
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 *       401:
 *         description: Unauthorized
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw unauthorized('Unauthorized');
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      throw badRequest('Current password and new password are required');
    }

    if (currentPassword === newPassword) {
      throw badRequest('New password must be different from current password');
    }

    // Get user with password
    const user = await db.user.findById(req.user.id);
    if (!user) {
      throw unauthorized('User not found');
    }

    // Validate current password
    const isValidPassword = await db.user.validatePassword(user, currentPassword);
    if (!isValidPassword) {
      throw badRequest('Current password is incorrect');
    }

    // Update password
    await db.user.updatePassword(req.user.id, newPassword);

    // Delete all refresh tokens (force re-login on other devices)
    await db.refreshToken.deleteByUserId(req.user.id);

    // Send notification
    sendNotificationToUser(req.user.id, {
      id: Date.now().toString(),
      type: 'warning',
      title: 'Password Changed',
      message: 'Your password has been changed successfully. Please login again.',
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
