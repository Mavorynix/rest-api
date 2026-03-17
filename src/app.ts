/**
 * Express Application Setup
 * Main application with middleware and routes
 * Includes WebSocket support for real-time notifications
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import notificationRoutes from './routes/notification.routes';
import commentRoutes from './routes/comment.routes';
import likeRoutes from './routes/like.routes';
import { errorHandler } from './middleware/error.middleware';
import { swaggerSpec } from './config/swagger';
import { apiLimiter } from './config/rateLimit';
import { getCorsOptions } from './config/cors';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - uses environment-aware settings
app.use(cors(getCorsOptions()));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// Rate limiting
app.use('/api/', apiLimiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'REST API Documentation',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 REST API is running!',
    version: '4.0.0',
    documentation: '/api-docs',
    features: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      comments: '/api/posts/:postId/comments',
      likes: '/api/posts/:postId/like',
      upload: '/api/upload',
      notifications: '/api/notifications',
      websocket: '/socket.io',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts/:postId/comments', commentRoutes);
app.use('/api/posts/:postId/like', likeRoutes);
app.use('/api/posts/:postId/likes', likeRoutes);
app.use('/api/comments/:commentId/like', likeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error Handler
app.use(errorHandler);

export default app;
