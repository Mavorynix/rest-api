# 📚 REST API Documentation

Complete documentation for the REST API.

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Testing](#testing)
6. [Deployment](#deployment)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **Bun** (recommended) or npm/yarn
- **Git**
- **Docker** (optional)

### Installation

```bash
# Clone
git clone https://github.com/Mavorynix/rest-api.git
cd rest-api

# Install
bun install

# Configure
cp .env.example .env

# Run
bun run dev
```

### Verify

- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs

---

## 🔐 Authentication

The API uses **JWT** with access and refresh tokens.

### Token Types

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access | 15 min | API requests |
| Refresh | 7 days | Get new access token |

### Usage

```bash
# Include in header
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Current user |

### Roles

| Role | Permissions |
|------|-------------|
| `user` | Own resources only |
| `admin` | All resources |

---

## 📡 API Endpoints

### Auth

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | ❌ |
| POST | `/api/auth/login` | ❌ |
| POST | `/api/auth/refresh` | ❌ |
| POST | `/api/auth/logout` | ✅ |
| GET | `/api/auth/me` | ✅ |

### Users (Admin)

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/users` | ✅ Admin |
| GET | `/api/users/:id` | ✅ |
| PUT | `/api/users/:id` | ✅ Owner/Admin |
| DELETE | `/api/users/:id` | ✅ Owner/Admin |

### Posts

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/posts` | ❌ |
| GET | `/api/posts/:id` | ❌ |
| POST | `/api/posts` | ✅ |
| PUT | `/api/posts/:id` | ✅ Owner/Admin |
| DELETE | `/api/posts/:id` | ✅ Owner/Admin |

### Query Parameters

```
# Pagination
?page=2&limit=10

# Sorting
?sort=createdAt&order=desc

# Filtering
?authorId=uuid
```

---

## ⚠️ Error Handling

### Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": [{"field": "email", "message": "Invalid"}]
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## 🧪 Testing

```bash
# All tests
bun run test

# Coverage
bun run test:coverage

# Unit only
bun run test:unit

# Integration only
bun run test:integration
```

### Coverage Target: ≥ 50%

---

## 🚢 Deployment

### Docker

```bash
# Build
docker build -t rest-api .

# Run
docker run -p 3000:3000 rest-api

# Compose
docker-compose up -d api
```

### Environment Variables

| Variable | Required |
|----------|----------|
| `JWT_SECRET` | ✅ |
| `NODE_ENV` | ✅ |
| `PORT` | ❌ |

### Security

- ✅ Helmet headers
- ✅ CORS
- ✅ Rate limiting
- ✅ Input validation

---

## 📦 Tech Stack

| Category | Tech |
|----------|------|
| Runtime | Node.js 18+ |
| Framework | Express |
| Language | TypeScript |
| Auth | JWT |
| Validation | Zod |
| Testing | Jest |
| Docs | Swagger |
| Container | Docker |

---

Made with ❤️ by **Mavorynix**
