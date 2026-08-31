# Load test

Turns the scaling plan's estimates into measurements.

```bash
brew install k6                       # or: https://k6.io/docs/get-started/installation/
k6 run -e BASE_URL=https://staging.example.com -e TOKEN="$ACCESS_TOKEN" loadtest.js
```

`TOKEN` is a normal user access token. Without one every request is a 401 and
the run measures the auth middleware rather than the app.

## What it does

Drives a session the way a person does — roughly nine reads per write, with
pauses between taps — ramping to 500 virtual users over nine minutes. 500 VUs
is not 500 people: the sleeps mean each VU stands in for several real users
with the app open, so this is the shape of the 10k-concurrent target.

The hold at peak is deliberate: it keeps load on while the five-minute
notification cron fires, which is where the old build fell over.

## Thresholds

The run fails if it misses what the plan committed to:

| | Target |
|---|---|
| Read p95 | < 200 ms |
| Write p95 | < 400 ms |
| Recitation submit p95 | < 600 ms |
| Failed requests | < 0.5% |
| 429s | < 0.1% |

The 429 threshold is the one worth watching. Rate limits are keyed per user
now; any meaningful number of 429s means something is still keyed by an
address that thousands of real users share.

The recitation threshold measures something different from the rest. Submitting
a clip no longer waits for it to be transcribed — it is parked on a queue and
answered with a job id — so this number should stay flat however deep the queue
gets. If it climbs with load, transcription has found its way back onto the
request path.

Recitations refused with a 429 because the queue is full are counted separately
as `recite shed` and are **not** failures: shedding work the box cannot reach
within a useful time is the designed behaviour. A shed rate climbing toward
100% under load is a capacity finding, not a bug — it means the transcriber
needs more slots, and no amount of API tuning will change it.

## Read it with Grafana open

Passing thresholds alone do not mean there is headroom. Alongside the run:

- **MongoDB CPU under 60%.** Latency inside target with the database pinned
  means the next bottleneck is one release away.
- **Redis hit rate above 80%.** Lower means invalidation is firing more than it
  should and the cache is not earning its place.
- **Queue depth flat.** A climbing challenge queue means scoring is falling
  behind and jobs are about to be shed.
- **Recitation queue depth.** Unlike the others this one is *expected* to fill
  under load — one clip decodes at a time. What matters is that it drains
  between bursts and that submit latency does not follow it up.

## Before running against production

It writes: the lesson-completion path awards real XP to whoever `TOKEN`
belongs to. Use a throwaway account, or staging.
