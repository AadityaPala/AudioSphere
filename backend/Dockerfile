FROM python:3.11-slim

# Copy uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory inside the container
WORKDIR /app

# Copy the contents of the current folder (backend) into /app
COPY . .

# Install ALL required dependencies globally inside the container using uv
RUN uv pip install --system fastapi uvicorn pydantic sqlalchemy "psycopg[binary]" pyjwt python-dotenv

# Run the application (since we are already in /app, uvicorn can see main.py)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]