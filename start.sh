#!/bin/sh

# Start FastAPI backend in the background
echo "Starting FastAPI backend..."
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Start Nginx in the foreground
echo "Starting Nginx..."
nginx -g 'daemon off;'
