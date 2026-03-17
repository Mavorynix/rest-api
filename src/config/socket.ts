/**
 * WebSocket configuration using Socket.IO
 * Handles real-time notifications
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface UserSocket {
  userId: string;
  socketId: string;
}

// Store connected users
const connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

let io: Server | null = null;

// Initialize Socket.IO
export const initSocketIO = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/',
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string; email: string; role: string };
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as { id: string; email: string; role: string };
    console.log(`✅ User connected: ${user.email} (${socket.id})`);

    // Add socket to user's connections
    if (!connectedUsers.has(user.id)) {
      connectedUsers.set(user.id, new Set());
    }
    connectedUsers.get(user.id)!.add(socket.id);

    // Join user's personal room
    socket.join(`user:${user.id}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Successfully connected to notification server',
      userId: user.id,
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${user.email} (${socket.id})`);
      const userSockets = connectedUsers.get(user.id);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(user.id);
        }
      }
    });

    // Handle mark notification as read
    socket.on('mark_read', async (notificationId: string) => {
      // This will be handled by the notification service
      socket.emit('marked_read', { notificationId });
    });
  });

  return io;
};

// Get Socket.IO instance
export const getIO = (): Server | null => {
  return io;
};

// Check if user is online
export const isUserOnline = (userId: string): boolean => {
  const sockets = connectedUsers.get(userId);
  return sockets !== undefined && sockets.size > 0;
};

// Get online users count
export const getOnlineUsersCount = (): number => {
  return connectedUsers.size;
};

// Notification payload type
export interface NotificationPayload {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'comment' | 'like';
  title: string;
  message: string;
  createdAt: Date;
}

// Send notification to specific user
export const sendNotificationToUser = (userId: string, notification: NotificationPayload): void => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  console.log(`📤 Notification sent to user ${userId}: ${notification.title}`);
};

// Send notification to all users
export const broadcastNotification = (notification: NotificationPayload): void => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  io.emit('notification', notification);
  console.log(`📢 Notification broadcasted: ${notification.title}`);
};

// Send notification to users with specific role
export const sendNotificationToRole = (role: string, notification: NotificationPayload): void => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  // Iterate through connected users and send to those with matching role
  io.sockets.sockets.forEach((socket) => {
    const user = socket.data.user as { id: string; role: string } | undefined;
    if (user && user.role === role) {
      socket.emit('notification', notification);
    }
  });
  console.log(`📤 Notification sent to role ${role}: ${notification.title}`);
};
