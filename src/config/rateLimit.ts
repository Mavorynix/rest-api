/**
 * Rate Limiting Configuration
 * Prevents brute force attacks on sensitive endpoints
 */

import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Login specific rate limiter
export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  message: {
    success: false,
    error: 'Too many login attempts, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
