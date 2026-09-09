FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (including libgomp1 for XGBoost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy ML pipeline and backend source code
COPY ml /app/ml
COPY backend /app/backend

WORKDIR /app/backend

EXPOSE 8000

# Run FastAPI with Uvicorn on 0.0.0.0
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
