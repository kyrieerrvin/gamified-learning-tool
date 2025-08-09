# syntax=docker/dockerfile:1

FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependencies first for better caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app.py ./
# Optional: copy local model if available
# COPY tl_tocylog_trf ./tl_tocylog_trf

# Environment
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

# Health port
EXPOSE 5000

# Command (prod-ready via gunicorn)
CMD exec gunicorn --bind 0.0.0.0:${PORT} --workers 1 --threads 4 --timeout 300 app:app 