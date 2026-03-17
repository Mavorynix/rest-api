/**
 * In-memory database for testing and development
 * Includes User, Post, Comment, Like, RefreshToken, VerificationToken, Notification, Tag, PostTag, Activity, and Follow models
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

interface Tag {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PostTag {
  id: string;
  postId: string;
  tagId: string;
  createdAt: Date;
}

interface Activity {
  id: string;
  type: 'post' | 'like' | 'comment' | 'follow';
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment' | 'user';
  data?: Record<string, unknown>;
  createdAt: Date;
}

interface Follow {
  id: string;
  followerId: string;
  followingId: string;
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
const tags: Map<string, Tag> = new Map();
const postTags: Map<string, PostTag> = new Map();
const activities: Map<string, Activity> = new Map();
const follows: Map<string, Follow> = new Map();

// Indexes for faster lookups
const userEmailIndex: Map<string, string> = new Map();
const userTokenIndex: Map<string, string> = new Map();
const postLikesIndex: Map<string, Set<string>> = new Map(); // postId -> set of likeIds
const commentLikesIndex: Map<string, Set<string>> = new Map(); // commentId -> set of likeIds
const postCommentsIndex: Map<string, Set<string>> = new Map(); // postId -> set of commentIds
const tagNameIndex: Map<string, string> = new Map(); // tagName -> tagId
const postTagsIndex: Map<string, Set<string>> = new Map(); // postId -> set of postTagIds
const tagPostsIndex: Map<string, Set<string>> = new Map(); // tagId -> set of postTagIds
const userFollowersIndex: Map<string, Set<string>> = new Map(); // userId -> set of followerIds
const userFollowingIndex: Map<string, Set<string>> = new Map(); // userId -> set of followingIds
const userActivitiesIndex: Map<string, Set<string>> = new Map(); // userId -> set of activityIds

// Reset database (for testing)
export const resetDb = () => {
  users.clear();
  posts.clear();
  comments.clear();
  likes.clear();
  refreshTokens.clear();
  verificationTokens.clear();
  notifications.clear();
  tags.clear();
  postTags.clear();
  activities.clear();
  follows.clear();
  userEmailIndex.clear();
  userTokenIndex.clear();
  postLikesIndex.clear();
  commentLikesIndex.clear();
  postCommentsIndex.clear();
  tagNameIndex.clear();
  postTagsIndex.clear();
  tagPostsIndex.clear();
  userFollowersIndex.clear();
  userFollowingIndex.clear();
  userActivitiesIndex.clear();
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
    
    countVerified: async (): Promise<number> => {
      return Array.from(users.values()).filter(u => u.isVerified).length;
    },
    
    countRecent: async (days: number): Promise<number> => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return Array.from(users.values()).filter(u => u.createdAt >= cutoff).length;
    },
    
    findManyWithStats: async (options?: { 
      limit?: number; 
      offset?: number;
      sortBy?: string;
    }): Promise<{ users: Array<Omit<User, 'password'> & { postsCount: number; commentsCount: number; likesCount: number }>; total: number }> => {
      const sortBy = options?.sortBy || 'recent';
      
      const allUsers = Array.from(users.values()).map(user => {
        const userPosts = Array.from(posts.values()).filter(p => p.authorId === user.id);
        const userComments = Array.from(comments.values()).filter(c => c.userId === user.id);
        const userLikes = Array.from(likes.values()).filter(l => l.userId === user.id);
        
        const { password: _, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          postsCount: userPosts.length,
          commentsCount: userComments.length,
          likesCount: userLikes.length,
        };
      });
      
      // Sort
      if (sortBy === 'posts') {
        allUsers.sort((a, b) => b.postsCount - a.postsCount);
      } else if (sortBy === 'active') {
        allUsers.sort((a, b) => (b.postsCount + b.commentsCount + b.likesCount) - (a.postsCount + a.commentsCount + a.likesCount));
      } else {
        allUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      
      const total = allUsers.length;
      
      // Pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || allUsers.length;
      const paginatedUsers = allUsers.slice(offset, offset + limit);
      
      return { users: paginatedUsers, total };
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
    
    countRecent: async (days: number): Promise<number> => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return Array.from(posts.values()).filter(p => p.createdAt >= cutoff).length;
    },
    
    findManyWithStats: async (options?: { 
      limit?: number; 
      offset?: number;
      sortBy?: string;
    }): Promise<{ posts: Array<Post & { author: { id: string; username: string; email: string } | null }>; total: number }> => {
      const sortBy = options?.sortBy || 'recent';
      
      const allPosts = Array.from(posts.values()).map(post => {
        const author = users.get(post.authorId);
        return {
          ...post,
          author: author ? { id: author.id, username: author.username, email: author.email } : null,
        };
      });
      
      // Sort
      if (sortBy === 'likes') {
        allPosts.sort((a, b) => b.likesCount - a.likesCount);
      } else if (sortBy === 'comments') {
        allPosts.sort((a, b) => b.commentsCount - a.commentsCount);
      } else {
        allPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      
      const total = allPosts.length;
      
      // Pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || allPosts.length;
      const paginatedPosts = allPosts.slice(offset, offset + limit);
      
      return { posts: paginatedPosts, total };
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
    
    count: async (): Promise<number> => {
      return comments.size;
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
    
    count: async (): Promise<number> => {
      return likes.size;
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
  
  // Tag methods
  tag: {
    create: async (data: { name: string; description?: string }): Promise<Tag> => {
      const id = uuidv4();
      const now = new Date();
      
      const tag: Tag = {
        id,
        name: data.name.toLowerCase().trim(),
        description: data.description,
        createdAt: now,
        updatedAt: now,
      };
      
      tags.set(id, tag);
      tagNameIndex.set(tag.name, id);
      tagPostsIndex.set(id, new Set());
      
      return tag;
    },
    
    findById: async (id: string): Promise<Tag | null> => {
      return tags.get(id) || null;
    },
    
    findByName: async (name: string): Promise<Tag | null> => {
      const tagId = tagNameIndex.get(name.toLowerCase().trim());
      if (!tagId) return null;
      return tags.get(tagId) || null;
    },
    
    findMany: async (options?: { 
      limit?: number; 
      offset?: number;
      search?: string;
    }): Promise<{ tags: Array<Tag & { postsCount: number }>; total: number }> => {
      let allTags = Array.from(tags.values()).map(tag => {
        const postTagIds = tagPostsIndex.get(tag.id) || new Set();
        return {
          ...tag,
          postsCount: postTagIds.size,
        };
      });
      
      // Search
      if (options?.search) {
        const searchLower = options.search.toLowerCase();
        allTags = allTags.filter(t => t.name.includes(searchLower));
      }
      
      // Sort by posts count (most popular first)
      allTags.sort((a, b) => b.postsCount - a.postsCount);
      
      const total = allTags.length;
      
      // Pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || allTags.length;
      const paginatedTags = allTags.slice(offset, offset + limit);
      
      return { tags: paginatedTags, total };
    },
    
    update: async (id: string, data: { name?: string; description?: string }): Promise<Tag | null> => {
      const tag = tags.get(id);
      if (!tag) return null;
      
      if (data.name) {
        tagNameIndex.delete(tag.name);
        tag.name = data.name.toLowerCase().trim();
        tagNameIndex.set(tag.name, id);
      }
      if (data.description !== undefined) {
        tag.description = data.description;
      }
      
      tag.updatedAt = new Date();
      tags.set(id, tag);
      
      return tag;
    },
    
    delete: async (id: string): Promise<boolean> => {
      const tag = tags.get(id);
      if (!tag) return false;
      
      // Delete all post-tag associations
      const postTagIds = tagPostsIndex.get(id);
      if (postTagIds) {
        for (const ptId of postTagIds) {
          const pt = postTags.get(ptId);
          if (pt) {
            const postTagsSet = postTagsIndex.get(pt.postId);
            if (postTagsSet) {
              postTagsSet.delete(ptId);
            }
          }
          postTags.delete(ptId);
        }
      }
      
      tagNameIndex.delete(tag.name);
      tagPostsIndex.delete(id);
      
      return tags.delete(id);
    },
    
    getPosts: async (tagId: string, options?: { limit?: number; offset?: number }): Promise<{ posts: Post[]; total: number }> => {
      const postTagIds = tagPostsIndex.get(tagId) || new Set();
      
      const taggedPosts: Post[] = [];
      for (const ptId of postTagIds) {
        const pt = postTags.get(ptId);
        if (pt) {
          const post = posts.get(pt.postId);
          if (post) {
            taggedPosts.push(post);
          }
        }
      }
      
      // Sort by creation date
      taggedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const total = taggedPosts.length;
      
      // Pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || taggedPosts.length;
      const paginatedPosts = taggedPosts.slice(offset, offset + limit);
      
      return { posts: paginatedPosts, total };
    },
    
    findPopular: async (limit: number = 20): Promise<Array<Tag & { postsCount: number }>> => {
      const allTags = Array.from(tags.values()).map(tag => {
        const postTagIds = tagPostsIndex.get(tag.id) || new Set();
        return {
          ...tag,
          postsCount: postTagIds.size,
        };
      });
      
      allTags.sort((a, b) => b.postsCount - a.postsCount);
      
      return allTags.slice(0, limit);
    },
  },
  
  // PostTag methods (many-to-many)
  postTag: {
    create: async (data: { postId: string; tagId: string }): Promise<PostTag | null> => {
      // Check if association already exists
      for (const pt of postTags.values()) {
        if (pt.postId === data.postId && pt.tagId === data.tagId) {
          return null;
        }
      }
      
      const id = uuidv4();
      const now = new Date();
      
      const postTag: PostTag = {
        id,
        postId: data.postId,
        tagId: data.tagId,
        createdAt: now,
      };
      
      postTags.set(id, postTag);
      
      // Update indexes
      const postTagsSet = postTagsIndex.get(data.postId);
      if (postTagsSet) {
        postTagsSet.add(id);
      } else {
        postTagsIndex.set(data.postId, new Set([id]));
      }
      
      const tagPostsSet = tagPostsIndex.get(data.tagId);
      if (tagPostsSet) {
        tagPostsSet.add(id);
      }
      
      return postTag;
    },
    
    findByPostId: async (postId: string): Promise<Array<PostTag & { tag: Tag }>> => {
      const postTagIds = postTagsIndex.get(postId) || new Set();
      const result: Array<PostTag & { tag: Tag }> = [];
      
      for (const ptId of postTagIds) {
        const pt = postTags.get(ptId);
        if (pt) {
          const tag = tags.get(pt.tagId);
          if (tag) {
            result.push({ ...pt, tag });
          }
        }
      }
      
      return result;
    },
    
    delete: async (postId: string, tagId: string): Promise<boolean> => {
      for (const [id, pt] of postTags.entries()) {
        if (pt.postId === postId && pt.tagId === tagId) {
          // Update indexes
          const postTagsSet = postTagsIndex.get(postId);
          if (postTagsSet) {
            postTagsSet.delete(id);
          }
          
          const tagPostsSet = tagPostsIndex.get(tagId);
          if (tagPostsSet) {
            tagPostsSet.delete(id);
          }
          
          return postTags.delete(id);
        }
      }
      return false;
    },
    
    deleteByPostId: async (postId: string): Promise<number> => {
      const postTagIds = postTagsIndex.get(postId) || new Set();
      let count = 0;
      
      for (const ptId of postTagIds) {
        const pt = postTags.get(ptId);
        if (pt) {
          const tagPostsSet = tagPostsIndex.get(pt.tagId);
          if (tagPostsSet) {
            tagPostsSet.delete(ptId);
          }
          postTags.delete(ptId);
          count++;
        }
      }
      
      postTagsIndex.delete(postId);
      return count;
    },
  },
  
  // Activity methods
  activity: {
    create: async (data: { 
      type: 'post' | 'like' | 'comment' | 'follow';
      userId: string;
      targetId: string;
      targetType: 'post' | 'comment' | 'user';
      activityData?: Record<string, unknown>;
    }): Promise<Activity> => {
      const id = uuidv4();
      const now = new Date();
      
      const activity: Activity = {
        id,
        type: data.type,
        userId: data.userId,
        targetId: data.targetId,
        targetType: data.targetType,
        data: data.activityData,
        createdAt: now,
      };
      
      activities.set(id, activity);
      
      // Update user activities index
      const userActivitiesSet = userActivitiesIndex.get(data.userId);
      if (userActivitiesSet) {
        userActivitiesSet.add(id);
      } else {
        userActivitiesIndex.set(data.userId, new Set([id]));
      }
      
      return activity;
    },
    
    getFeed: async (userId: string, options?: { limit?: number; offset?: number }): Promise<{ activities: Array<Activity & { user?: { id: string; username: string }; target?: unknown }>; total: number }> => {
      // Get users that this user follows
      const followingIds = userFollowingIndex.get(userId) || new Set();
      
      // Include user's own activity
      followingIds.add(userId);
      
      const allActivities: Array<Activity & { user?: { id: string; username: string }; target?: unknown }> = [];
      
      for (const act of activities.values()) {
        if (followingIds.has(act.userId)) {
          const user = users.get(act.userId);
          let target: unknown = null;
          
          if (act.targetType === 'post') {
            target = posts.get(act.targetId);
          } else if (act.targetType === 'comment') {
            target = comments.get(act.targetId);
          } else if (act.targetType === 'user') {
            const targetUser = users.get(act.targetId);
            if (targetUser) {
              const { password: _, ...userWithoutPassword } = targetUser;
              target = userWithoutPassword;
            }
          }
          
          allActivities.push({
            ...act,
            user: user ? { id: user.id, username: user.username } : undefined,
            target,
          });
        }
      }
      
      // Sort by creation date (newest first)
      allActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const total = allActivities.length;
      
      // Pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || allActivities.length;
      const paginatedActivities = allActivities.slice(offset, offset + limit);
      
      return { activities: paginatedActivities, total };
    },
    
    getTrending: async (limit: number, timeframe: string): Promise<Array<Post & { score: number }>> => {
      // Calculate time cutoff
      let cutoffDays = 7;
      if (timeframe === 'day') cutoffDays = 1;
      else if (timeframe === 'month') cutoffDays = 30;
      
      const cutoff = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);
      
      // Filter posts within timeframe and calculate score
      const trendingPosts = Array.from(posts.values())
        .filter(p => p.createdAt >= cutoff)
        .map(post => ({
          ...post,
          score: post.likesCount * 3 + post.commentsCount * 2,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      return trendingPosts;
    },
    
    getRecent: async (userId: string, limit: number): Promise<Array<Activity & { user?: { id: string; username: string }; target?: unknown }>> => {
      const userActivitiesSet = userActivitiesIndex.get(userId) || new Set();
      
      const userActivities: Array<Activity & { user?: { id: string; username: string }; target?: unknown }> = [];
      
      for (const actId of userActivitiesSet) {
        const act = activities.get(actId);
        if (act) {
          const user = users.get(act.userId);
          let target: unknown = null;
          
          if (act.targetType === 'post') {
            target = posts.get(act.targetId);
          } else if (act.targetType === 'comment') {
            target = comments.get(act.targetId);
          }
          
          userActivities.push({
            ...act,
            user: user ? { id: user.id, username: user.username } : undefined,
            target,
          });
        }
      }
      
      // Sort by creation date (newest first)
      userActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return userActivities.slice(0, limit);
    },
  },
  
  // Follow methods
  follow: {
    create: async (data: { followerId: string; followingId: string }): Promise<Follow | null> => {
      // Check if already following
      const existing = await db.follow.isFollowing(data.followerId, data.followingId);
      if (existing) return null;
      
      // Can't follow yourself
      if (data.followerId === data.followingId) return null;
      
      const id = uuidv4();
      const now = new Date();
      
      const follow: Follow = {
        id,
        followerId: data.followerId,
        followingId: data.followingId,
        createdAt: now,
      };
      
      follows.set(id, follow);
      
      // Update indexes
      const followersSet = userFollowersIndex.get(data.followingId);
      if (followersSet) {
        followersSet.add(data.followerId);
      } else {
        userFollowersIndex.set(data.followingId, new Set([data.followerId]));
      }
      
      const followingSet = userFollowingIndex.get(data.followerId);
      if (followingSet) {
        followingSet.add(data.followingId);
      } else {
        userFollowingIndex.set(data.followerId, new Set([data.followingId]));
      }
      
      // Create activity
      await db.activity.create({
        type: 'follow',
        userId: data.followerId,
        targetId: data.followingId,
        targetType: 'user',
      });
      
      return follow;
    },
    
    isFollowing: async (followerId: string, followingId: string): Promise<boolean> => {
      const followingSet = userFollowingIndex.get(followerId);
      return followingSet ? followingSet.has(followingId) : false;
    },
    
    delete: async (followerId: string, followingId: string): Promise<boolean> => {
      for (const [id, f] of follows.entries()) {
        if (f.followerId === followerId && f.followingId === followingId) {
          // Update indexes
          const followersSet = userFollowersIndex.get(followingId);
          if (followersSet) {
            followersSet.delete(followerId);
          }
          
          const followingSet = userFollowingIndex.get(followerId);
          if (followingSet) {
            followingSet.delete(followingId);
          }
          
          return follows.delete(id);
        }
      }
      return false;
    },
    
    getFollowers: async (userId: string, options?: { limit?: number; offset?: number }): Promise<{ followers: Array<Omit<User, 'password'>>; total: number }> => {
      const followersSet = userFollowersIndex.get(userId) || new Set();
      
      const followersList: Array<Omit<User, 'password'>> = [];
      for (const followerId of followersSet) {
        const user = users.get(followerId);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          followersList.push(userWithoutPassword);
        }
      }
      
      // Sort by username
      followersList.sort((a, b) => a.username.localeCompare(b.username));
      
      const total = followersList.length;
      
      // Pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || followersList.length;
      const paginatedFollowers = followersList.slice(offset, offset + limit);
      
      return { followers: paginatedFollowers, total };
    },
    
    getFollowing: async (userId: string, options?: { limit?: number; offset?: number }): Promise<{ following: Array<Omit<User, 'password'>>; total: number }> => {
      const followingSet = userFollowingIndex.get(userId) || new Set();
      
      const followingList: Array<Omit<User, 'password'>> = [];
      for (const followingId of followingSet) {
        const user = users.get(followingId);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          followingList.push(userWithoutPassword);
        }
      }
      
      // Sort by username
      followingList.sort((a, b) => a.username.localeCompare(b.username));
      
      const total = followingList.length;
      
      // Pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || followingList.length;
      const paginatedFollowing = followingList.slice(offset, offset + limit);
      
      return { following: paginatedFollowing, total };
    },
    
    countFollowers: async (userId: string): Promise<number> => {
      const followersSet = userFollowersIndex.get(userId);
      return followersSet ? followersSet.size : 0;
    },
    
    countFollowing: async (userId: string): Promise<number> => {
      const followingSet = userFollowingIndex.get(userId);
      return followingSet ? followingSet.size : 0;
    },
  },
};

export type { User, Post, Comment, Like, RefreshToken, VerificationToken, Notification, Tag, PostTag, Activity, Follow };
