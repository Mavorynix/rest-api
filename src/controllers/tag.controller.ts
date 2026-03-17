/**
 * Tag Controller
 * Handles tag management and post-tag relationships
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { badRequest, notFound, forbidden } from '../middleware/error.middleware';
import { getPagination } from '../utils/helpers';

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Get all tags
 *     tags: [Tags]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tags
 */
export const getTags = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string;

    const { offset } = getPagination(page, limit);

    const { tags, total } = await db.tag.findMany({ limit, offset, search });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: tags,
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
 * /api/tags/{id}:
 *   get:
 *     summary: Get tag by ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tag data
 *       404:
 *         description: Tag not found
 */
export const getTag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const tag = await db.tag.findById(id);

    if (!tag) {
      throw notFound('Tag');
    }

    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: Create a new tag (admin only)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *               description:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       201:
 *         description: Tag created successfully
 *       400:
 *         description: Tag already exists
 *       403:
 *         description: Forbidden - Admin only
 */
export const createTag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }

    if (req.user.role !== 'admin') {
      throw forbidden('Only admins can create tags');
    }

    const { name, description } = req.body;

    // Check if tag already exists
    const existingTag = await db.tag.findByName(name);
    if (existingTag) {
      throw badRequest('Tag already exists');
    }

    const tag = await db.tag.create({ name, description });

    res.status(201).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: Update a tag (admin only)
 *     tags: [Tags]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tag updated successfully
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Tag not found
 */
export const updateTag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }

    if (req.user.role !== 'admin') {
      throw forbidden('Only admins can update tags');
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const tag = await db.tag.update(id, { name, description });

    if (!tag) {
      throw notFound('Tag');
    }

    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     summary: Delete a tag (admin only)
 *     tags: [Tags]
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
 *         description: Tag deleted successfully
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Tag not found
 */
export const deleteTag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw forbidden('Unauthorized');
    }

    if (req.user.role !== 'admin') {
      throw forbidden('Only admins can delete tags');
    }

    const { id } = req.params;

    const deleted = await db.tag.delete(id);

    if (!deleted) {
      throw notFound('Tag');
    }

    res.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/posts/tag/{tagName}:
 *   get:
 *     summary: Get posts by tag name
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: tagName
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
 *           default: 10
 *     responses:
 *       200:
 *         description: List of posts with the tag
 *       404:
 *         description: Tag not found
 */
export const getPostsByTag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tagName } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const { offset } = getPagination(page, limit);

    // Find tag by name
    const tag = await db.tag.findByName(tagName);
    if (!tag) {
      throw notFound('Tag');
    }

    const { posts, total } = await db.tag.getPosts(tag.id, { limit, offset });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: posts,
      tag,
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
