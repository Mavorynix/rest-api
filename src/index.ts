/**
 * REST API Server
 * Entry point for the application
 * Includes WebSocket support for real-time notifications
 */

import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app';
import { initSocketIO, getIO } from './config/socket';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
initSocketIO(server);

server.listen(PORT, () => {
  console.log('🚀 REST API Server is running!');
  console.log(`   📍 Local:   http://localhost:${PORT}`);
  console.log(`   📖 Docs:    http://localhost:${PORT}/api-docs`);
  console.log(`   🔌 Socket:  ws://localhost:${PORT}`);
  console.log('');
  console.log('✨ Features:');
  console.log('   ✅ JWT Authentication with Refresh Tokens');
  console.log('   ✅ Email Verification');
  console.log('   ✅ File Upload (Avatars & Post Images)');
  console.log('   ✅ Real-time Notifications (WebSocket)');
  console.log('   ✅ Role-Based Access Control');
  console.log('   ✅ Rate Limiting');
  console.log('   ✅ Swagger Documentation');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    const io = getIO();
    if (io) {
      io.close(() => {
        console.log('Socket.IO closed');
      });
    }
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    const io = getIO();
    if (io) {
      io.close(() => {
        console.log('Socket.IO closed');
      });
    }
    console.log('Server closed');
    process.exit(0);
  });
});
