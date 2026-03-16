/**
 * Error Handling Middleware
 * Centralized error handling for the API
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message);
  
  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
    return;
  }
  
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
    });
    return;
  }
  
  // Custom error with status code
  if (err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }
  
  // Default server error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};

// Custom error class
export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

// Helper functions for common errors
export const notFound = (resource: string = 'Resource'): AppError => {
  return new AppError(`${resource} not found`, 404);
};

export const unauthorized = (message: string = 'Unauthorized'): AppError => {
  return new AppError(message, 401);
};

export const forbidden = (message: string = 'Forbidden'): AppError => {
  return new AppError(message, 403);
};

export const badRequest = (message: string): AppError => {
  return new AppError(message, 400);
};
