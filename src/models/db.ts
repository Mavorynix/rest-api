/**
 * In-memory database for testing and development
 * Includes User, Post, Comment, Like, RefreshToken, VerificationToken, and Notification models
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
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  image?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Comment {
  id: string;
  content: string;
  postId: string;
  userId: string;
  parentId?: string; // For nested comments
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Like {
  id: string;
  userId: string;
  targetType: 'post' | 'comment';
  targetId: string;
  createdAt: Date;
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
  type: 'info' | 'warning' | 'success' | 'error' | 'like' | 'comment';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// In-memory storage
const users: Map<string, User> = new Map();
const posts: Map<string, Post> = new Map();
const comments: Map<string, Comment> = new Map();
const likes: Map<string, Like> = new Map();
const refreshTokens: Map<string, RefreshToken> = new Map();
const verificationTokens: Map<string, VerificationToken> = new Map();
const notifications: Map<string, Notification> = new Map();

// Indexes for faster lookups
const userEmailIndex: Map<string, string> = new Map();
const userTokenIndex: Map<string, string> = new Map();
const postLikesIndex: Map<string, Set<string>> = new Map(); // postId -> set of likeIds
const commentLikesIndex: Map<string, Set<string>> = new Map(); // commentId -> set of likeIds
const postCommentsIndex: Map<string, Set<string>> = new Map(); // postId -> set of commentIds

// Reset database (for testing)
export const resetDb = () => {
  users.clear();
  posts.clear();
  comments.clear();
  likes.clear();
  refreshTokens.clear();
  verificationTokens.clear();
  notifications.clear();
  userEmailIndex.clear();
  userTokenIndex.clear();
  postLikesIndex.clear();
  commentLikesIndex.clear();
  postCommentsIndex.clear();
};

// Database operations
export const db = {
  // User methods
  user: {
    create: async (data: { email: string; username: string; password: string; role?: UserRole; bio?: string }): Promise<Omit<User, 'password'>> => {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const id = uuidv4();
      const now = new Date();
      
      const user: User = {
        id,
        email: data.email.toLowerCase(),
        username: data.username,
        password: hashedPassword,
        role: data.role || 'user',
        bio: data.bio,
        isVerified: false,
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
    
    findByUsername: async (username: string): Promise<User | null> => {
      for (const user of users.values()) {
        if (user.username.toLowerCase() === username.toLowerCase()) {
          return user;
        }
      }
      return null;
    },
    
    findMany: async (options?: { 
      limit?: number; 
      offset?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      role?: UserRole;
      search?: string;
    }): Promise<{ users: Omit<User, 'password'>[]; total: number }> => {
      let allUsers = Array.from(users.values());
      
      // Filter by role
      if (options?.role) {
        allUsers = allUsers.filter(u => u.role === options.role);
      }
      
      // Search by username or email
      if (options?.search) {
        const searchLower = options.search.toLowerCase();
        allUsers = allUsers.filter(u => 
          u.username.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
        );
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
    
    update: async (id: string, data: Partial<Pick<User, 'username' | 'email' | 'role' | 'avatar' | 'isVerified' | 'bio'>>): Promise<Omit<User, 'password'> | null> => {
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
      if (data.bio !== undefined) user.bio = data.bio;
      
      user.updatedAt = new Date();
      users.set(id, user);
      
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },
    
    // FIX: Proper password update method
    updatePassword: async (id: string, newPassword: string): Promise<boolean> => {
      const user = users.get(id);
      if (!user) return false;
      
      user.password = await bcrypt.hash(newPassword, 10);
      user.updatedAt = new Date();
      users.set(id, user);
      
      return true;
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
        likesCount: 0,
        commentsCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      
      posts.set(id, post);
      postLikesIndex.set(id, new Set());
      postCommentsIndex.set(id, new Set());
      
      return post;
    },
    
    findMany: async (options?: { 
      limit?: number; 
      offset?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      authorId?: string;
      search?: string;
    }): Promise<{ posts: Post[]; total: number }> => {
      let allPosts = Array.from(posts.values());
      
      // Filter by author
      if (options?.authorId) {
        allPosts = allPosts.filter(p => p.authorId === options.authorId);
      }
      
      // Search by title or content
      if (options?.search) {
        const searchLower = options.search.toLowerCase();
        allPosts = allPosts.filter(p => 
          p.title.toLowerCase().includes(searchLower) ||
          p.content.toLowerCase().includes(searchLower)
        );
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
      // Delete all comments and likes for this post
      const commentIds = postCommentsIndex.get(id);
      if (commentIds) {
        for (const commentId of commentIds) {
          comments.delete(commentId);
          commentLikesIndex.delete(commentId);
        }
      }
      
      const likeIds = postLikesIndex.get(id);
      if (likeIds) {
        for (const likeId of likeIds) {
          likes.delete(likeId);
        }
      }
      
      postLikesIndex.delete(id);
      postCommentsIndex.delete(id);
      
      return posts.delete(id);
    },
    
    count: async (): Promise<number> => {
      return posts.size;
    },
    
    // Update counters
    incrementLikes: async (id: string): Promise<void> => {
      const post = posts.get(id);
      if (post) {
        post.likesCount++;
        posts.set(id, post);
      }
    },
    
    decrementLikes: async (id: string): Promise<void> => {
      const post = posts.get(id);
      if (post && post.likesCount > 0) {
        post.likesCount--;
        posts.set(id, post);
      }
    },
    
    incrementComments: async (id: string): Promise<void> => {
      const post = posts.get(id);
      if (post) {
        post.commentsCount++;
        posts.set(id, post);
      }
    },
    
    decrementComments: async (id: string): Promise<void> => {
      const post = posts.get(id);
      if (post && post.commentsCount > 0) {
        post.commentsCount--;
        posts.set(id, post);
      }
    },
  },
  
  // Comment methods
  comment: {
    create: async (data: { content: string; postId: string; userId: string; parentId?: string }): Promise<Comment> => {
      const id = uuidv4();
      const now = new Date();
      
      const comment: Comment = {
        id,
        content: data.content,
        postId: data.postId,
        userId: data.userId,
        parentId: data.parentId,
        likesCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      
      comments.set(id, comment);
      commentLikesIndex.set(id, new Set());
      
      // Add to post's comments
      const postComments = postCommentsIndex.get(data.postId);
      if (postComments) {
        postComments.add(id);
      }
      
      // Increment post's comment count
      await db.post.incrementComments(data.postId);
      
      return comment;
    },
    
    findMany: async (options?: { 
      limit?: number; 
      offset?: number;
      postId?: string;
      userId?: string;
      parentId?: string | null;
      sort?: string;
      order?: 'asc' | 'desc';
    }): Promise<{ comments: Comment[]; total: number }> => {
      let allComments = Array.from(comments.values());
      
      // Filter by post
      if (options?.postId) {
        allComments = allComments.filter(c => c.postId === options.postId);
      }
      
      // Filter by user
      if (options?.userId) {
        allComments = allComments.filter(c => c.userId === options.userId);
      }
      
      // Filter by parent (for nested comments)
      if (options?.parentId !== undefined) {
        if (options.parentId === null) {
          allComments = allComments.filter(c => !c.parentId);
        } else {
          allComments = allComments.filter(c => c.parentId === options.parentId);
        }
      }
      
      // Sorting
      const sortField = options?.sort || 'createdAt';
      const sortOrder = options?.order || 'asc'; // Oldest first for comments
      allComments.sort((a, b) => {
        const aVal = a[sortField as keyof Comment];
        const bVal = b[sortField as keyof Comment];
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
      
      const total = allComments.length;
      
      // Pagination
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options?.offset || 0;
        const limit = options?.limit || allComments.length;
        allComments = allComments.slice(offset, offset + limit);
      }
      
      return { comments: allComments, total };
    },
    
    findById: async (id: string): Promise<Comment | null> => {
      return comments.get(id) || null;
    },
    
    update: async (id: string, data: Partial<Pick<Comment, 'content'>>): Promise<Comment | null> => {
      const comment = comments.get(id);
      if (!comment) return null;
      
      if (data.content) comment.content = data.content;
      comment.updatedAt = new Date();
      
      comments.set(id, comment);
      return comment;
    },
    
    delete: async (id: string): Promise<boolean> => {
      const comment = comments.get(id);
      if (!comment) return false;
      
      // Delete all likes for this comment
      const likeIds = commentLikesIndex.get(id);
      if (likeIds) {
        for (const likeId of likeIds) {
          likes.delete(likeId);
        }
      }
      commentLikesIndex.delete(id);
      
      // Remove from post's comments
      const postComments = postCommentsIndex.get(comment.postId);
      if (postComments) {
        postComments.delete(id);
      }
      
      // Decrement post's comment count
      await db.post.decrementComments(comment.postId);
      
      // Delete nested replies
      for (const [cId, c] of comments.entries()) {
        if (c.parentId === id) {
          await db.comment.delete(cId);
        }
      }
      
      return comments.delete(id);
    },
    
    incrementLikes: async (id: string): Promise<void> => {
      const comment = comments.get(id);
      if (comment) {
        comment.likesCount++;
        comments.set(id, comment);
      }
    },
    
    decrementLikes: async (id: string): Promise<void> => {
      const comment = comments.get(id);
      if (comment && comment.likesCount > 0) {
        comment.likesCount--;
        comments.set(id, comment);
      }
    },
  },
  
  // Like methods
  like: {
    create: async (data: { userId: string; targetType: 'post' | 'comment'; targetId: string }): Promise<Like | null> => {
      // Check if already liked
      const existing = await db.like.findByUserAndTarget(data.userId, data.targetType, data.targetId);
      if (existing) return null;
      
      const id = uuidv4();
      const now = new Date();
      
      const like: Like = {
        id,
        userId: data.userId,
        targetType: data.targetType,
        targetId: data.targetId,
        createdAt: now,
      };
      
      likes.set(id, like);
      
      // Update indexes and counters
      if (data.targetType === 'post') {
        const postLikes = postLikesIndex.get(data.targetId);
        if (postLikes) {
          postLikes.add(id);
        }
        await db.post.incrementLikes(data.targetId);
      } else {
        const commentLikes = commentLikesIndex.get(data.targetId);
        if (commentLikes) {
          commentLikes.add(id);
        }
        await db.comment.incrementLikes(data.targetId);
      }
      
      return like;
    },
    
    findByUserAndTarget: async (userId: string, targetType: 'post' | 'comment', targetId: string): Promise<Like | null> => {
      for (const like of likes.values()) {
        if (like.userId === userId && like.targetType === targetType && like.targetId === targetId) {
          return like;
        }
      }
      return null;
    },
    
    findById: async (id: string): Promise<Like | null> => {
      return likes.get(id) || null;
    },
    
    delete: async (userId: string, targetType: 'post' | 'comment', targetId: string): Promise<boolean> => {
      const like = await db.like.findByUserAndTarget(userId, targetType, targetId);
      if (!like) return false;
      
      // Update indexes and counters
      if (targetType === 'post') {
        const postLikes = postLikesIndex.get(targetId);
        if (postLikes) {
          postLikes.delete(like.id);
        }
        await db.post.decrementLikes(targetId);
      } else {
        const commentLikes = commentLikesIndex.get(targetId);
        if (commentLikes) {
          commentLikes.delete(like.id);
        }
        await db.comment.decrementLikes(targetId);
      }
      
      return likes.delete(like.id);
    },
    
    findByTarget: async (targetType: 'post' | 'comment', targetId: string): Promise<Like[]> => {
      return Array.from(likes.values())
        .filter(l => l.targetType === targetType && l.targetId === targetId);
    },
    
    countByTarget: async (targetType: 'post' | 'comment', targetId: string): Promise<number> => {
      return Array.from(likes.values())
        .filter(l => l.targetType === targetType && l.targetId === targetId).length;
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
  
  // Verification Token methods
  verificationToken: {
    create: async (userId: string, type: 'email_verification' | 'password_reset', expiresHours: number = 24): Promise<string> => {
      const id = uuidv4();
      const token = uuidv4();
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
  
  // Notification methods
  notification: {
    create: async (data: { 
      userId: string; 
      type: 'info' | 'warning' | 'success' | 'error' | 'like' | 'comment'; 
      title: string; 
      message: string;
      data?: Record<string, unknown>;
    }): Promise<Notification> => {
      const id = uuidv4();
      const now = new Date();
      
      const notification: Notification = {
        id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
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

export type { User, Post, Comment, Like, RefreshToken, VerificationToken, Notification };
