/**
 * In-memory database for testing and development
 * Includes User, Post, RefreshToken, VerificationToken, and Notification models
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Types
export type UserRole = 'admin' | 'user';

interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  avatar?: string; // File upload support
  isVerified: boolean; // Email verification
  createdAt: Date;
  updatedAt: Date;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  image?: string; // File upload support
  createdAt: Date;
  updatedAt: Date;
}

interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

interface VerificationToken {
  id: string;
  token: string;
  userId: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  createdAt: Date;
}

interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// In-memory storage
const users: Map<string, User> = new Map();
const posts: Map<string, Post> = new Map();
const refreshTokens: Map<string, RefreshToken> = new Map();
const verificationTokens: Map<string, VerificationToken> = new Map();
const notifications: Map<string, Notification> = new Map();
const userEmailIndex: Map<string, string> = new Map();
const userTokenIndex: Map<string, string> = new Map(); // token -> tokenId

// Reset database (for testing)
export const resetDb = () => {
  users.clear();
  posts.clear();
  refreshTokens.clear();
  verificationTokens.clear();
  notifications.clear();
  userEmailIndex.clear();
  userTokenIndex.clear();
};

// Database operations
export const db = {
  // User methods
  user: {
    create: async (data: { email: string; username: string; password: string; role?: UserRole }): Promise<Omit<User, 'password'>> => {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const id = uuidv4();
      const now = new Date();
      
      const user: User = {
        id,
        email: data.email.toLowerCase(),
        username: data.username,
        password: hashedPassword,
        role: data.role || 'user',
        isVerified: false, // Email not verified by default
        createdAt: now,
        updatedAt: now,
      };
      
      users.set(id, user);
      userEmailIndex.set(user.email, id);
      
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },
    
    findByEmail: async (email: string): Promise<User | null> => {
      const userId = userEmailIndex.get(email.toLowerCase());
      if (!userId) return null;
      return users.get(userId) || null;
    },
    
    findById: async (id: string): Promise<User | null> => {
      return users.get(id) || null;
    },
    
    findMany: async (options?: { 
      limit?: number; 
      offset?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      role?: UserRole;
    }): Promise<{ users: Omit<User, 'password'>[]; total: number }> => {
      let allUsers = Array.from(users.values());
      
      // Filter by role
      if (options?.role) {
        allUsers = allUsers.filter(u => u.role === options.role);
      }
      
      // Sorting
      const sortField = options?.sort || 'createdAt';
      const sortOrder = options?.order || 'desc';
      allUsers.sort((a, b) => {
        const aVal = a[sortField as keyof User];
        const bVal = b[sortField as keyof User];
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
      
      const total = allUsers.length;
      
      // Pagination
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options?.offset || 0;
        const limit = options?.limit || allUsers.length;
        allUsers = allUsers.slice(offset, offset + limit);
      }
      
      const usersWithoutPassword = allUsers.map(({ password: _, ...user }) => user);
      return { users: usersWithoutPassword, total };
    },
    
    update: async (id: string, data: Partial<Pick<User, 'username' | 'email' | 'role' | 'avatar' | 'isVerified'>>): Promise<Omit<User, 'password'> | null> => {
      const user = users.get(id);
      if (!user) return null;
      
      if (data.email && data.email !== user.email) {
        userEmailIndex.delete(user.email);
        userEmailIndex.set(data.email.toLowerCase(), id);
        user.email = data.email.toLowerCase();
      }
      
      if (data.username) user.username = data.username;
      if (data.role) user.role = data.role;
      if (data.avatar !== undefined) user.avatar = data.avatar;
      if (data.isVerified !== undefined) user.isVerified = data.isVerified;
      
      user.updatedAt = new Date();
      users.set(id, user);
      
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },
    
    delete: async (id: string): Promise<boolean> => {
      const user = users.get(id);
      if (!user) return false;
      
      userEmailIndex.delete(user.email);
      return users.delete(id);
    },
    
    validatePassword: async (user: User, password: string): Promise<boolean> => {
      return bcrypt.compare(password, user.password);
    },
    
    count: async (): Promise<number> => {
      return users.size;
    },
  },
  
  // Post methods
  post: {
    create: async (data: { title: string; content: string; authorId: string; image?: string }): Promise<Post> => {
      const id = uuidv4();
      const now = new Date();
      
      const post: Post = {
        id,
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        image: data.image,
        createdAt: now,
        updatedAt: now,
      };
      
      posts.set(id, post);
      return post;
    },
    
    findMany: async (options?: { 
      limit?: number; 
      offset?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      authorId?: string;
    }): Promise<{ posts: Post[]; total: number }> => {
      let allPosts = Array.from(posts.values());
      
      // Filter by author
      if (options?.authorId) {
        allPosts = allPosts.filter(p => p.authorId === options.authorId);
      }
      
      // Sorting
      const sortField = options?.sort || 'createdAt';
      const sortOrder = options?.order || 'desc';
      allPosts.sort((a, b) => {
        const aVal = a[sortField as keyof Post];
        const bVal = b[sortField as keyof Post];
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
      
      const total = allPosts.length;
      
      // Pagination
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options?.offset || 0;
        const limit = options?.limit || allPosts.length;
        allPosts = allPosts.slice(offset, offset + limit);
      }
      
      return { posts: allPosts, total };
    },
    
    findById: async (id: string): Promise<Post | null> => {
      return posts.get(id) || null;
    },
    
    findByAuthor: async (authorId: string): Promise<Post[]> => {
      return Array.from(posts.values())
        .filter(post => post.authorId === authorId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    
    update: async (id: string, data: Partial<Pick<Post, 'title' | 'content' | 'image'>>): Promise<Post | null> => {
      const post = posts.get(id);
      if (!post) return null;
      
      if (data.title) post.title = data.title;
      if (data.content) post.content = data.content;
      if (data.image !== undefined) post.image = data.image;
      post.updatedAt = new Date();
      
      posts.set(id, post);
      return post;
    },
    
    delete: async (id: string): Promise<boolean> => {
      return posts.delete(id);
    },
    
    count: async (): Promise<number> => {
      return posts.size;
    },
  },
  
  // Refresh Token methods
  refreshToken: {
    create: async (userId: string, token: string, expiresDays: number = 7): Promise<RefreshToken> => {
      const id = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expiresDays * 24 * 60 * 60 * 1000);
      
      const refreshToken: RefreshToken = {
        id,
        token,
        userId,
        expiresAt,
        createdAt: now,
      };
      
      refreshTokens.set(id, refreshToken);
      userTokenIndex.set(token, id);
      
      return refreshToken;
    },
    
    findByToken: async (token: string): Promise<RefreshToken | null> => {
      const tokenId = userTokenIndex.get(token);
      if (!tokenId) return null;
      return refreshTokens.get(tokenId) || null;
    },
    
    findByUserId: async (userId: string): Promise<RefreshToken[]> => {
      return Array.from(refreshTokens.values())
        .filter(rt => rt.userId === userId && rt.expiresAt > new Date());
    },
    
    delete: async (token: string): Promise<boolean> => {
      const tokenId = userTokenIndex.get(token);
      if (!tokenId) return false;
      
      userTokenIndex.delete(token);
      return refreshTokens.delete(tokenId);
    },
    
    deleteByUserId: async (userId: string): Promise<number> => {
      let count = 0;
      for (const [id, rt] of refreshTokens.entries()) {
        if (rt.userId === userId) {
          refreshTokens.delete(id);
          userTokenIndex.delete(rt.token);
          count++;
        }
      }
      return count;
    },
    
    deleteExpired: async (): Promise<number> => {
      const now = new Date();
      let count = 0;
      for (const [id, rt] of refreshTokens.entries()) {
        if (rt.expiresAt < now) {
          refreshTokens.delete(id);
          userTokenIndex.delete(rt.token);
          count++;
        }
      }
      return count;
    },
  },
  
  // Verification Token methods (for email verification and password reset)
  verificationToken: {
    create: async (userId: string, type: 'email_verification' | 'password_reset', expiresHours: number = 24): Promise<string> => {
      const id = uuidv4();
      const token = uuidv4(); // Verification token
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expiresHours * 60 * 60 * 1000);
      
      const verificationToken: VerificationToken = {
        id,
        token,
        userId,
        type,
        expiresAt,
        createdAt: now,
      };
      
      verificationTokens.set(id, verificationToken);
      return token;
    },
    
    findByToken: async (token: string): Promise<VerificationToken | null> => {
      for (const vt of verificationTokens.values()) {
        if (vt.token === token) return vt;
      }
      return null;
    },
    
    delete: async (token: string): Promise<boolean> => {
      for (const [id, vt] of verificationTokens.entries()) {
        if (vt.token === token) {
          return verificationTokens.delete(id);
        }
      }
      return false;
    },
    
    deleteByUserId: async (userId: string, type?: 'email_verification' | 'password_reset'): Promise<number> => {
      let count = 0;
      for (const [id, vt] of verificationTokens.entries()) {
        if (vt.userId === userId && (!type || vt.type === type)) {
          verificationTokens.delete(id);
          count++;
        }
      }
      return count;
    },
  },
  
  // Notification methods (for WebSocket)
  notification: {
    create: async (data: { userId: string; type: 'info' | 'warning' | 'success' | 'error'; title: string; message: string }): Promise<Notification> => {
      const id = uuidv4();
      const now = new Date();
      
      const notification: Notification = {
        id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
        createdAt: now,
      };
      
      notifications.set(id, notification);
      return notification;
    },
    
    findByUserId: async (userId: string, options?: { limit?: number; unreadOnly?: boolean }): Promise<Notification[]> => {
      let userNotifications = Array.from(notifications.values())
        .filter(n => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      if (options?.unreadOnly) {
        userNotifications = userNotifications.filter(n => !n.isRead);
      }
      
      if (options?.limit) {
        userNotifications = userNotifications.slice(0, options.limit);
      }
      
      return userNotifications;
    },
    
    markAsRead: async (id: string): Promise<boolean> => {
      const notification = notifications.get(id);
      if (!notification) return false;
      
      notification.isRead = true;
      notifications.set(id, notification);
      return true;
    },
    
    markAllAsRead: async (userId: string): Promise<number> => {
      let count = 0;
      for (const [id, n] of notifications.entries()) {
        if (n.userId === userId && !n.isRead) {
          n.isRead = true;
          notifications.set(id, n);
          count++;
        }
      }
      return count;
    },
    
    delete: async (id: string): Promise<boolean> => {
      return notifications.delete(id);
    },
    
    countUnread: async (userId: string): Promise<number> => {
      return Array.from(notifications.values())
        .filter(n => n.userId === userId && !n.isRead).length;
    },
  },
};

export type { User, Post, RefreshToken, VerificationToken, Notification };
