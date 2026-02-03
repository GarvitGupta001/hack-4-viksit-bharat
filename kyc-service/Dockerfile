# Use Python 3.11 slim image as base
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Set environment variables for TensorFlow optimization
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TF_CPP_MIN_LOG_LEVEL=2 \
    TF_ENABLE_ONEDNN_OPTS=0 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OMP_NUM_THREADS=1

# Install system dependencies required for DeepFace and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    wget \
    libavcodec-extra \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Pre-download DeepFace models during build (optional but recommended)
RUN python -c "from deepface import DeepFace; \
    DeepFace.build_model('ArcFace'); \
    print('Models downloaded successfully')" || true

# Create a non-root user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /home/appuser/.deepface && \
    chown -R appuser:appuser /app /home/appuser

USER appuser

# Expose port (Cloud Run will inject PORT env variable)
EXPOSE 8080

# Set environment variables
ENV PORT=8080 \
    HOME=/home/appuser

# Run the application with gunicorn for production
# Using single worker and sync class for stability with ML models
CMD exec gunicorn \
    --bind :$PORT \
    --workers 1 \
    --threads 1 \
    --timeout 600 \
    --worker-class sync \
    --max-requests 100 \
    --max-requests-jitter 10 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    app:app