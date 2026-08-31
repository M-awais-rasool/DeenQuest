# whisper.cpp transcription service (candidate)

This is **not** the deployed transcriber. `whisper-service/` still is. This
directory exists so the two can be measured against each other, and swapped
only if the measurement says it is safe.

## Why consider the swap

Memory, not speed. The production box has 4 GB and roughly 3.2 GB is already
committed. `whisper-service/` — uvicorn, FastAPI, faster-whisper, CTranslate2 —
peaks at 660 MiB resident against this one's 373 MiB, measured over the
same 58 clips. Neither MongoDB's
WiredTiger cache nor Redis can take their planned increase until that memory
comes back, which is documented in `deploy/compose.prod.yml`.

whisper.cpp is a single static binary running the same weights, so the saving
is about 290 MB of that.

Throughput does **not** improve. Both engines decode one clip at a time on two
shared vCPUs, which is the ceiling the API's own recitation queue is built
around (`internal/recitation/application/jobs.go`). Nothing here lifts it.

## The gate

The swap is blocked on one question: does whisper.cpp change what learners see?

Word error rate alone cannot answer it. The app never shows a transcript — it
shows a score from `domain.CompareRecitation`, which already forgives the
spelling drift between Uthmani and imla'i script and punishes real mistakes. A
transcriber can lose a point of WER at no cost to anyone, or gain one while
turning clean recitations into failures.

So `cmd/whisperbench` reports WER and CER *and* the score, and gates on the
score:

- **reject** if any clip that used to pass (≥ 60) now fails,
- **reject** if the candidate fails to transcribe clips the baseline handled,
- **reject** if the mean score drops by more than the allowed margin.

```bash
make whisper-bench
```

### The clip set

The gate is only as good as what it runs on, and no clip set is committed here
— recordings of identifiable people are not something to check into a repo.
Build one locally:

- 50–100 clips minimum, or the per-clip pass/fail check has nothing to catch.
- Real recordings from real phones — the same m4a/3gp the app uploads, at the
  same length. Studio audio of a fluent reciter will make both engines look
  perfect and tell you nothing.
- Beginners included, and deliberately imperfect attempts. The scores that
  matter most are the ones near the pass line, because that is where a small
  transcription difference changes the outcome.
- Reference text copied from the same source the lesson grades against, with
  its diacritics intact.

`bench/clips.example.jsonl` shows the format.

## Open decision: the internal token

`whisper-service/` requires `X-Internal-Token` on every call, because it is an
unauthenticated FastAPI app parsing untrusted audio and the token is the only
thing standing between it and anything else that lands on the `data` network.

`whisper-server` has no equivalent. The API still sends the header; whisper.cpp
ignores it. Swapping engines therefore drops that control and leaves the
internal-only Docker network as the sole one — the same network whose whole
point is that it has no route in and no route out.

That may well be an acceptable trade for ~290 MB. It is not one to make by
accident, so the API logs a warning at startup whenever `WHISPER_ENGINE` is
`whisper-cpp`, and this note stays here until the decision is written down in
`docs/VULTR_PRODUCTION_ARCHITECTURE.md`.

## Status

Written, not yet built or run. The Dockerfile and `convert-model.sh` have not
been executed — no Docker daemon was available when they were written — so
treat the whisper.cpp version pin, the ffmpeg library versions and the
converter's output filename as things to confirm on the first build.
