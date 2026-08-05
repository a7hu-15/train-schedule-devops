# Multi-stage production build using Node.js 20 Alpine
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

# Production runner image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy dependencies and source code
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# Set non-root execution context for container security
USER node

EXPOSE 8080

CMD ["node", "./bin/www"]