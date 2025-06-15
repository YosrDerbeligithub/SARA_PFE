# New merged Dockerfile for historical_processing
FROM --platform=linux/arm64 python:3.11-slim  

WORKDIR /app

# Preserve cache permission fix from old version
RUN mkdir -p /app/.cache && chmod 777 /app/.cache

# Keep dependency installation from both versions
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Keep code copy structure from new version
COPY . .

# Maintain environment variable from new version
ENV PYTHONPATH=/app

# Keep development-friendly reload from new version
CMD ["uvicorn", "historical_processing:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]