# Build backend image
FROM python:3.12-slim

# Install system dependencies needed for audio decoding and compiling
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install python dependencies using CPU indices to save space
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download Silero VAD model weights into torch hub cache so the container can start offline
RUN python -c "import torch; torch.hub.load('snakers4/silero-vad', 'silero_vad', force_reload=True)"

# Copy application sources
COPY . .

# Expose port and start
EXPOSE 8000
ENV DATA_DIR=/app/data
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
