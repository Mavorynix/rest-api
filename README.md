# 🚀 REST API

A comprehensive REST API built with Node.js, Express, and TypeScript. Features authentication, RBAC, rate limiting, Swagger documentation, Docker support, file uploads, email verification, real-time notifications, comments, and likes.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-4.x-black?style=flat-square&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Jest](https://img.shields.io/badge/Jest-29-C21325?style=flat-square&logo=jest)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black?style=flat-square&logo=socketdotio)

## ✨ Features

- 🔐 **JWT Authentication** - Access & Refresh tokens
- 🔑 **Password Management** - Change password with current password verification
- ✉️ **Email Verification** - Verify email on registration
- 📁 **File Upload** - Avatar & post image uploads
- 🔔 **Real-time Notifications** - WebSocket via Socket.io
- 👤 **Role-Based Access Control** - Admin & User roles
- 💬 **Comments** - Nested comments with replies
- ❤️ **Likes** - Like/unlike posts and comments
- 🏷️ **Tags** - Tag posts and filter by tags
- 📊 **Activity Feed** - Posts from followed users, likes, comments
- 📈 **Analytics** - Dashboard stats, post analytics, user analytics (admin)
- 🔍 **Search** - Search posts and users
- 📚 **Swagger Documentation** - Interactive API docs at `/api-docs`
- 🛡️ **Security** - Rate limiting, Helmet, CORS
- 📄 **Pagination** - Sort, filter, paginate endpoints
- 🧪 **Testing** - Unit & Integration tests with Jest
- 🐳 **Docker** - Production-ready containerization
- 🔥 **Hot Reload** - Development with auto-restart
- 📝 **Request Logging** - Morgan HTTP request logging

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 18+ / Bun |
| Framework | Express.js |
| Language | TypeScript |
| Auth | JWT (Access + Refresh tokens) |
| Validation | Zod |
| File Upload | Multer |
| Email | Nodemailer |
| Real-time | Socket.io |
| Logging | Morgan + Winston |
| Testing | Jest + Supertest |
| Docs | Swagger/OpenAPI |
| Container | Docker |

## 🚀 Quick Start

### Using Bun (Recommended)
```bash
# Clone
git clone https://github.com/manggaladev/rest-api.git
cd rest-api

# Install
bun install

# Setup environment
cp .env.example .env

# Development
bun run dev

# Production
bun run build
bun run start
```

### Using Docker
```bash
# Development
docker-compose up api-dev

# Production
docker-compose up api
```

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/verify-email` | Verify email address | ❌ |
| POST | `/api/auth/resend-verification` | Resend verification email | ❌ |
| POST | `/api/auth/forgot-password` | Request password reset | ❌ |
| POST | `/api/auth/reset-password` | Reset password | ❌ |
| POST | `/api/auth/refresh` | Refresh access token | ❌ |
| POST | `/api/auth/logout` | Logout user | ✅ |
| GET | `/api/auth/me` | Get current user | ✅ |
| PUT | `/api/auth/me` | Update profile | ✅ |
| PUT | `/api/auth/change-password` | Change password | ✅ |
| DELETE | `/api/auth/me` | Delete account | ✅ |

### Posts
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/posts` | Get all posts (with search) | ❌ |
| GET | `/api/posts/user/me` | Get my posts | ✅ |
| GET | `/api/posts/:id` | Get single post | ❌ |
| POST | `/api/posts` | Create post | ✅ |
| PUT | `/api/posts/:id` | Update post | ✅ Owner/Admin |
| DELETE | `/api/posts/:id` | Delete post | ✅ Owner/Admin |

### Comments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/posts/:postId/comments` | Get post comments | ❌ |
| GET | `/api/comments/:id` | Get single comment | ❌ |
| GET | `/api/comments/:id/replies` | Get comment replies | ❌ |
| POST | `/api/posts/:postId/comments` | Create comment | ✅ |
| PUT | `/api/comments/:id` | Update comment | ✅ Owner |
| DELETE | `/api/comments/:id` | Delete comment | ✅ Owner/Admin |

### Likes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/posts/:postId/likes` | Get post likes | ❌ |
| GET | `/api/posts/:postId/like/status` | Check like status | Optional |
| POST | `/api/posts/:postId/like` | Like a post | ✅ |
| DELETE | `/api/posts/:postId/like` | Unlike a post | ✅ |
| POST | `/api/comments/:commentId/like` | Like a comment | ✅ |
| DELETE | `/api/comments/:commentId/like` | Unlike a comment | ✅ |

### Upload
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/avatar` | Upload avatar | ✅ |
| POST | `/api/upload/post-image` | Upload post image | ✅ |
| DELETE | `/api/upload/avatar` | Delete avatar | ✅ |

### Notifications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | Get notifications | ✅ |
| PUT | `/api/notifications/read-all` | Mark all as read | ✅ |
| PUT | `/api/notifications/:id/read` | Mark as read | ✅ |
| DELETE | `/api/notifications/:id` | Delete notification | ✅ |

### Users (Admin Only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Get all users (with search) | ✅ Admin |
| GET | `/api/users/:id` | Get user by ID | ✅ |
| PUT | `/api/users/:id` | Update user | ✅ Owner/Admin |
| DELETE | `/api/users/:id` | Delete user | ✅ Owner/Admin |

### Tags
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tags` | Get all tags | ❌ |
| GET | `/api/tags/:id` | Get tag by ID | ❌ |
| GET | `/api/tags/name/:tagName` | Get posts by tag name | ❌ |
| POST | `/api/tags` | Create tag | ✅ Admin |
| PUT | `/api/tags/:id` | Update tag | ✅ Admin |
| DELETE | `/api/tags/:id` | Delete tag | ✅ Admin |

### Activity
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/activity/feed` | Get activity feed | ✅ |
| GET | `/api/activity/trending` | Get trending posts | ❌ |
| GET | `/api/activity/recent` | Get recent activity | ✅ |

### Analytics (Admin Only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/overview` | Dashboard stats | ✅ Admin |
| GET | `/api/analytics/posts` | Post analytics | ✅ Admin |
| GET | `/api/analytics/users` | User analytics | ✅ Admin |
| GET | `/api/analytics/tags` | Tag analytics | ✅ Admin |

## 🔌 WebSocket Events

Connect to the WebSocket server at `/socket.io/`

### Authentication
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your-access-token' }
});
```

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connected` | Server → Client | Connection confirmed |
| `notification` | Server → Client | New notification received |
| `mark_read` | Client → Server | Mark notification as read |
| `marked_read` | Server → Client | Confirmation of read status |

