/**
 * Jest Test Setup
 * 
 * This file runs before each test file.
 * Use it for global setup, mocking, and test utilities.
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.PORT = '3001';

// Extend Jest matchers
expect.extend({
  toBeValidToken(received: string) {
    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(received, process.env.JWT_SECRET!);
      return {
        pass: true,
        message: () => `expected ${received} not to be a valid JWT token`,
      };
    } catch {
      return {
        pass: false,
        message: () => `expected ${received} to be a valid JWT token`,
      };
    }
  },
});

// Global test timeout
jest.setTimeout(10000);

// Mock console for cleaner output (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
// };

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

export {};
