# Stage 1: Build Next.js project
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Copy lock files and packages
COPY package*.json ./
RUN npm ci

# Copy sources
COPY . .

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Serve Next.js project and run python CLI
FROM node:20-bookworm-slim AS runner

# Install Python 3, pip, virtualenv, and system packages needed for librosa, matplotlib, reportlab, and ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

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
COPY --from=builder /app/backend ./backend

# Create virtual environment and install Python dependencies
RUN python3 -m venv venv && \
    ./venv/bin/pip install --no-cache-dir -r backend/requirements.txt

# Pre-download Silero VAD model weights into torch hub cache so the container can start offline
RUN ./venv/bin/python -c "import torch; torch.hub.load('snakers4/silero-vad', 'silero_vad', force_reload=True)"

EXPOSE 3000
CMD ["npm", "start"]

    