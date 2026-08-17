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

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

# ─────────────────────────────────────────────
# Config from environment
# ─────────────────────────────────────────────
MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")   # tiny|base|small|medium
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")        # cpu or cuda
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE", "int8")  # int8 (CPU) or float16 (GPU)
BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "5"))
CPU_THREADS = int(os.getenv("WHISPER_CPU_THREADS", "0"))
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
    log.info(
        "Loading Whisper model: size=%s device=%s compute=%s beam=%d threads=%s",
        MODEL_SIZE, DEVICE, COMPUTE_TYPE, BEAM_SIZE, CPU_THREADS or "auto",
    )
    t0 = time.perf_counter()
    _model = WhisperModel(
        MODEL_SIZE,
        device=DEVICE,
        compute_type=COMPUTE_TYPE,
        cpu_threads=CPU_THREADS,
    )
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


def _transcribe_file(file_path: str, filename: str, initial_prompt: str = "") -> dict:
    """Run Whisper inference and return structured result.

    Args:
        file_path:      Path to the temporary audio file.
        filename:       Original filename (for logging).
        initial_prompt: Text to seed the decoder with. **Never pass the expected
                        ayah here when the transcript is going to be graded.**
                        Whisper decodes the prompt as preceding context, and on
                        a short or quiet clip it simply echoes it back — the
                        learner then scores near-perfect for saying nothing at
                        all. It is accepted only for non-graded callers.
    """
    if _model is None:
        raise RuntimeError("Model not loaded")

    if initial_prompt:
        log.warning(
            "initial_prompt supplied (%d chars) — the transcript may echo it; "
            "never do this for grading",
            len(initial_prompt),
        )

    log.info("Transcribing file: %s", filename)
    t0 = time.perf_counter()

    transcribe_kwargs: dict = {
        "language": "ar",           # force Arabic; avoids language-detect step
        "beam_size": BEAM_SIZE,
        "temperature": [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
        "compression_ratio_threshold": 2.4,
        "log_prob_threshold": -1.0,
        "no_speech_threshold": 0.6,
        "repetition_penalty": 1.1,
        "condition_on_previous_text": False,
        "vad_filter": True,         # strip silence — key for short recordings
        "vad_parameters": {
            "min_silence_duration_ms": 300,
            "speech_pad_ms": 200,
        },
        "word_timestamps": False,   # word-level diff is done in Go
    }
    if initial_prompt:
        transcribe_kwargs["initial_prompt"] = initial_prompt

    segments, info = _model.transcribe(file_path, **transcribe_kwargs)

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
async def transcribe(
    audio: UploadFile = File(...),
    initial_prompt: str = Form(""),
):
    """
    Transcribe an Arabic audio file.

    Form fields:
      audio          — audio file upload (m4a / mp3 / wav / ogg / aac / webm)
      initial_prompt — (optional) decoder seed text. Do NOT send the expected
                       ayah: the transcript will echo it and any grading built
                       on top becomes meaningless.

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
        result = await run_in_threadpool(
            _transcribe_file, tmp_path, audio.filename or "unknown", initial_prompt
        )
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
