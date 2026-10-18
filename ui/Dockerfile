# Multi-stage production build for Kyron Modern SOC Console (C13)
# Stage 1: Build static frontend assets
FROM node:20-alpine AS builder

WORKDIR /app

COPY ui/package*.json ./
RUN npm ci

COPY ui/ ./
RUN npm run build

# Stage 2: Minimal Nginx web server
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=5s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
