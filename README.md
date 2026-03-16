# 🚀 REST API

A comprehensive REST API built with Node.js, Express, and TypeScript. Features authentication, RBAC, rate limiting, Swagger documentation, and Docker support.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-4.x-black?style=flat-square&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Jest](https://img.shields.io/badge/Jest-29-C21325?style=flat-square&logo=jest)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)

## ✨ Features

- 🔐 **JWT Authentication** - Access & Refresh tokens
- 👤 **Role-Based Access Control** - Admin & User roles
- 📚 **Swagger Documentation** - Interactive API docs at `/api-docs`
- 🛡️ **Security** - Rate limiting, Helmet, CORS
- 📄 **Pagination** - Sort, filter, paginate endpoints
- 🧪 **Testing** - Unit & Integration tests with Jest
- 🐳 **Docker** - Production-ready containerization
- 🔥 **Hot Reload** - Development with auto-restart

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Language | TypeScript |
| Auth | JWT (Access + Refresh tokens) |
| Validation | Zod |
| Testing | Jest + Supertest |
| Docs | Swagger/OpenAPI |
| Container | Docker |

## 🚀 Quick Start

### Using Bun (Recommended)
```bash
# Clone
git clone https://github.com/Mavorynix/rest-api.git
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
| POST | `/api/auth/refresh` | Refresh access token | ❌ |
| POST | `/api/auth/logout` | Logout user | ✅ |
| GET | `/api/auth/me` | Get current user | ✅ |
| PUT | `/api/auth/me` | Update profile | ✅ |
| DELETE | `/api/auth/me` | Delete account | ✅ |

### Users (Admin Only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Get all users | ✅ Admin |
| GET | `/api/users/:id` | Get user by ID | ✅ |
| PUT | `/api/users/:id` | Update user | ✅ Owner/Admin |
| DELETE | `/api/users/:id` | Delete user | ✅ Owner/Admin |

### Posts
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/posts` | Get all posts | ❌ |
| GET | `/api/posts/:id` | Get single post | ❌ |
| POST | `/api/posts` | Create post | ✅ |
| PUT | `/api/posts/:id` | Update post | ✅ Owner/Admin |
| DELETE | `/api/posts/:id` | Delete post | ✅ Owner/Admin |

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

### Filtering
```
GET /api/posts?authorId=uuid
GET /api/users?role=admin
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
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
```

## 🐳 Docker Commands

```bash
# Build image
docker build -t rest-api .

# Run container
docker run -p 3000:3000 rest-api

# Using docker-compose
docker-compose up -d api        # Production
docker-compose up api-dev       # Development
```

## 📁 Project Structure

```
rest-api/
├── src/
│   ├── __tests__/           # Test files
│   ├── config/              # Configuration files
│   │   ├── cors.ts          # CORS config
│   │   ├── rateLimit.ts     # Rate limiting
│   │   └── swagger.ts       # Swagger/OpenAPI
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Express middleware
│   ├── models/              # Data models
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── validation/          # Zod schemas
│   ├── app.ts               # Express app
│   └── index.ts             # Entry point
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
| **admin** | All operations, manage all users & posts |
| **user** | Manage own profile & posts only |

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run test` | Run all tests |
| `bun run test:coverage` | Run tests with coverage |
| `bun run lint` | Lint code |

## 📄 License

MIT License

## 👤 Author

**Mavorynix**
- GitHub: [@Mavorynix](https://github.com/Mavorynix)

---

⭐️ If you like this project, give it a star!
