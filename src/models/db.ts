/**
 * In-memory database for testing and development
 * Includes User, Post, and RefreshToken models
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
  createdAt: Date;
  updatedAt: Date;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
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

// In-memory storage
const users: Map<string, User> = new Map();
const posts: Map<string, Post> = new Map();
const refreshTokens: Map<string, RefreshToken> = new Map();
const userEmailIndex: Map<string, string> = new Map();
const userTokenIndex: Map<string, string> = new Map(); // token -> tokenId

// Reset database (for testing)
export const resetDb = () => {
  users.clear();
  posts.clear();
  refreshTokens.clear();
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
    
    update: async (id: string, data: Partial<Pick<User, 'username' | 'email' | 'role'>>): Promise<Omit<User, 'password'> | null> => {
      const user = users.get(id);
      if (!user) return null;
      
      if (data.email && data.email !== user.email) {
        userEmailIndex.delete(user.email);
        userEmailIndex.set(data.email.toLowerCase(), id);
        user.email = data.email.toLowerCase();
      }
      
      if (data.username) user.username = data.username;
      if (data.role) user.role = data.role;
      
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
    create: async (data: { title: string; content: string; authorId: string }): Promise<Post> => {
      const id = uuidv4();
      const now = new Date();
      
      const post: Post = {
        id,
        title: data.title,
        content: data.content,
        authorId: data.authorId,
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
    
    update: async (id: string, data: Partial<Pick<Post, 'title' | 'content'>>): Promise<Post | null> => {
      const post = posts.get(id);
      if (!post) return null;
      
      if (data.title) post.title = data.title;
      if (data.content) post.content = data.content;
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
};

export type { User, Post, RefreshToken };
