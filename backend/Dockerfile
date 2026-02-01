FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm install --legacy-peer-deps --include=dev --ignore-scripts && npm rebuild rollup --force

COPY . .

ENV NODE_ENV=production

RUN npm run build:server

ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

EXPOSE 5000

CMD ["npm", "start"]
