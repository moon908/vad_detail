# Stage 1: Build Next.js project
FROM node:20-alpine AS builder
WORKDIR /app

# Copy lock files and packages
COPY package*.json ./
RUN npm ci

# Copy sources
COPY . .

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Serve Next.js project
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy output bundles and dependencies from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

EXPOSE 3000
CMD ["npm", "start"]
    