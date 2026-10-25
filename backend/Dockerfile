FROM python:3.12-slim

# Install uv for ultra-fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Enable bytecode compilation and copy dependency files
ENV UV_COMPILE_BYTECODE=1
COPY pyproject.toml ./

# Install dependencies into the system python environment
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy application code
COPY main.py ./

# Expose default port
EXPOSE 8000

# Use shell form to allow Render's $PORT environment variable to expand
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}