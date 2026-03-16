/**
 * Upload Controller
 * Handles file upload endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { uploadAvatar, uploadPostImage, getFileUrl, deleteFile } from '../config/upload';
import { badRequest, unauthorized } from '../middleware/error.middleware';
import { sendNotificationToUser } from '../config/socket';

// Extend Request type for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * @swagger
 * /api/upload/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image (JPEG, PNG, GIF, WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
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
 *                     avatar:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 */
export const uploadAvatarHandler = [
  uploadAvatar.single('avatar'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw unauthorized('Unauthorized');
      }

      const file = (req as MulterRequest).file;
      if (!file) {
        throw badRequest('No file uploaded');
      }

      // Get current user to check if they have an existing avatar
      const user = await db.user.findById(req.user.id);
      if (user?.avatar) {
        // Delete old avatar
        const oldFilename = user.avatar.split('/').pop();
        if (oldFilename) {
          deleteFile(oldFilename, 'avatar');
        }
      }

      // Save avatar URL to user
      const avatarUrl = getFileUrl(file.filename, 'avatar');
      await db.user.update(req.user.id, { avatar: avatarUrl });

      // Send notification
      sendNotificationToUser(req.user.id, {
        id: Date.now().toString(),
        type: 'success',
        title: 'Avatar Updated',
        message: 'Your profile picture has been updated successfully!',
        createdAt: new Date(),
      });

      res.json({
        success: true,
        data: {
          avatar: file.filename,
          avatarUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  },
];

/**
 * @swagger
 * /api/upload/post-image:
 *   post:
 *     summary: Upload post image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Post image (JPEG, PNG, GIF, WebP, max 10MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
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
 *                     filename:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 */
export const uploadPostImageHandler = [
  uploadPostImage.single('image'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw unauthorized('Unauthorized');
      }

      const file = (req as MulterRequest).file;
      if (!file) {
        throw badRequest('No file uploaded');
      }

      const imageUrl = getFileUrl(file.filename, 'post');

      res.json({
        success: true,
        data: {
          filename: file.filename,
          imageUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  },
];

/**
 * @swagger
 * /api/upload/avatar:
 *   delete:
 *     summary: Delete user avatar
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       401:
 *         description: Unauthorized
 */
export const deleteAvatarHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw unauthorized('Unauthorized');
    }

    const user = await db.user.findById(req.user.id);
    if (user?.avatar) {
      const filename = user.avatar.split('/').pop();
      if (filename) {
        deleteFile(filename, 'avatar');
      }
      await db.user.update(req.user.id, { avatar: undefined });
    }

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
