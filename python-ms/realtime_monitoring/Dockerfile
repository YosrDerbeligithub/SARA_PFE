# Merged Dockerfile for realtime-processing
FROM --platform=linux/arm64 python:3.11-slim 

WORKDIR /app



# Install dependencies (combination of both versions)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Add source code copying from old version
COPY app ./app

# Keep CMD from both versions (they're identical)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]