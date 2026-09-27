FROM python:3.11-slim

# Copy uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory inside the container
WORKDIR /app

# Copy ONLY your backend code into the container
COPY backend/ ./backend/

# Install ALL required dependencies globally inside the container using uv
# (Added sqlalchemy, psycopg[binary] for Neon, pyjwt, and python-dotenv)
RUN uv pip install --system fastapi uvicorn pydantic sqlalchemy "psycopg[binary]" pyjwt python-dotenv

# Change working directory to backend so uvicorn can easily find main.py
WORKDIR /app/backend

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]