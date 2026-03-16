/**
 * CORS Configuration
 * Configures Cross-Origin Resource Sharing securely
 */

import { CorsOptions } from 'cors';

// Production allowed origins - configure these for your production environment
const productionOrigins = [
  'https://yourdomain.com',
  'https://api.yourdomain.com',
  // Add your production domains here
];

// Development allowed origins
const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Production CORS options - strict origin validation
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    if (productionOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

/**
 * Development CORS options - validates origins but allows development origins
 */
export const devCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isAllowed = developmentOrigins.includes(origin) || isLocalhost;
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin in dev: ${origin}`);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

/**
 * Get appropriate CORS options based on environment
 */
export const getCorsOptions = (): CorsOptions => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (process.env.CORS_ORIGINS) {
    const envOrigins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
    return {
      origin: (origin, callback) => {
        if (!origin || envOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS policy'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      credentials: true,
      maxAge: 86400,
    };
  }
  
  return isDevelopment ? devCorsOptions : corsOptions;
};
