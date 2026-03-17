import { Router } from 'express';
import {
  getComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
  getReplies,
} from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management
 */

// Public routes
router.get('/', getComments);
router.get('/:id', getComment);
router.get('/:id/replies', getReplies);

// Protected routes
router.post('/', authenticate, createComment);
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);

export default router;
