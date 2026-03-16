/**
 * Multer configuration for file uploads
 * Handles avatar and post image uploads
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

// File filter for images only
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Storage configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

// Storage configuration for post images
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `post-${uniqueSuffix}${ext}`);
  },
});

// Multer instance for avatar uploads
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: imageFilter,
});

// Multer instance for post image uploads
export const uploadPostImage = multer({
  storage: postStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: imageFilter,
});

// Get file URL
export const getFileUrl = (filename: string, type: 'avatar' | 'post'): string => {
  return `/uploads/${type === 'avatar' ? 'avatars' : 'posts'}/${filename}`;
};

// Delete file
export const deleteFile = (filename: string, type: 'avatar' | 'post'): boolean => {
  try {
    const dir = type === 'avatar' ? avatarDir : postDir;
    const filePath = path.join(dir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};
