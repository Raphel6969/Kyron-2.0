# Multi-stage production build for Kyron Control Plane API (C12)
# Stage 1: Dependency installer
FROM python:3.12-slim AS builder

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

# Stage 2: Minimal non-root runtime
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 kyron

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH=/app

COPY control/ /app/control/
COPY eval/ /app/eval/

USER 10001:10001

EXPOSE 8001

HEALTHCHECK --interval=5s --timeout=3s --retries=3 \
  CMD curl -f http://127.0.0.1:8001/healthz || exit 1

CMD ["uvicorn", "control.app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
