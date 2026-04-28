"""
DeenQuest Whisper Transcription Service
======================================
A lightweight FastAPI microservice that wraps faster-whisper for Arabic speech-to-text.
Uses the 'small' model for good accuracy/latency balance at low cost.

POST /transcribe  — accepts multipart audio file, returns JSON transcript
GET  /health      — liveness probe
"""

import logging
import os
import tempfile
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

# ─────────────────────────────────────────────
# Config from environment
# ─────────────────────────────────────────────
MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")   # tiny|base|small|medium
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")        # cpu or cuda
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE", "int8")  # int8 (CPU) or float16 (GPU)
MAX_AUDIO_MB = int(os.getenv("MAX_AUDIO_MB", "10"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s [whisper-svc] %(message)s",
)
log = logging.getLogger("whisper-svc")

# ─────────────────────────────────────────────
# Model lifecycle
# ─────────────────────────────────────────────
_model: Optional[WhisperModel] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model once on startup; free on shutdown."""
    global _model
    log.info("Loading Whisper model: size=%s device=%s compute=%s", MODEL_SIZE, DEVICE, COMPUTE_TYPE)
    t0 = time.perf_counter()
    _model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    elapsed = time.perf_counter() - t0
    log.info("Whisper model loaded in %.2fs", elapsed)
    yield
    log.info("Whisper service shutting down")
    _model = None


app = FastAPI(
    title="DeenQuest Whisper Service",
    version="1.0.0",
    lifespan=lifespan,
)

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
ALLOWED_EXTENSIONS = {".m4a", ".mp3", ".wav", ".ogg", ".aac", ".webm", ".mp4"}


def _validate_audio_file(upload: UploadFile) -> None:
    """Validate file extension (MIME type is unreliable on mobile)."""
    if upload.filename:
        ext = Path(upload.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported audio format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            )


def _transcribe_file(file_path: str, filename: str) -> dict:
    """Run Whisper inference and return structured result."""
    if _model is None:
        raise RuntimeError("Model not loaded")

    log.info("Transcribing file: %s", filename)
    t0 = time.perf_counter()

    # Always attempt Arabic first (saves beam-search over language detection)
    segments, info = _model.transcribe(
        file_path,
        language="ar",          # force Arabic for Quran recitation
        beam_size=5,
        best_of=5,
        patience=1.0,
        vad_filter=True,        # strip silence — reduces hallucination on pauses
        vad_parameters={
            "min_silence_duration_ms": 300,
            "speech_pad_ms": 200,
        },
        word_timestamps=False,  # not needed for word-level comparison (done in Go)
    )

    text_parts = []
    for seg in segments:
        part = seg.text.strip()
        if part:
            text_parts.append(part)
            log.debug(
                "Segment [%.2fs → %.2fs] prob=%.3f: %s",
                seg.start, seg.end, seg.avg_logprob, part,
            )

    full_text = " ".join(text_parts).strip()
    elapsed = time.perf_counter() - t0

    log.info(
        "Transcription complete: lang=%s lang_prob=%.3f duration=%.2fs text='%s'",
        info.language, info.language_probability, elapsed, full_text,
    )

    return {
        "text": full_text,
        "language": info.language,
        "confidence": round(info.language_probability, 4),
        "duration_ms": round(elapsed * 1000),
    }


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Transcribe an Arabic audio file.

    Form field: audio (file upload)
    Returns:
        {
          "text": "بسم الله الرحمن الرحيم",
          "language": "ar",
          "confidence": 0.9983,
          "duration_ms": 1234
        }
    """
    _validate_audio_file(audio)

    # Read and size-check
    content = await audio.read()
    size_mb = len(content) / (1024 * 1024)
    log.info("Received audio: filename=%s size=%.2fMB", audio.filename, size_mb)

    if size_mb > MAX_AUDIO_MB:
        raise HTTPException(
            status_code=413,
            detail=f"Audio file too large ({size_mb:.1f} MB). Max allowed: {MAX_AUDIO_MB} MB",
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    # Write to secure temp file
    suffix = Path(audio.filename or "audio.m4a").suffix or ".m4a"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = _transcribe_file(tmp_path, audio.filename or "unknown")
        return JSONResponse(content=result)
    except Exception as exc:
        log.exception("Transcription failed for %s: %s", audio.filename, exc)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
    finally:
        # Always clean up temp file
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


# ─────────────────────────────────────────────
# Entry point (for local dev: uvicorn main:app --port 8001)
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level=LOG_LEVEL.lower())
