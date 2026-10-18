#!/usr/bin/env bash
# Build static multi-platform binaries for Kyron 2.0
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist/bin"

mkdir -p "${DIST_DIR}"

VERSION="1.0.0"
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "release")
BUILD_DATE=$(date -u +%Y-%m-%d)

LDFLAGS="-s -w -X main.Version=${VERSION} -X main.GitCommit=${COMMIT} -X main.BuildDate=${BUILD_DATE}"

echo "=================================================="
echo "🔨 Building Kyron 2.0 Static Binaries (v${VERSION})"
echo "=================================================="

# 1. Native Build for current host
echo "--> Compiling native kyron CLI..."
(cd "${ROOT_DIR}/gateway" && CGO_ENABLED=0 go build -ldflags="${LDFLAGS}" -o "${DIST_DIR}/kyron" ./cmd/kyron)

echo "--> Compiling native kyron-gateway..."
(cd "${ROOT_DIR}/gateway" && CGO_ENABLED=0 go build -ldflags="${LDFLAGS}" -o "${DIST_DIR}/kyron-gateway" ./cmd/gateway)

# 2. Linux amd64 cross-compile
echo "--> Cross-compiling linux-amd64 binaries..."
(cd "${ROOT_DIR}/gateway" && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="${LDFLAGS}" -o "${DIST_DIR}/kyron-linux-amd64" ./cmd/kyron)
(cd "${ROOT_DIR}/gateway" && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="${LDFLAGS}" -o "${DIST_DIR}/kyron-gateway-linux-amd64" ./cmd/gateway)

# 3. Darwin arm64 cross-compile
echo "--> Cross-compiling darwin-arm64 binaries..."
(cd "${ROOT_DIR}/gateway" && GOOS=darwin GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="${LDFLAGS}" -o "${DIST_DIR}/kyron-darwin-arm64" ./cmd/kyron)

# 4. Checksums
echo "--> Generating SHA-256 checksums..."
(cd "${DIST_DIR}" && sha256sum * > SHA256SUMS.txt 2>/dev/null || shasum -a 256 * > SHA256SUMS.txt 2>/dev/null || true)

echo "✅ Static binaries successfully built in ${DIST_DIR}"
ls -lh "${DIST_DIR}"
