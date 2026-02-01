#!/bin/bash
# Script to run API tests with automatic server start/stop
# Usage: ./scripts/test-api-with-server.sh

set -e

echo "🚀 Starting API tests with server..."
echo ""

# Function to cleanup
cleanup() {
  echo ""
  echo "🛑 Stopping server..."
  if [ ! -z "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null || true
  fi
  exit $1
}

# Trap cleanup on exit
trap 'cleanup $?' EXIT INT TERM

# Build application
echo "📦 Building application..."
npm run build

echo ""
echo "🌐 Starting server on port 3000..."
PORT=3000 npm run preview -- --port 3000 &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
timeout 30 bash -c 'until curl -f http://localhost:3000 > /dev/null 2>&1; do sleep 1; done' || {
  echo "❌ Server failed to start"
  exit 1
}

echo "✅ Server is ready!"
echo ""

# Run tests
echo "🧪 Running API tests..."
npm run test:api

echo ""
echo "✅ All tests completed!"
