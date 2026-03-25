<div align="center">

# 🚀 REST API

**A production-ready REST API template with authentication, RBAC, real-time notifications, file uploads, testing, and more**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Jest](https://img.shields.io/badge/Jest-29-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## ✨ What's Included

### 🔐 Authentication
| Feature | Description |
|---------|-------------|
| JWT Tokens | Access & Refresh tokens |
| Email Verification | Verify email on signup |
| Password Reset | Change password flow |
| RBAC | Admin & User roles |

### 📦 Core Features
| Feature | Description |
|---------|-------------|
| Posts | CRUD with pagination |
| Comments | Nested comments |
| Likes | Like posts & comments |
| File Upload | Avatar & images |
| Tags | Categorize content |

### 🔧 Technical
| Feature | Description |
|---------|-------------|
| Rate Limiting | Prevent abuse |
| Swagger Docs | Auto-generated API docs |
| WebSocket | Real-time notifications |
| Docker | Container ready |
| Testing | Unit & Integration tests |

## 🚀 Quick Start

```bash
# Clone
cd rest-api

# Install
bun install

# Run
bun run dev
```

Server runs at `https://api.example.com`

## 📖 API Endpoints

### Auth
```
POST /api/auth/register     # Register
POST /api/auth/login        # Login
POST /api/auth/refresh      # Refresh token
POST /api/auth/logout       # Logout
```

### Users
```
GET  /api/users/me          # Current user
PUT  /api/users/me          # Update profile
POST /api/users/me/avatar   # Upload avatar
```

### Posts
```
GET    /api/posts           # List posts
POST   /api/posts           # Create post
GET    /api/posts/:id       # Get post
PUT    /api/posts/:id       # Update post
DELETE /api/posts/:id       # Delete post
```

### Interactions
```
POST /api/posts/:id/like           # Like post
POST /api/posts/:id/comments      # Add comment
POST /api/comments/:id/like       # Like comment
```

## 📚 Documentation

Swagger UI available at `/api-docs`

## 🧪 Testing

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch

# Coverage
bun run test:coverage
```

## 🐳 Docker

```bash
# Build & run
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🏗️ Project Structure

```
rest-api/
├── src/
│   ├── routes/           # API routes
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middlewares/      # Auth, validation
│   ├── models/           # Data models
│   └── __tests__/        # Tests
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## 🔧 Environment

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://api.example.com
```

## 🤝 Contributing

Contributions welcome! Feel free to submit PRs.

## 📄 License

[MIT License](LICENSE)

---

<div align="center">

**[⬆ Back to Top](#-rest-api)**


</div>
