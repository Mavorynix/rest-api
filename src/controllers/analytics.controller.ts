/**
 * Analytics Controller
 * Admin analytics endpoints for dashboard stats
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { forbidden } from '../middleware/error.middleware';
import { getPagination } from '../utils/helpers';

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get dashboard overview stats (admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }

    if (req.user.role !== 'admin') {
      throw forbidden('Only admins can access analytics');
    }

    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalLikes,
      verifiedUsers,
      recentUsers,
      recentPosts,
    ] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.comment.count(),
      db.like.count(),
      db.user.countVerified(),
      db.user.countRecent(7), // Last 7 days
      db.post.countRecent(7), // Last 7 days
    ]);

    // Calculate engagement rate
    const engagementRate = totalUsers > 0 
      ? ((totalPosts + totalComments + totalLikes) / totalUsers).toFixed(2)
      : '0';

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          recent: recentUsers,
          verificationRate: totalUsers > 0 
            ? ((verifiedUsers / totalUsers) * 100).toFixed(1) + '%'
            : '0%',
        },
        posts: {
          total: totalPosts,
          recent: recentPosts,
        },
        comments: {
          total: totalComments,
        },
        likes: {
          total: totalLikes,
        },
        engagement: {
          rate: engagementRate,
          averagePerUser: {
            posts: totalUsers > 0 ? (totalPosts / totalUsers).toFixed(2) : '0',
            comments: totalUsers > 0 ? (totalComments / totalUsers).toFixed(2) : '0',
            likes: totalUsers > 0 ? (totalLikes / totalUsers).toFixed(2) : '0',
          },
        },
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/analytics/posts:
 *   get:
 *     summary: Get post analytics (admin only)
 *     tags: [Analytics]
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [likes, comments, recent]
 *           default: recent
 *     responses:
 *       200:
 *         description: Post analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
export const getPostAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }

    if (req.user.role !== 'admin') {
      throw forbidden('Only admins can access analytics');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const sortBy = (req.query.sortBy as string) || 'recent';
    const { offset } = getPagination(page, limit);

    const { posts, total } = await db.post.findManyWithStats({ limit, offset, sortBy });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      meta: {
        sortBy,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/analytics/users:
 *   get:
 *     summary: Get user analytics (admin only)
 *     tags: [Analytics]
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [posts, recent, active]
 *           default: recent
 *     responses:
 *       200:
 *         description: User analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
export const getUserAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }

    if (req.user.role !== 'admin') {
      throw forbidden('Only admins can access analytics');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const sortBy = (req.query.sortBy as string) || 'recent';
    const { offset } = getPagination(page, limit);

    const { users, total } = await db.user.findManyWithStats({ limit, offset, sortBy });
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
      meta: {
        sortBy,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/analytics/tags:
 *   get:
 *     summary: Get tag analytics (admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tag analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
export const getTagAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }

    if (req.user.role !== 'admin') {
      throw forbidden('Only admins can access analytics');
    }

    const tags = await db.tag.findPopular(20);

    res.json({
      success: true,
      data: tags,
      meta: {
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};
