# Multi-stage Dockerfile for AccuBooks
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package files
COPY package*.json ./
RUN npm install --legacy-peer-deps --include=dev --ignore-scripts && npm rebuild rollup --force

# Install client dependencies
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --legacy-peer-deps --include=dev --ignore-scripts && npm rebuild rollup --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# Copy source files
COPY . .

# Set NODE_ENV for build
ENV NODE_ENV=production

# Build the frontend
WORKDIR /app/client
RUN npm run build

# Build the backend
WORKDIR /app
RUN npm run build:server

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Install only production dependencies
RUN npm install --legacy-peer-deps --production --ignore-scripts
RUN npm install -g --legacy-peer-deps cross-env

USER nextjs

EXPOSE 5000

ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["npm", "start"]
