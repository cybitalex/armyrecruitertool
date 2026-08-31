# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (with retry/timeout config for flaky registry connections)
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev deps needed by bundled code)
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm ci

# Copy built files from builder
# The dist directory contains both backend (index.js) and frontend (public/)
COPY --from=builder /app/dist ./dist

# Copy drizzle config and schema for migrations
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/shared ./shared

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 5001

# Set environment
ENV NODE_ENV=production
ENV PORT=5001

# Start the application
CMD ["node", "dist/index.js"]

