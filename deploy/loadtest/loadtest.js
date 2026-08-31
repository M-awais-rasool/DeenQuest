// Load test for the DeenQuest API.
//
// The scaling work was justified with estimates. This is what turns them into
// numbers: it drives the endpoints a real session actually hits, in roughly the
// proportion a real session hits them, and fails the run if the thresholds the
// plan committed to are missed.
//
//   k6 run -e BASE_URL=https://api.example.com -e TOKEN=<jwt> loadtest.js
//
// Run it against staging, or against production only when you are willing to
// have written the XP it awards. TOKEN must be a valid access token; without
// one every request is a 401 and the run measures nothing but the rate limiter.
//
// Stages ramp to 500 virtual users. That is not 500 concurrent people — a
// person reads for a few seconds between taps, and the sleeps below model that,
// so 500 VUs stands in for several thousand users with the app open.

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:8080';
const TOKEN = __ENV.TOKEN || '';

const readLatency = new Trend('read_latency', true);
const writeLatency = new Trend('write_latency', true);
const rateLimited = new Rate('rate_limited');

const reciteSubmitLatency = new Trend('recite_submit_latency', true);
const reciteShed = new Rate('recite_shed');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // warm the caches; a cold start is not the thing under test
    { duration: '2m', target: 200 },
    { duration: '3m', target: 500 },  // the target load
    { duration: '2m', target: 500 },  // hold, so the cron ticks land inside the run
    { duration: '1m', target: 0 },
  ],

  // These are the numbers the plan promised. A run that misses them is a
  // failed run, not a report to interpret.
  thresholds: {
    'read_latency': ['p(95)<200'],
    'write_latency': ['p(95)<400'],
    'recite_submit_latency': ['p(95)<600'],
    'http_req_failed': ['rate<0.005'],
    // Real users sharing a carrier NAT address must never be throttled. Any
    // 429 at this level means the limiter is still keyed by something shared.
    'rate_limited': ['rate<0.001'],
  },
};

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

const CLIP = new Uint8Array(256).fill(0x41).buffer;

function track(res, trend, name) {
  trend.add(res.timings.duration);
  rateLimited.add(res.status === 429);
  check(res, {
    [`${name} did not fail`]: (r) => r.status >= 200 && r.status < 300,
  });
  return res;
}

export default function () {
  // A session is mostly reading. The ratio below — roughly nine reads per
  // write — is what makes the cache hit rate meaningful; hammering the write
  // path alone would measure a workload nobody has.
  group('open the app', () => {
    track(http.get(`${BASE}/api/v1/progress/me`, { headers }), readLatency, 'progress');
    track(http.get(`${BASE}/api/v1/today`, { headers }), readLatency, 'today');
    sleep(Math.random() * 3 + 1);
  });

  group('browse the path', () => {
    track(http.get(`${BASE}/api/v1/levels`, { headers }), readLatency, 'levels');
    sleep(Math.random() * 4 + 2);
  });

  group('check standing', () => {
    track(http.get(`${BASE}/api/v1/leaderboard?limit=100`, { headers }), readLatency, 'leaderboard');
    track(http.get(`${BASE}/api/v1/challenges`, { headers }), readLatency, 'challenges');
    sleep(Math.random() * 3 + 1);
  });

  // One in ten iterations completes something. This is the path that used to
  // cost ten to twenty database round trips.
  if (Math.random() < 0.1) {
    group('complete a lesson', () => {
      const res = http.post(
        `${BASE}/api/v1/levels/1/lessons/complete`,
        JSON.stringify({ lesson_index: 0 }),
        { headers },
      );
      track(res, writeLatency, 'lesson complete');
      sleep(2);
    });
  }

  if (Math.random() < 0.05) {
    group('submit a recitation', () => {
      const res = http.post(`${BASE}/api/v1/recitation/check`, {
        level_id: '1',
        lesson_index: '0',
        audio: http.file(CLIP, 'loadtest.m4a', 'audio/m4a'),
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        responseCallback: http.expectedStatuses(202, 429),
      });

      reciteSubmitLatency.add(res.timings.duration);

      reciteShed.add(res.status === 429);
      check(res, {
        'recitation was accepted or deliberately shed': (r) =>
          r.status === 202 || r.status === 429,
      });

      if (res.status === 202) {
        const jobId = res.json('data.job_id');
        sleep(1);
        track(
          http.get(`${BASE}/api/v1/recitation/jobs/${jobId}`, { headers }),
          readLatency,
          'recitation poll',
        );
      }
      sleep(2);
    });
  }
}

export function handleSummary(data) {
  const p95 = (m) => (data.metrics[m] ? data.metrics[m].values['p(95)'].toFixed(0) : 'n/a');
  const rate = (m) => (data.metrics[m] ? (data.metrics[m].values.rate * 100).toFixed(2) : 'n/a');

  const lines = [
    '',
    'DeenQuest load test',
    '───────────────────',
    `reads  p95   ${p95('read_latency')} ms   (target < 200)`,
    `writes p95   ${p95('write_latency')} ms   (target < 400)`,
    `failed       ${rate('http_req_failed')} %   (target < 0.5)`,
    `429s         ${rate('rate_limited')} %   (target < 0.1)`,
    `recite p95   ${p95('recite_submit_latency')} ms   (target < 600)`,
    `recite shed  ${rate('recite_shed')} %   (queue full — expected under load)`,
    '',
    'Read alongside the Grafana dashboard: MongoDB CPU should stay under 60%',
    'and the Redis hit rate above 80% at this load. Latency inside target with',
    'the database pinned means the next bottleneck is already close.',
    '',
  ];

  return { stdout: lines.join('\n') };
}
