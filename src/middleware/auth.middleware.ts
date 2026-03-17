/**
 * Authentication & Authorization Middleware
 * JWT token verification and Role-Based Access Control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, UserRole } from '../models/db';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Authenticate middleware - verifies JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided',
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: string;
      email: string;
    };
    
    // Verify user still exists
    const user = await db.user.findById(decoded.id);
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - User not found',
      });
      return;
    }
    
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid token',
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Token expired',
      });
      return;
    }
    
    next(error);
  }
};

/**
 * Optional auth middleware - extracts user if token present, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      next();
      return;
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        id: string;
        email: string;
      };
      
      const user = await db.user.findById(decoded.id);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        };
      }
    } catch {
      // Token invalid or expired, continue without user
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize middleware - checks user roles
 * @param roles - Allowed roles for the route
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Please login first',
      });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden - Insufficient permissions',
      });
      return;
    }
    
    next();
  };
};

/**
 * Owner or Admin middleware - allows access if user owns the resource or is admin
 * @param getResourceUserId - Function to extract resource owner ID from request
 */
export const ownerOrAdmin = (getResourceUserId: (req: Request) => Promise<string | null>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - Please login first',
        });
        return;
      }
      
      // Admin can access everything
      if (req.user.role === 'admin') {
        next();
        return;
      }
      
      // Check if user owns the resource
      const resourceUserId = await getResourceUserId(req);
      
      if (!resourceUserId || resourceUserId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden - You can only access your own resources',
        });
        return;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check ownership helper - for posts
 */
export const getPostOwnerId = async (req: Request): Promise<string | null> => {
  const postId = req.params.id;
  if (!postId) return null;
  
  const id = typeof postId === 'string' ? postId : (Array.isArray(postId) ? postId[0] : null);
  if (!id) return null;
  
  const post = await db.post.findById(id);
  return post?.authorId || null;
};

/**
 * Check ownership helper - for users
 */
export const getUserId = async (req: Request): Promise<string | null> => {
  const id = req.params.id;
  return typeof id === 'string' ? id : (Array.isArray(id) ? id[0] : null);
};
