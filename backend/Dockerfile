FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat=1.2.4-r2

COPY package*.json ./
RUN npm install --legacy-peer-deps --include=dev --ignore-scripts && npm rebuild rollup --force

COPY . .

ENV NODE_ENV=production

RUN npm run build:server

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npm", "start"]
