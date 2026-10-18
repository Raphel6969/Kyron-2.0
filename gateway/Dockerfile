# Multi-stage production build for Kyron Custom Protocol Gateway (C1)
# Stage 1: Build static binary
FROM golang:1.23-alpine AS builder

WORKDIR /src/gateway

RUN apk add --no-cache git ca-certificates tzdata

COPY gateway/go.mod gateway/go.sum* ./
RUN go mod download

COPY gateway/ ./

RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w -X main.Version=1.0.0 -X main.GitCommit=docker" \
    -o /bin/kyron-gateway ./cmd/gateway

RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w -X main.Version=1.0.0 -X main.GitCommit=docker" \
    -o /bin/kyron ./cmd/kyron

# Stage 2: Minimal non-root runtime
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata && \
    addgroup -g 10001 kyron && \
    adduser -D -u 10001 -G kyron kyron

WORKDIR /app

COPY --from=builder /bin/kyron-gateway /usr/local/bin/kyron-gateway
COPY --from=builder /bin/kyron /usr/local/bin/kyron

USER 10001:10001

EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/kyron-gateway"]
