FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git=2.40.1-r0 curl=8.2.0-r0

# Copy package files
COPY package*.json ./
COPY *.cjs ./

# Install dependencies with specific versions, skipping prepare scripts
RUN npm install -g npm@latest && \
    npm install -D tailwindcss@latest postcss@latest autoprefixer@latest @tailwindcss/postcss@latest && \
    npm config set ignore-scripts true && \
    npm install

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Build the application (skip TypeScript checking for Docker)
RUN npm run build -- --skip-ts-check || npm run build

# Use a lightweight server for production
RUN npm install -g serve@14.2.1

# Start the production server
CMD ["serve", "-s", "dist", "-l", "3000"]
