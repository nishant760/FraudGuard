FROM python:3.11-slim

WORKDIR /app

# Install build & system dependencies for XGBoost
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY streaming/requirements.txt /app/streaming/requirements.txt
RUN pip install --no-cache-dir -r /app/streaming/requirements.txt

COPY streaming /app/streaming

WORKDIR /app/streaming

CMD ["python", "consumer.py", "--bootstrap-servers", "kafka:9092"]
