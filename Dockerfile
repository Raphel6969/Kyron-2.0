# Multi-stage unified production build for Kyron 2.0 on Render
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS ui-builder
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

# Stage 2: Build Gateway Binary
FROM golang:1.23-alpine AS gateway-builder
WORKDIR /src/gateway
RUN apk add --no-cache git ca-certificates tzdata
COPY gateway/go.mod gateway/go.sum* ./
RUN go mod download
COPY gateway/ ./
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w -X main.Version=1.0.0 -X main.GitCommit=render" \
    -o /bin/kyron-gateway ./cmd/gateway
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w -X main.Version=1.0.0 -X main.GitCommit=render" \
    -o /bin/kyron ./cmd/kyron

# Stage 3: Python Virtualenv Builder
FROM python:3.12-slim AS python-builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY control/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 4: Production Runtime
FROM python:3.12-slim

# Install runtime dependencies: Nginx, gettext-base (for envsubst), curl, libpq
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    gettext-base \
    libpq5 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

WORKDIR /app

# Copy Python venv and code
COPY --from=python-builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH=/app

COPY control/ /app/control/
COPY eval/ /app/eval/
COPY scripts/ /app/scripts/

# Copy Go binaries
COPY --from=gateway-builder /bin/kyron-gateway /usr/local/bin/kyron-gateway
COPY --from=gateway-builder /bin/kyron /usr/local/bin/kyron
RUN chmod +x /usr/local/bin/kyron-gateway /usr/local/bin/kyron

# Copy built frontend assets
COPY --from=ui-builder /app/ui/dist /usr/share/nginx/html

# Copy Render deployment configuration and entrypoint
COPY deploy/render-nginx.conf.template /etc/nginx/conf.d/render.conf.template
COPY deploy/render-entrypoint.sh /app/deploy/render-entrypoint.sh
RUN chmod +x /app/deploy/render-entrypoint.sh

# Ensure line endings are LF for entrypoint
RUN sed -i 's/\r$//' /app/deploy/render-entrypoint.sh

# Render sets PORT dynamically (default 10000)
ENV PORT=10000
EXPOSE 10000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT}/healthz || exit 1

ENTRYPOINT ["/app/deploy/render-entrypoint.sh"]