## 📖 Query Parameters

### Pagination
```
GET /api/posts?page=2&limit=10
```

### Sorting
```
GET /api/posts?sort=createdAt&order=desc
GET /api/users?sort=username&order=asc
```

### Search
```
GET /api/posts?search=keyword
GET /api/users?search=john
```

### Filtering
```
GET /api/posts?authorId=uuid
GET /api/users?role=admin
GET /api/notifications?unreadOnly=true
```

## 📚 API Documentation

Access interactive Swagger documentation at:
```
http://localhost:3000/api-docs
```

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run with coverage
bun run test:coverage

# Run in watch mode
bun run test:watch

# Run only unit tests
bun run test:unit

# Run only integration tests
bun run test:integration
```

## 🔐 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-here

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Base URL for email links
BASE_URL=http://localhost:3000

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@example.com
EMAIL_FROM_NAME=REST API
```

## 📁 Project Structure

```
rest-api/
├── src/
│   ├── __tests__/           # Test files
│   ├── config/              # Configuration files
│   │   ├── cors.ts          # CORS config
│   │   ├── rateLimit.ts     # Rate limiting
│   │   ├── swagger.ts       # Swagger/OpenAPI
│   │   ├── upload.ts        # Multer config
│   │   ├── email.ts         # Nodemailer config
│   │   └── socket.ts        # Socket.io config
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── post.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── like.controller.ts
│   │   └── ...
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── models/              # Data models (db.ts)
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── validation/          # Zod schemas
│   ├── app.ts               # Express app
│   └── index.ts             # Entry point
├── uploads/                 # Uploaded files
│   ├── avatars/            # User avatars
│   └── posts/              # Post images
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose
├── jest.config.js           # Jest configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 👤 Roles & Permissions

| Role | Permissions |
|------|-------------|
| **admin** | All operations, manage all users, posts & comments |
| **user** | Manage own profile, posts & comments only |

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run test` | Run all tests |
| `bun run test:coverage` | Run tests with coverage |
| `bun run lint` | Lint code |

## 📧 Email Templates

The API includes beautiful HTML email templates for:
- ✉️ **Email Verification** - Sent on registration
- 🔐 **Password Reset** - Sent on forgot password
- 🎉 **Welcome Email** - Sent after verification

For development, you can use [Ethereal Email](https://ethereal.email) to test emails.

## 🔒 Security Features

- ✅ JWT Authentication with refresh tokens
- ✅ Email verification required
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on sensitive endpoints
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation with Zod
- ✅ Role-based access control

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

