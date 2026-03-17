/**
 * Activity Controller
 * Handles activity feed and trending posts
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { forbidden } from '../middleware/error.middleware';
import { getPagination } from '../utils/helpers';

/**
 * @swagger
 * /api/activity/feed:
 *   get:
 *     summary: Get activity feed (posts from followed users, likes, comments)
 *     tags: [Activity]
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Activity feed
 *       401:
 *         description: Unauthorized
 */
export const getActivityFeed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const { offset } = getPagination(page, limit);

    const { activities, total } = await db.activity.getFeed(req.user.id, { limit, offset });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: activities,
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
 * /api/activity/trending:
 *   get:
 *     summary: Get trending posts
 *     tags: [Activity]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *     responses:
 *       200:
 *         description: Trending posts
 */
export const getTrendingPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const timeframe = (req.query.timeframe as string) || 'week';

    const posts = await db.activity.getTrending(limit, timeframe);

    res.json({
      success: true,
      data: posts,
      meta: {
        timeframe,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/activity/recent:
 *   get:
 *     summary: Get recent activity for current user
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recent activity
 *       401:
 *         description: Unauthorized
 */
export const getRecentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const activities = await db.activity.getRecent(req.user.id, limit);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};
