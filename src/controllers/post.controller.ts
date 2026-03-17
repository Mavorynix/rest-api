/**
 * Post Controller
 * Handles post CRUD endpoints with pagination, sorting, filtering
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { AppError, notFound, forbidden } from '../middleware/error.middleware';
import { getPagination } from '../utils/helpers';

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts with pagination, sorting, and filtering
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Filter by author ID
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const sort = (req.query.sort as string) || 'createdAt';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';
    const authorId = req.query.authorId as string;
    
    const { offset } = getPagination(page, limit);
    
    const { posts, total } = await db.post.findMany({ 
      limit, 
      offset, 
      sort, 
      order,
      authorId 
    });
    
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
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post data
 *       404:
 *         description: Post not found
 */
export const getPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const post = await db.post.findById(id);
    
    if (!post) {
      throw notFound('Post');
    }
    
    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 maxLength: 10000
 *     responses:
 *       201:
 *         description: Post created successfully
 *       401:
 *         description: Unauthorized
 */
export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const { title, content, image } = req.body;
    
    const post = await db.post.create({
      title,
      content,
      authorId: req.user.id,
      image,
    });
    
    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post (owner or admin only)
 *     tags: [Posts]
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Forbidden - not post owner
 *       404:
 *         description: Post not found
 */
export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const id = req.params.id as string;
    const { title, content, image } = req.body;
    
    // Check if post exists
    const existingPost = await db.post.findById(id);
    
    if (!existingPost) {
      throw notFound('Post');
    }
    
    // Check ownership (admin can update any post)
    if (existingPost.authorId !== req.user.id && req.user.role !== 'admin') {
      throw forbidden('Unauthorized to update this post');
    }
    
    const updatedPost = await db.post.update(id, { title, content, image });
    
    res.json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post (owner or admin only)
 *     tags: [Posts]
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
 *         description: Post deleted successfully
 *       403:
 *         description: Forbidden - not post owner
 *       404:
 *         description: Post not found
 */
export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const id = req.params.id as string;
    
    // Check if post exists
    const existingPost = await db.post.findById(id);
    
    if (!existingPost) {
      throw notFound('Post');
    }
    
    // Check ownership (admin can delete any post)
    if (existingPost.authorId !== req.user.id && req.user.role !== 'admin') {
      throw forbidden('Unauthorized to delete this post');
    }
    
    await db.post.delete(id);
    
    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/user/me:
 *   get:
 *     summary: Get current user's posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's posts
 */
export const getMyPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }
    
    const posts = await db.post.findByAuthor(req.user.id);
    
    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};
