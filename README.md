# 🚀 REST API

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-black?style=flat-square&logo=express)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Jest](https://img.shields.io/badge/Jest-29-C21325?style=flat-square&logo=jest)](https://jestjs.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

A comprehensive REST API built with Node.js, Express, and TypeScript. Features authentication, RBAC, rate limiting, Swagger documentation, Docker support, file uploads, email verification, real-time notifications, comments, and likes.

## ✨ Features

### Authentication & Authorization
- 🔐 **JWT Authentication** - Access & Refresh tokens
- 🔑 **Password Management** - Change password with verification
- ✉️ **Email Verification** - Verify email on registration
- 👤 **Role-Based Access Control** - Admin & User roles

### Core Features
- 📁 **File Upload** - Avatar & post image uploads
- 🔔 **Real-time Notifications** - WebSocket via Socket.io
- 💬 **Comments** - Nested comments with replies
- ❤️ **Likes** - Like/unlike posts and comments
- 📝 **Posts** - CRUD with pagination

### Technical Features
- 🛡️ **Security** - Helmet, CORS, Rate limiting
- 📖 **Swagger Documentation** - Auto-generated API docs
- 🧪 **Testing** - Jest with unit & integration tests
- 🐳 **Docker** - Dockerfile & docker-compose

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4.x
- **Language**: TypeScript
- **Database**: In-memory (default) / PostgreSQL
- **Auth**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Testing**: Jest
- **Real-time**: Socket.io

## 📦 Installation

### Local Development

```bash
# Clone the repository
git clone https://github.com/manggaladev/rest-api.git
cd rest-api

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Start development server
bun run dev
```

### Docker

```bash
docker-compose up -d
```

## 🚀 Usage

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/users/me` | Get current user |
| GET | `/api/posts` | List posts |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/:id` | Get post |
| POST | `/api/posts/:id/comments` | Add comment |
| POST | `/api/posts/:id/like` | Like post |

### API Documentation

Swagger UI available at `/api/docs` when running the server.

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run with coverage
bun run test:coverage

# Run unit tests only
bun run test:unit

# Run integration tests only
bun run test:integration
```

## 📁 Project Structure

```
rest-api/
├── src/
│   ├── index.ts          # Entry point
│   ├── app.ts            # Express app
│   ├── routes/           # API routes
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middlewares/      # Express middlewares
│   ├── validators/       # Zod schemas
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── .github/              # GitHub workflows
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 📄 License

[MIT License](LICENSE)

