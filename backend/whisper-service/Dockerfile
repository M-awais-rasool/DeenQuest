# Whisper transcription service.
#
# The 358 MB model is deliberately NOT baked in — it is mounted read-only from a
# volume that is seeded once from object storage. That keeps this image small
# enough to rebuild casually, and keeps the model (which changes almost never)
# out of every image layer.
#
#   docker build -t deenquest-whisper:local backend/whisper-service
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Non-root, and the rootfs is mounted read-only at runtime. Transcription writes
# only to /tmp, which the compose file provides as a noexec tmpfs.
RUN useradd --system --uid 10001 --no-create-home whisper
USER 10001:10001

ENV WHISPER_MODEL=/models/quran-base-ct2 \
    WHISPER_DEVICE=cpu \
    WHISPER_COMPUTE=int8 \
    WHISPER_MAX_CONCURRENT=1 \
    REQUIRE_INTERNAL_AUTH=true

EXPOSE 8001

# One worker on purpose. Transcription is CPU-bound and this box has 2 shared
# vCPUs; concurrency is bounded inside the app by a semaphore.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
