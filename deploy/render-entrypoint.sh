#!/usr/bin/env bash
set -e

# Default to 10000 if PORT is not set by Render
export PORT="${PORT:-10000}"
export CONTROL_API_PORT="${CONTROL_API_PORT:-8001}"
export GATEWAY_PORT="${GATEWAY_PORT:-8080}"
export GATEWAY_MODE="${GATEWAY_MODE:-enforce}"
export CONTROL_PLANE_URL="http://127.0.0.1:${CONTROL_API_PORT}"

echo "================================================================="
echo "🚀 Kyron 2.0 Web Service Initializing on Render (Port: ${PORT})"
echo "================================================================="

# Generate Nginx configuration from template
echo "⚙️  Configuring Nginx reverse proxy on port ${PORT}..."
envsubst '${PORT}' < /etc/nginx/conf.d/render.conf.template > /etc/nginx/conf.d/default.conf

# Start Control Plane API in background
echo "🛡️  Starting Control Plane API on port ${CONTROL_API_PORT}..."
python -m uvicorn control.app.main:app --host 127.0.0.1 --port "${CONTROL_API_PORT}" --workers 1 &
CONTROL_PID=$!

# Wait for Control API to become ready
echo "⏳ Waiting for Control Plane API to initialize..."
READY=0
for i in $(seq 1 30); do
  if curl -s -f "http://127.0.0.1:${CONTROL_API_PORT}/healthz" > /dev/null 2>&1; then
    READY=1
    echo "✅ Control Plane API is operational."
    break
  fi
  sleep 1
done

if [ $READY -eq 0 ]; then
  echo "⚠️ Warning: Control Plane API did not respond to /healthz within 30s. Continuing..."
fi

# Start Kyron Protocol Gateway in background
echo "⚡ Starting Protocol Gateway on port ${GATEWAY_PORT}..."
/usr/local/bin/kyron-gateway &
GATEWAY_PID=$!

# Clean shutdown handler
cleanup() {
  echo "🛑 Terminating background daemons..."
  kill -TERM "$CONTROL_PID" "$GATEWAY_PID" 2>/dev/null || true
  wait "$CONTROL_PID" "$GATEWAY_PID" 2>/dev/null || true
  exit 0
}
trap cleanup SIGTERM SIGINT

# Start Nginx in foreground
echo "🌐 Starting Nginx public web server on :${PORT}..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait for any process to exit
wait -n "$NGINX_PID" "$CONTROL_PID" "$GATEWAY_PID"
cleanup
