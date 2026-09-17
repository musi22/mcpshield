# ==========================================
# Multi-Stage Production Dockerfile for MCPShield
# ==========================================

# Stage 1: Build React Frontend UI with Clerk
FROM node:20-alpine AS frontend-builder
WORKDIR /app/apps/web

# Copy package manifests and install
COPY apps/web/package*.json ./
RUN npm ci

# Copy web source and build production bundle
COPY apps/web/ ./
RUN npm run build

# Stage 2: Production Python Backend & Gateway
FROM python:3.11-slim
WORKDIR /app

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements (including svix and psycopg)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and CLI
COPY . /app

# Copy built frontend assets from Stage 1 into /app/apps/web/dist
COPY --from=frontend-builder /app/apps/web/dist /app/apps/web/dist

ENV PYTHONPATH=/app
ENV PORT=8000
EXPOSE 8000

# Start production server with dynamic port support for cloud providers (Render, Fly, Railway)
CMD ["sh", "-c", "python -m uvicorn apps.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
