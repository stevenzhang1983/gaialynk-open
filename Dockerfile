FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# Mainline HTTP + WebSocket.
# Railway / production: set NODE_ENV=production, PORT, DATABASE_URL, REDIS_URL, JWT_SECRET, etc. (see root .env.example).
# Health: GET /api/v1/health
CMD ["npm", "run", "dev:server"]
