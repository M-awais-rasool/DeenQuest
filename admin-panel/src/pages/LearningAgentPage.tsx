import { useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  UsersIcon,
  SparklesIcon,
  ArrowPathIcon,
  BoltIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import api from "../lib/api";

ChartJS.register(ArcElement, Tooltip, Legend);

type AgentStats = {
  total_learners: number;
  segments: Record<string, number>;
  active_recommendations: number;
  due_revisions: number;
  avg_engagement: number;
  avg_dropout_risk: number;
  total_events: number;
};

type SkillStruggle = {
  tag: string;
  learners: number;
  weak_learners: number;
  avg_mastery: number;
};
type LessonStruggle = {
  level_id: number;
  lesson_index: number;
  mistakes: number;
  learners: number;
};
type Curriculum = {
  top_weak_skills: SkillStruggle[] | null;
  top_missed_lessons: LessonStruggle[] | null;
};

const SEGMENTS: { key: string; label: string; color: string }[] = [
  { key: "improving", label: "Improving", color: "#34d399" },
  { key: "active", label: "Active", color: "#10b981" },
  { key: "weak", label: "Weak", color: "#fb7185" },
  { key: "inactive", label: "Inactive", color: "#f59e0b" },
];

// Solid (no backdrop-blur) card — keeps this data-heavy page smooth to scroll.
const CARD = "rounded-2xl border border-white/10 bg-white/[0.04]";

export default function LearningAgentPage() {
  const [s, setS] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cur, setCur] = useState<Curriculum | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      api
        .get("/v1/admin/learning/stats")
        .then((r) => {
          if (!alive) return;
          setS(r.data.data);
          setError(false);
        })
        .catch(() => alive && setError(true))
        .finally(() => alive && setLoading(false));
      api
        .get("/v1/admin/learning/curriculum")
        .then((r) => alive && setCur(r.data.data))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 30000); // light refresh; no heavy animation
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const segData = useMemo(
    () => SEGMENTS.map((seg) => s?.segments?.[seg.key] ?? 0),
    [s],
  );
  const hasSegments = segData.some((n) => n > 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }
  if (error || !s) {
    return (
      <div className={`${CARD} p-12 text-center text-white/50`}>
        Failed to load agent stats. Is the API running and your account on the
        admin allowlist?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
            <CpuChipIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Learning Agent</h1>
            <p className="text-sm text-white/45">
              Real-time view of the adaptive learning engine
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">Live</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={UsersIcon} label="Learners tracked" value={s.total_learners} accent="emerald" />
        <Stat icon={SparklesIcon} label="Active recommendations" value={s.active_recommendations} accent="gold" />
        <Stat icon={ArrowPathIcon} label="Revisions due now" value={s.due_revisions} accent="rose" />
        <Stat icon={BoltIcon} label="Events processed" value={s.total_events} accent="violet" />
      </div>

      {/* Segments + gauges */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${CARD} p-5`}>
          <p className="section-title mb-4">Learner segments</p>
          {hasSegments ? (
            <div className="flex items-center gap-5">
              <div className="h-32 w-32 shrink-0">
                <Doughnut
                  data={{
                    labels: SEGMENTS.map((x) => x.label),
                    datasets: [
                      {
                        data: segData,
                        backgroundColor: SEGMENTS.map((x) => x.color),
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    cutout: "68%",
                    animation: false,
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
              <div className="flex-1 space-y-2">
                {SEGMENTS.map((seg, i) => (
                  <div key={seg.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
                      <span className="text-white/70">{seg.label}</span>
                    </span>
                    <span className="font-semibold text-white">{segData[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-white/35">No learner data yet.</p>
          )}
        </div>

        <Gauge icon={ArrowTrendingUpIcon} label="Avg engagement" pct={Math.round((s.avg_engagement || 0) * 100)} color="#10b981" />
        <Gauge icon={ExclamationTriangleIcon} label="Avg dropout risk" pct={Math.round((s.avg_dropout_risk || 0) * 100)} color="#f59e0b" />
      </div>

      {/* Workflow diagram */}
      <div className={`${CARD} p-5`}>
        <div className="mb-3 flex items-center justify-between">
          <p className="section-title">How it works · event pipeline</p>
          <span className="text-xs text-white/35">deterministic core · optional AI</span>
        </div>
        <WorkflowDiagram learners={s.total_learners} recs={s.active_recommendations} />
      </div>

      {/* Curriculum Agent insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${CARD} p-5`}>
          <p className="section-title mb-1">Hardest skills</p>
          <p className="mb-4 text-xs text-white/35">Where learners are weakest right now</p>
          {cur?.top_weak_skills?.length ? (
            <div className="space-y-3">
              {cur.top_weak_skills.map((sk) => {
                const pct = Math.round((sk.avg_mastery || 0) * 100);
                return (
                  <div key={sk.tag} className="flex items-center gap-3">
                    <div className="grid h-9 min-w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] px-2 text-base text-white">
                      {sk.tag.startsWith("level:") ? `L${sk.tag.slice(6)}` : sk.tag}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-white/50">{sk.weak_learners} weak / {sk.learners}</span>
                        <span className="text-white/70">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: pct < 50 ? "#fb7185" : pct < 80 ? "#f59e0b" : "#10b981" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-white/35">No skill data yet.</p>
          )}
        </div>

        <div className={`${CARD} p-5`}>
          <p className="section-title mb-1">Most-missed lessons</p>
          <p className="mb-4 text-xs text-white/35">Where learners fail the most</p>
          {cur?.top_missed_lessons?.length ? (
            <div className="space-y-2">
              {cur.top_missed_lessons.map((l, i) => (
                <div
                  key={`${l.level_id}-${l.lesson_index}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="text-sm text-white/80">
                    Level {l.level_id} · Lesson {l.lesson_index + 1}
                  </span>
                  <span className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-rose-300">{l.mistakes} misses</span>
                    <span className="text-white/40">{l.learners} learners</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-white/35">No mistakes recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: number;
  accent: "emerald" | "gold" | "rose" | "violet";
}) {
  const ring: Record<string, string> = {
    emerald: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    gold: "text-gold-300 bg-gold-500/10 border-gold-500/20",
    rose: "text-rose-300 bg-rose-500/10 border-rose-500/20",
    violet: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  };
  return (
    <div className={`${CARD} p-4`}>
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg border ${ring[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-white/45">{label}</p>
    </div>
  );
}

function Gauge({
  icon: Icon,
  label,
  pct,
  color,
}: {
  icon: typeof UsersIcon;
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className={`${CARD} flex flex-col justify-between p-5`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-white/50" />
        <p className="section-title">{label}</p>
      </div>
      <p className="my-3 text-4xl font-bold text-white">{pct}%</p>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Workflow diagram (static SVG — clean, no per-frame animation) ── */

const C = { blue: "#60a5fa", violet: "#a78bfa", emerald: "#34d399", gold: "#fbbf24" };

type N = {
  x: number;
  y: number;
  w?: number;
  accent: string;
  title: string;
  sub: string;
  big?: number;
};

function WorkflowDiagram({ learners, recs }: { learners: number; recs: number }) {
  const NW = 150;
  const NH = 64;
  const cy = (n: N) => n.y + NH / 2;

  const nodes: Record<string, N> = {
    app: { x: 16, y: 96, accent: C.blue, title: "App", sub: "DeenQuest" },
    kafka: { x: 196, y: 96, accent: C.violet, title: "Kafka", sub: "learning.events" },
    state: { x: 376, y: 96, accent: C.emerald, title: "StateUpdater", sub: "consumer" },
    states: { x: 556, y: 96, accent: C.gold, title: "learner_states", sub: "MongoDB", big: learners },
    rec: { x: 736, y: 96, accent: C.emerald, title: "Recommender", sub: "rules · SM-2" },
    recs: { x: 916, y: 96, accent: C.gold, title: "recommendations", sub: "MongoDB", big: recs },
    ai: { x: 196, y: 206, accent: C.violet, title: "Gemini AI", sub: "optional" },
    sweep: { x: 736, y: 206, accent: C.emerald, title: "Pattern Sweep", sub: "cron · 15m" },
  };

  const right = (n: N) => ({ x: n.x + NW, y: cy(n) });
  const left = (n: N) => ({ x: n.x, y: cy(n) });

  return (
    <div className="overflow-x-auto pb-1">
      <svg viewBox="0 0 1082 300" className="min-w-[920px]" role="img"
        aria-label="Event pipeline: app to Kafka to consumers to MongoDB and back to the app">
        <defs>
          <marker id="wa" markerWidth="8" markerHeight="8" refX="6.5" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="rgba(255,255,255,0.45)" />
          </marker>
          <marker id="wv" markerWidth="8" markerHeight="8" refX="6.5" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="rgba(167,139,250,0.65)" />
          </marker>
          <marker id="wb" markerWidth="8" markerHeight="8" refX="6.5" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="rgba(96,165,250,0.6)" />
          </marker>
        </defs>

        {/* spine arrows */}
        {[
          ["app", "kafka"],
          ["kafka", "state"],
          ["state", "states"],
          ["states", "rec"],
          ["rec", "recs"],
        ].map(([a, b]) => {
          const r = right(nodes[a]);
          const l = left(nodes[b]);
          return (
            <line key={`${a}${b}`} x1={r.x} y1={r.y} x2={l.x - 3} y2={l.y}
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.6" markerEnd="url(#wa)" />
          );
        })}

        {/* Kafka -> Gemini AI */}
        <line x1={nodes.kafka.x + NW / 2} y1={nodes.kafka.y + NH} x2={nodes.ai.x + NW / 2} y2={nodes.ai.y - 3}
          stroke="rgba(255,255,255,0.2)" strokeWidth="1.6" markerEnd="url(#wa)" />
        {/* Gemini AI -> learner_states (motivation, dashed) */}
        <path d={`M${nodes.ai.x + NW},${cy(nodes.ai)} C${nodes.ai.x + NW + 120},${cy(nodes.ai)} ${nodes.states.x - 40},${nodes.states.y + NH + 6} ${nodes.states.x + NW / 2 - 8},${nodes.states.y + NH + 3}`}
          fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#wv)" />
        {/* Pattern Sweep -> Recommender */}
        <line x1={nodes.sweep.x + NW / 2} y1={nodes.sweep.y - 3} x2={nodes.rec.x + NW / 2} y2={nodes.rec.y + NH}
          stroke="rgba(255,255,255,0.2)" strokeWidth="1.6" markerEnd="url(#wa)" />

        {/* feedback: recommendations -> app (served), along the bottom */}
        <path d={`M${nodes.recs.x + NW / 2},${nodes.recs.y + NH} C${nodes.recs.x + NW / 2},285 ${nodes.recs.x},285 540,285 C140,285 ${nodes.app.x + NW / 2},285 ${nodes.app.x + NW / 2},${nodes.app.y + NH + 3}`}
          fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" strokeDasharray="5 5" markerEnd="url(#wb)" />
        <text x="540" y="280" textAnchor="middle" fill="rgba(96,165,250,0.85)" fontSize="11" fontWeight="600">
          served to the learner&apos;s app
        </text>

        {Object.values(nodes).map((n, i) => (
          <Node key={i} n={n} w={NW} h={NH} />
        ))}
      </svg>
    </div>
  );
}

function Node({ n, w, h }: { n: N; w: number; h: number }) {
  return (
    <g>
      <rect x={n.x} y={n.y} width={w} height={h} rx="14" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" />
      <rect x={n.x} y={n.y + 12} width="4" height={h - 24} rx="2" fill={n.accent} />
      <circle cx={n.x + 22} cy={n.y + 25} r="4.5" fill={n.accent} opacity="0.9" />
      <text x={n.x + 36} y={n.y + 29} fill="#fff" fontSize="13.5" fontWeight="700">{n.title}</text>
      <text x={n.x + 18} y={n.y + 49} fill="rgba(255,255,255,0.45)" fontSize="10.5">{n.sub}</text>
      {n.big !== undefined && (
        <text x={n.x + w - 14} y={n.y + 30} textAnchor="end" fill={n.accent} fontSize="18" fontWeight="800">
          {n.big.toLocaleString()}
        </text>
      )}
    </g>
  );
}
