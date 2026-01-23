# Use a Python image with uv pre-installed
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy only the files needed for exporting dependencies
COPY pyproject.toml uv.lock ./

# Export dependencies to requirements.txt
RUN uv export --frozen --no-dev -o requirements.txt

# Final stage
FROM python:3.12-slim-bookworm

WORKDIR /app

# Copy requirements.txt from the builder stage
COPY --from=builder /app/requirements.txt .

# Install dependencies using pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
