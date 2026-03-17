/**
 * Comment Controller
 * Handles comment CRUD endpoints with nested comments support
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { notFound, forbidden } from '../middleware/error.middleware';
import { getPagination } from '../utils/helpers';
import { sendNotificationToUser } from '../config/socket';

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Get replies to a specific comment
 *     responses:
 *       200:
 *         description: List of comments
 */
export const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const postId = req.params.postId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const parentId = req.query.parentId as string | undefined;
    
    const { offset } = getPagination(page, limit);
    
    const { comments, total } = await db.comment.findMany({
      postId,
      limit,
      offset,
      parentId: parentId || null, // Top-level comments only by default
      sort: 'createdAt',
      order: 'asc',
    });
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: comments,
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
 * /api/comments/{id}:
 *   get:
 *     summary: Get a single comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment data
 */
export const getComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const comment = await db.comment.findById(id);
    
    if (!comment) {
      throw notFound('Comment');
    }
    
    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Create a comment on a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 description: Parent comment ID for replies
 *     responses:
 *       201:
 *         description: Comment created successfully
 */
export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const postId = req.params.postId as string;
    const { content, parentId } = req.body;
    
    // Check if post exists
    const post = await db.post.findById(postId);
    if (!post) {
      throw notFound('Post');
    }
    
    // If replying to a comment, check if parent exists
    if (parentId) {
      const parentComment = await db.comment.findById(parentId);
      if (!parentComment) {
        throw notFound('Parent comment');
      }
    }
    
    const comment = await db.comment.create({
      content,
      postId,
      userId: req.user.id,
      parentId,
    });
    
    // Send notification to post author (if not self)
    if (post.authorId !== req.user.id) {
      const notification = await db.notification.create({
        userId: post.authorId,
        type: 'comment',
        title: 'New Comment',
        message: `${req.user.username} commented on your post "${post.title}"`,
        data: { postId, commentId: comment.id },
      });
      
      sendNotificationToUser(post.authorId, notification);
    }
    
    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment (owner only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 */
export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const id = req.params.id as string;
    const { content } = req.body;
    
    const comment = await db.comment.findById(id);
    
    if (!comment) {
      throw notFound('Comment');
    }
    
    // Check ownership (admin can update any comment)
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      throw forbidden('Unauthorized to update this comment');
    }
    
    const updatedComment = await db.comment.update(id, { content });
    
    res.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment (owner or admin only)
 *     tags: [Comments]
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
 *         description: Comment deleted successfully
 */
export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const id = req.params.id as string;
    
    const comment = await db.comment.findById(id);
    
    if (!comment) {
      throw notFound('Comment');
    }
    
    // Check ownership (admin can delete any comment)
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      throw forbidden('Unauthorized to delete this comment');
    }
    
    await db.comment.delete(id);
    
    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{id}/replies:
 *   get:
 *     summary: Get replies to a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of replies
 */
export const getReplies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    
    const { offset } = getPagination(page, limit);
    
    const { comments: replies, total } = await db.comment.findMany({
      parentId: id,
      limit,
      offset,
      sort: 'createdAt',
      order: 'asc',
    });
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: replies,
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
