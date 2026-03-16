/**
 * CORS Configuration
 * Configures Cross-Origin Resource Sharing
 */

import { CorsOptions } from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://yourdomain.com',
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Development CORS (more permissive)
export const devCorsOptions: CorsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
};
