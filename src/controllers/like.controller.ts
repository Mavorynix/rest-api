/**
 * Like Controller
 * Handles like/unlike endpoints for posts and comments
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { notFound, forbidden } from '../middleware/error.middleware';
import { sendNotificationToUser } from '../config/socket';

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post liked successfully
 *       400:
 *         description: Already liked
 */
export const likePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const { postId } = req.params;
    
    // Check if post exists
    const post = await db.post.findById(postId);
    if (!post) {
      throw notFound('Post');
    }
    
    const like = await db.like.create({
      userId: req.user.id,
      targetType: 'post',
      targetId: postId,
    });
    
    if (!like) {
      res.status(400).json({
        success: false,
        error: 'You have already liked this post',
      });
      return;
    }
    
    // Send notification to post author (if not self)
    if (post.authorId !== req.user.id) {
      const notification = await db.notification.create({
        userId: post.authorId,
        type: 'like',
        title: 'New Like',
        message: `${req.user.username} liked your post "${post.title}"`,
        data: { postId },
      });
      
      sendNotificationToUser(post.authorId, notification);
    }
    
    res.json({
      success: true,
      message: 'Post liked successfully',
      data: { likesCount: post.likesCount + 1 },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post unliked successfully
 */
export const unlikePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const { postId } = req.params;
    
    // Check if post exists
    const post = await db.post.findById(postId);
    if (!post) {
      throw notFound('Post');
    }
    
    const removed = await db.like.delete(req.user.id, 'post', postId);
    
    if (!removed) {
      res.status(400).json({
        success: false,
        error: 'You have not liked this post',
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Post unliked successfully',
      data: { likesCount: Math.max(0, post.likesCount - 1) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/{postId}/likes:
 *   get:
 *     summary: Get users who liked a post
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users who liked the post
 */
export const getPostLikes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { postId } = req.params;
    
    // Check if post exists
    const post = await db.post.findById(postId);
    if (!post) {
      throw notFound('Post');
    }
    
    const likes = await db.like.findByTarget('post', postId);
    
    // Get user details for each like
    const users = await Promise.all(
      likes.map(async (like) => {
        const user = await db.user.findById(like.userId);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return {
            ...userWithoutPassword,
            likedAt: like.createdAt,
          };
        }
        return null;
      })
    );
    
    const validUsers = users.filter(Boolean);
    
    res.json({
      success: true,
      data: validUsers,
      total: validUsers.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{commentId}/like:
 *   post:
 *     summary: Like a comment
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment liked successfully
 */
export const likeComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const { commentId } = req.params;
    
    // Check if comment exists
    const comment = await db.comment.findById(commentId);
    if (!comment) {
      throw notFound('Comment');
    }
    
    const like = await db.like.create({
      userId: req.user.id,
      targetType: 'comment',
      targetId: commentId,
    });
    
    if (!like) {
      res.status(400).json({
        success: false,
        error: 'You have already liked this comment',
      });
      return;
    }
    
    // Send notification to comment author (if not self)
    if (comment.userId !== req.user.id) {
      const notification = await db.notification.create({
        userId: comment.userId,
        type: 'like',
        title: 'New Like',
        message: `${req.user.username} liked your comment`,
        data: { commentId },
      });
      
      sendNotificationToUser(comment.userId, notification);
    }
    
    res.json({
      success: true,
      message: 'Comment liked successfully',
      data: { likesCount: comment.likesCount + 1 },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{commentId}/like:
 *   delete:
 *     summary: Unlike a comment
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment unliked successfully
 */
export const unlikeComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const { commentId } = req.params;
    
    // Check if comment exists
    const comment = await db.comment.findById(commentId);
    if (!comment) {
      throw notFound('Comment');
    }
    
    const removed = await db.like.delete(req.user.id, 'comment', commentId);
    
    if (!removed) {
      res.status(400).json({
        success: false,
        error: 'You have not liked this comment',
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Comment unliked successfully',
      data: { likesCount: Math.max(0, comment.likesCount - 1) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/{postId}/like/status:
 *   get:
 *     summary: Check if current user has liked a post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like status
 */
export const getPostLikeStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;
    
    // Check if post exists
    const post = await db.post.findById(postId);
    if (!post) {
      throw notFound('Post');
    }
    
    let isLiked = false;
    if (userId) {
      const like = await db.like.findByUserAndTarget(userId, 'post', postId);
      isLiked = !!like;
    }
    
    res.json({
      success: true,
      data: {
        isLiked,
        likesCount: post.likesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
