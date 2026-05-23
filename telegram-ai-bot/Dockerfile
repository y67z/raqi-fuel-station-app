FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System libs needed by Pillow (libjpeg, zlib already in slim, but add for safety)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libjpeg62-turbo zlib1g \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render injects $PORT=10000, Hugging Face Spaces injects $PORT=7860, etc.
# The bot reads $PORT at runtime, so any platform works.
ENV PORT=7860
EXPOSE 7860

CMD ["python", "bot.py"]
