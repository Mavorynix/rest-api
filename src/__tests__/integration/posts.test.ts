/**
 * Integration Tests for Post Endpoints
 * Tests for CRUD operations with authentication
 */

import request from 'supertest';
import app from '../../app';
import { resetDb } from '../../models/db';

describe('Post Endpoints', () => {
  let accessToken: string;
  let userId: string;
  
  const testUser = {
    email: 'postuser@example.com',
    username: 'postuser',
    password: 'Password123',
  };

  const testPost = {
    title: 'Test Post Title',
    content: 'This is test content for the post.',
  };

  beforeEach(() => {
    resetDb();
  });

  // ==========================================
  // Setup: Register and Login
  // ==========================================
  beforeAll(async () => {
    // Register user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    accessToken = registerRes.body.data.accessToken;
    userId = registerRes.body.data.user.id;
  });

  // ==========================================
  // GET /api/posts
  // ==========================================
  describe('GET /api/posts', () => {
    it('should return empty array when no posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return all posts', async () => {
      // Create a post first
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testPost);

      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('content');
    });

    it('should support pagination', async () => {
      // Create multiple posts
      for (let i = 0; i < 15; i++) {
        await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: `Post ${i}`, content: `Content ${i}` });
      }

      const response = await request(app)
        .get('/api/posts?page=2&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  // ==========================================
  // POST /api/posts
  // ==========================================
  describe('POST /api/posts', () => {
    it('should create a new post with authentication', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testPost)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(testPost.title);
      expect(response.body.data.content).toBe(testPost.content);
      expect(response.body.data.authorId).toBe(userId);
    });

    it('should reject post creation without auth', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send(testPost)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject post without title', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Some content' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject post without content', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Some title' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject post with empty title', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '', content: 'Some content' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // GET /api/posts/:id
  // ==========================================
  describe('GET /api/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Post for Get',
          content: 'Content for get test',
        });
      
      postId = response.body.data.id;
    });

    it('should return a single post by ID', async () => {
      const response = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(postId);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/posts/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // PUT /api/posts/:id
  // ==========================================
  describe('PUT /api/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Post to Update',
          content: 'Original content',
        });
      
      postId = response.body.data.id;
    });

    it('should update own post', async () => {
      const updatedData = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updatedData.title);
      expect(response.body.data.content).toBe(updatedData.content);
    });

    it('should reject update without auth', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .send({ title: 'New Title' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject update of non-existent post', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .put(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'New Title', content: 'New content' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject update of another user post', async () => {
      // Create another user
      const otherUser = {
        email: 'other@example.com',
        username: 'otheruser',
        password: 'Password123',
      };
      
      const otherRes = await request(app)
        .post('/api/auth/register')
        .send(otherUser);
      
      const otherToken = otherRes.body.data.accessToken;

      // Try to update first user's post
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Title', content: 'Hacked content' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unauthorized');
    });
  });

  // ==========================================
  // DELETE /api/posts/:id
  // ==========================================
  describe('DELETE /api/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Post to Delete',
          content: 'Content to delete',
        });
      
      postId = response.body.data.id;
    });

    it('should delete own post', async () => {
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify post is deleted
      await request(app)
        .get(`/api/posts/${postId}`)
        .expect(404);
    });

    it('should reject delete without auth', async () => {
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject delete of non-existent post', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .delete(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject delete of another user post', async () => {
      // Create another user
      const otherUser = {
        email: 'deleter@example.com',
        username: 'deleter',
        password: 'Password123',
      };
      
      const otherRes = await request(app)
        .post('/api/auth/register')
        .send(otherUser);
      
      const otherToken = otherRes.body.data.accessToken;

      // Try to delete first user's post
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
