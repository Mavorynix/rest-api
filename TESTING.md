# 🧪 Testing Guide

Panduan lengkap untuk testing REST API menggunakan Jest dan Supertest.

## 📋 Daftar Isi

1. [Instalasi Dependencies](#1-instalasi-dependencies)
2. [Konfigurasi Jest](#2-konfigurasi-jest)
3. [Struktur Folder Test](#3-struktur-folder-test)
4. [Unit Tests](#4-unit-tests)
5. [Integration Tests](#5-integration-tests)
6. [Menjalankan Tests](#6-menjalankan-tests)
7. [Code Coverage](#7-code-coverage)
8. [Best Practices](#8-best-practices)

---

## 1. Instalasi Dependencies

```bash
# Install testing dependencies
bun add -d jest @types/jest ts-jest supertest @types/supertest

# Atau menggunakan npm
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

### Dependencies yang diinstall:

| Package | Fungsi |
|---------|--------|
| `jest` | Test framework utama |
| `@types/jest` | TypeScript types untuk Jest |
| `ts-jest` | TypeScript preprocessor untuk Jest |
| `supertest` | HTTP assertion library untuk testing Express |
| `@types/supertest` | TypeScript types untuk Supertest |

---

## 2. Konfigurasi Jest

### jest.config.js

```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {}]
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
};
```

---

## 3. Struktur Folder Test

```
src/
├── __tests__/
│   ├── setup.ts                    # Setup & teardown global
│   ├── unit/                       # Unit tests
│   │   ├── utils/
│   │   │   └── helpers.test.ts     # Test utility functions
│   │   └── validation/
│   │       └── auth.validation.test.ts
│   └── integration/                # Integration tests
│       ├── auth.test.ts            # Test auth endpoints
│       └── posts.test.ts           # Test posts endpoints
├── utils/
│   └── helpers.ts                  # Functions to test
├── validation/
│   └── auth.validation.ts          # Zod schemas
└── app.ts                          # Express app
```

---

## 4. Unit Tests

### Apa itu Unit Test?

Unit test menguji **satu fungsi/komponen** secara terisolasi, tanpa dependency eksternal.

### Contoh: Testing Utility Functions

```typescript
// src/__tests__/unit/utils/helpers.test.ts

import { formatBytes, isValidEmail, isValidUUID } from '../../utils/helpers';

describe('Utility Functions', () => {
  
  describe('formatBytes', () => {
    it('should return "0 Bytes" for 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
    });
  });
});
```

### Contoh: Testing Validation Schemas

```typescript
// src/__tests__/unit/validation/auth.validation.test.ts

import { registerSchema } from '../../validation/auth.validation';

describe('Validation Schemas', () => {
  
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        body: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123',
        },
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        body: {
          email: 'invalid-email',
          username: 'testuser',
          password: 'Password123',
        },
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
```

---

## 5. Integration Tests

### Apa itu Integration Test?

Integration test menguji **beberapa komponen bekerja bersama**, termasuk endpoint API, database, dll.

### Contoh: Testing Auth Endpoints

```typescript
// src/__tests__/integration/auth.test.ts

import request from 'supertest';
import app from '../../app';

describe('Auth Endpoints', () => {
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('token');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('token');
    });
  });
});
```

### Contoh: Testing Protected Routes

```typescript
// src/__tests__/integration/posts.test.ts

import request from 'supertest';
import app from '../../app';

describe('Post Endpoints', () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', username: 'test', password: 'Password123' });
    
    authToken = res.body.data.token;
  });

  describe('POST /api/posts', () => {
    it('should create post with auth', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test', content: 'Content' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject without auth', async () => {
      await request(app)
        .post('/api/posts')
        .send({ title: 'Test', content: 'Content' })
        .expect(401);
    });
  });
});
```

---

## 6. Menjalankan Tests

### Perintah Dasar

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with verbose output
bun run test:verbose

# Run only unit tests
bun run test:unit

# Run only integration tests
bun run test:integration

# Run specific test file
bun run test -- auth.test.ts

# Run tests matching pattern
bun run test -- --testNamePattern="register"
```

### Scripts di package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

---

## 7. Code Coverage

### Generate Coverage Report

```bash
bun run test:coverage
```

### Hasil Coverage

```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |   85.71 |    75.00 |   88.89 |   85.71 |                   
 helpers  |   90.00 |    80.00 |  100.00 |   90.00 | 25,30             
 auth.ts  |   80.00 |    66.67 |   75.00 |   80.00 | 15,20-25          
----------|---------|----------|---------|---------|-------------------
```

### Target Coverage yang Baik

| Metric | Target |
|--------|--------|
| Branches | ≥ 70% |
| Functions | ≥ 80% |
| Lines | ≥ 80% |
| Statements | ≥ 80% |

---

## 8. Best Practices

### ✅ DO

```typescript
// ✅ Gunakan descriptive test names
it('should return 401 when token is missing', async () => {
  // test code
});

// ✅ Test satu hal per test
it('should validate email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
});

// ✅ Gunakan beforeEach/afterEach untuk setup
beforeEach(() => {
  // reset state
});

// ✅ Test edge cases
it('should handle empty string', () => {
  expect(sanitizeString('')).toBe('');
});
```

### ❌ DON'T

```typescript
// ❌ Jangan test banyak hal sekaligus
it('should work', async () => {
  // testing register, login, AND posts in one test
});

// ❌ Jangan hardcode values tanpa penjelasan
expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');

// ❌ Jangan skip tests
it.skip('should work', () => {});
```

---

## 📁 Files Created

| File | Description |
|------|-------------|
| `jest.config.js` | Jest configuration |
| `src/__tests__/setup.ts` | Global test setup |
| `src/__tests__/unit/utils/helpers.test.ts` | Unit tests for utilities |
| `src/__tests__/unit/validation/auth.validation.test.ts` | Unit tests for validation |
| `src/__tests__/integration/auth.test.ts` | Integration tests for auth |
| `src/__tests__/integration/posts.test.ts` | Integration tests for posts |
| `.env.test` | Test environment variables |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Run tests
bun run test

# 3. Run with coverage
bun run test:coverage
```

---

Made with 💜 by **Mavorynix**
