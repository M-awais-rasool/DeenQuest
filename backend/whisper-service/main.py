"""
DeenQuest Whisper Transcription Service
======================================
A lightweight FastAPI microservice that wraps faster-whisper for Arabic speech-to-text.

Runs a Quran-finetuned Whisper model, built once by convert_model.py
(`make whisper-model`). Recitation is a narrow, fixed vocabulary in an
orthography general Arabic ASR rarely sees, and every word the recogniser
invents is reported to the learner as their own mistake — so the model choice
here is a correctness concern, not a tuning preference.

POST /transcribe  — accepts multipart audio file, returns JSON transcript
GET  /health      — liveness probe
"""

import asyncio
import hmac
import logging
import os
import tempfile
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

# ─────────────────────────────────────────────
# Config from environment
# ─────────────────────────────────────────────
WHISPER_MODEL = os.getenv(
    "WHISPER_MODEL",
    str(Path(__file__).parent / "models" / "quran-base-ct2"),
)
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")        # cpu or cuda
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE", "int8")  # int8 (CPU) or float16 (GPU)
BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "5"))
CPU_THREADS = int(os.getenv("WHISPER_CPU_THREADS", "0"))
MAX_AUDIO_MB = int(os.getenv("MAX_AUDIO_MB", "10"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# Shared secret the API sends on every call. This service has no other
# authentication and transcription is the most expensive thing the box does, so
# in production it is required — an empty value here is refused at startup.
INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", "")
REQUIRE_TOKEN = os.getenv("REQUIRE_INTERNAL_AUTH", "false").lower() in ("1", "true", "yes", "on")

# Transcription is CPU-bound and the production box has 2 shared vCPUs. FastAPI's
# threadpool would happily run ~40 of these at once and starve the API of CPU,
# so requests queue instead.
MAX_CONCURRENT = int(os.getenv("WHISPER_MAX_CONCURRENT", "1"))
_transcribe_slot = asyncio.Semaphore(MAX_CONCURRENT)

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

    # Refuse to come up authenticated-in-name-only: if the operator asked for
    # the token check, a missing token is a misconfiguration, not a default.
    if REQUIRE_TOKEN and not INTERNAL_TOKEN:
        raise RuntimeError(
            "REQUIRE_INTERNAL_AUTH is on but INTERNAL_TOKEN is empty — "
            "the service would accept every caller."
        )

    # Only a local path can be "missing" in a way worth stopping for. A bare
    # size name ("small") or a Hub id ("tarteel-ai/whisper-base-ar-quran") is
    # downloaded by faster-whisper on demand, and both of those contain a slash
    # or none at all — so the test is whether it points into the filesystem,
    # not whether it merely looks like it.
    looks_local = Path(WHISPER_MODEL).is_absolute() or WHISPER_MODEL.startswith((".", os.sep))
    if looks_local and not Path(WHISPER_MODEL).is_dir():
        raise RuntimeError(
            f"Whisper model not found at {WHISPER_MODEL}.\n"
            "Build it once with:  make whisper-model"
        )

    log.info(
        "Loading Whisper model: model=%s device=%s compute=%s beam=%d threads=%s",
        WHISPER_MODEL, DEVICE, COMPUTE_TYPE, BEAM_SIZE, CPU_THREADS or "auto",
    )
    t0 = time.perf_counter()
    _model = WhisperModel(
        WHISPER_MODEL,
        device=DEVICE,
        compute_type=COMPUTE_TYPE,
        cpu_threads=CPU_THREADS,
    )
    log.info("Whisper model loaded in %.2fs", time.perf_counter() - t0)
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
    return {"status": "ok", "model": Path(WHISPER_MODEL).name, "device": DEVICE}


def _check_internal_token(supplied: str) -> None:
    """Reject anything that is not the API. Constant-time, so a wrong token
    leaks nothing about how wrong it was."""
    if not REQUIRE_TOKEN:
        return
    if not INTERNAL_TOKEN or not hmac.compare_digest(supplied or "", INTERNAL_TOKEN):
        raise HTTPException(status_code=401, detail="unauthorized")


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    initial_prompt: str = Form(""),
    x_internal_token: str = Header(default=""),
):
    """
    Transcribe an Arabic audio file.

    Requires the X-Internal-Token header when REQUIRE_INTERNAL_AUTH is on.

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
    _check_internal_token(x_internal_token)
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
        async with _transcribe_slot:
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
