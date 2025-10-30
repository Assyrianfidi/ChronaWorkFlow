# ========================================
# Development Stage
# ========================================
FROM node:20-alpine

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies including devDependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["sh", "-c", "cd client && npm install && npm run dev"]

# ========================================
# Production Stage
# ========================================
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    tzdata \
    dumb-init

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -S appuser && adduser -S appuser -G appuser

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Copy configuration files
COPY .env* ./  # Will be overridden by docker-compose

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Set timezone
ENV TZ=UTC

# Set permissions
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Expose port
EXPOSE ${PORT}

# Start the application
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "--loader", "tsx", "server/index.ts"]

# ========================================
# Labels
# ========================================
LABEL maintainer="dev@accubooks.app"
LABEL org.opencontainers.image.title="AccuBooks"
LABEL org.opencontainers.image.description="Professional accounting software with double-entry bookkeeping"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.url="https://accubooks.app"
LABEL org.opencontainers.image.source="https://github.com/yourorg/accubooks"
LABEL org.opencontainers.image.licenses="MIT"
