/**
 * Notification Controller
 * Handles notification endpoints for WebSocket
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { unauthorized } from '../middleware/error.middleware';
import { sendNotificationToUser, broadcastNotification, NotificationPayload } from '../config/socket';

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: List of notifications
 */
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw unauthorized('Unauthorized');
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await db.notification.findByUserId(req.user.id, {
      limit,
      unreadOnly,
    });

    const unreadCount = await db.notification.countUnread(req.user.id);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw unauthorized('Unauthorized');
    }

    const id = req.params.id as string;

    const success = await db.notification.markAsRead(id);
    if (!success) {
      throw notFound('Notification not found');
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw unauthorized('Unauthorized');
    }

    const count = await db.notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 */
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw unauthorized('Unauthorized');
    }

    const id = req.params.id as string;

    const success = await db.notification.delete(id);
    if (!success) {
      throw notFound('Notification not found');
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: Send test notification (for testing)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [info, warning, success, error]
 *     responses:
 *       200:
 *         description: Test notification sent
 */
export const sendTestNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw unauthorized('Unauthorized');
    }

    const { title, message, type = 'info' } = req.body;

    // Create notification in database
    const notification = await db.notification.create({
      userId: req.user.id,
      type: type as 'info' | 'warning' | 'success' | 'error',
      title,
      message,
    });

    // Send real-time notification
    const payload: NotificationPayload = {
      id: notification.id,
      type: notification.type as 'info' | 'warning' | 'success' | 'error',
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
    };

    sendNotificationToUser(req.user.id, payload);

    res.json({
      success: true,
      message: 'Test notification sent',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function for not found error
const notFound = (message: string) => {
  const error = new Error(message);
  (error as any).statusCode = 404;
  return error;
};
