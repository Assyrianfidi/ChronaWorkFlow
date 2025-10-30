FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./
COPY *.cjs ./

# Install dependencies with specific versions
RUN npm install -g npm@latest && \
    npm install -D tailwindcss@latest postcss@latest autoprefixer@latest @tailwindcss/postcss@latest

# Install project dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=3000

# Build the application
RUN npm run build

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
