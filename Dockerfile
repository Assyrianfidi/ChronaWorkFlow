# ChronaWorkFlow - Elite SaaS Platform
# Production-Grade Docker Configuration

# Use Node.js 18 LTS Alpine for smaller image size
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
COPY package*.json ./
RUN npm ci --only=development

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 chronaworkflow

# Copy the built application
COPY --from=builder --chown=chronaworkflow:nodejs /app/dist ./dist
COPY --from=builder --chown=chronaworkflow:nodejs /app/server ./server
COPY --from=builder --chown=chronaworkflow:nodejs /app/package*.json ./
COPY --from=builder --chown=chronaworkflow:nodejs /app/.env* ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER chronaworkflow

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
