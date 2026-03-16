# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy package.json and install production dependencies
COPY package.json ./
RUN npm install --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
