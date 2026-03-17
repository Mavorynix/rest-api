/**
 * Multer configuration for file uploads
 * Handles avatar and post image uploads
 * Includes security measures against path traversal attacks
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const avatarDir = path.join(uploadDir, 'avatars');
const postDir = path.join(uploadDir, 'posts');

[uploadDir, avatarDir, postDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// File filter for images only
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Sanitize filename - remove dangerous characters and validate extension
const sanitizeFilename = (filename: string): string => {
  // Get extension and validate
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file extension');
  }
  
  // Remove any path separators and dangerous characters
  const baseName = path.basename(filename, ext)
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Only allow safe characters
    .substring(0, 100); // Limit length
  
  return `${baseName}${ext}`;
};

// Storage configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      
      // Validate extension
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('Invalid file extension'), '');
      }
      
      cb(null, `avatar-${uniqueSuffix}${ext}`);
    } catch (error) {
      cb(error as Error, '');
    }
  },
});

// Storage configuration for post images
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postDir);
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      
      // Validate extension
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('Invalid file extension'), '');
      }
      
      cb(null, `post-${uniqueSuffix}${ext}`);
    } catch (error) {
      cb(error as Error, '');
    }
  },
});

// Multer instance for avatar uploads
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: imageFilter as any,
});

// Multer instance for post image uploads
export const uploadPostImage = multer({
  storage: postStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: imageFilter as any,
});

// Validate that a path is within the allowed directory (prevents path traversal)
const isPathWithinAllowedDir = (filePath: string, allowedDir: string): boolean => {
  // Resolve both paths to absolute paths
  const resolvedPath = path.resolve(filePath);
  const resolvedAllowedDir = path.resolve(allowedDir);
  
  // Check if the resolved path starts with the allowed directory
  return resolvedPath.startsWith(resolvedAllowedDir + path.sep) || 
         resolvedPath === resolvedAllowedDir;
};

// Get file URL
export const getFileUrl = (filename: string, type: 'avatar' | 'post'): string => {
  // Sanitize the filename before using it
  const sanitized = sanitizeFilename(filename);
  return `/uploads/${type === 'avatar' ? 'avatars' : 'posts'}/${sanitized}`;
};

// Delete file - with security validation
export const deleteFile = (filename: string, type: 'avatar' | 'post'): boolean => {
  try {
    // Sanitize the filename first
    const sanitizedFilename = sanitizeFilename(filename);
    
    const dir = type === 'avatar' ? avatarDir : postDir;
    const filePath = path.join(dir, sanitizedFilename);
    
    // Security check: verify the path is within the allowed directory
    if (!isPathWithinAllowedDir(filePath, dir)) {
      console.error('Path traversal attempt detected:', filename);
      return false;
    }
    
    // Check if file exists and delete
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};
