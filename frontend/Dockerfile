# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files from frontend directory
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the frontend application
COPY frontend/ .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built files from the builder stage
COPY --from=builder /app/out /usr/share/nginx/html

# Copy nginx configuration from project root
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
