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

# Production image - serve frontend static files
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built frontend from builder
COPY --from=builder /app/client/dist .

# Copy nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
