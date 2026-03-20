#!/bin/bash
set -e

echo "=========================================="
echo "   PhantomRotate v0.5.0"
echo "   Proxy Pool Manager"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Installing Go dependencies..."
go mod download

echo "Building backend..."
go build -o phantomrotate ./cmd/server

echo "Building frontend..."
cd web
npm install
npm run build
cd ..

echo ""
echo "Build complete!"
echo "Run './phantomrotate' to start the server"
