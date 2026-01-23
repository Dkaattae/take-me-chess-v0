# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build Backend dependencies
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS backend-builder
WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv export --frozen --no-dev -o requirements.txt

# Stage 3: Final Image
FROM python:3.12-slim-bookworm
WORKDIR /app

# Install Nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Copy frontend build from stage 1
# Next.js export usually outputs to /app/frontend/out
COPY --from=frontend-builder /app/frontend/out /usr/share/nginx/html

# Copy backend requirements and install
COPY --from=backend-builder /app/backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Expose port 80 (where Nginx listens)
EXPOSE 80

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=postgresql://chess_user:chess_password@db:5432/take_me_chess

CMD ["./start.sh"]
