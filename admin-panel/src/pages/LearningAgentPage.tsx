import { useEffect, useMemo, useState } from "react";
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
import { PageLoader, PageMessage } from "../components/PageHeader";
import { Donut, DonutLegend, Gauge, type DonutSlice } from "../components/Charts";

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
  { key: "improving", label: "Improving", color: "#5EE0CE" },
  { key: "active", label: "Active", color: "#2CC9B5" },
  { key: "weak", label: "Weak", color: "#F0838C" },
  { key: "inactive", label: "Inactive", color: "#EFB65A" },
];

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

  const slices: DonutSlice[] = useMemo(
    () =>
      SEGMENTS.map((seg) => ({
        label: seg.label,
        value: s?.segments?.[seg.key] ?? 0,
        color: seg.color,
      })),
    [s],
  );
  const hasSegments = slices.some((x) => x.value > 0);

  if (loading) return <PageLoader />;

  if (error || !s) {
    return (
      <PageMessage>
        Failed to load agent stats. Is the API running and your account on the
        admin allowlist?
      </PageMessage>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-teal-tint text-teal-light">
          <CpuChipIcon className="h-6 w-6" strokeWidth={2.1} />
        </span>
        <div className="flex-1">
          <h1 className="text-[22px] font-black text-fg">Learning Agent</h1>
          <p className="text-[13px] font-semibold text-fg-dimmer">
            Real-time view of the adaptive learning engine
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-[20px] border border-teal-edge bg-teal-tint px-3.5 py-1.5">
          <span className="dq-live-dot" />
          <span className="text-[11px] font-black tracking-wide text-teal-light">
            LIVE
          </span>
        </span>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-[18px] lg:grid-cols-4">
        <Stat
          icon={<UsersIcon className="h-5 w-5" strokeWidth={2.1} />}
          label="Learners tracked"
          value={s.total_learners}
          tint="#123B34"
          color="#5EE0CE"
        />
        <Stat
          icon={<SparklesIcon className="h-5 w-5" strokeWidth={2.1} />}
          label="Active recommendations"
          value={s.active_recommendations}
          tint="#2A2212"
          color="#EFB65A"
        />
        <Stat
          icon={<ArrowPathIcon className="h-5 w-5" strokeWidth={2.1} />}
          label="Revisions due now"
          value={s.due_revisions}
          tint="#2A1218"
          color="#F0838C"
        />
        <Stat
          icon={<BoltIcon className="h-5 w-5" strokeWidth={2.1} />}
          label="Events processed"
          value={s.total_events}
          tint="rgba(167,139,250,.14)"
          color="#A78BFA"
        />
      </div>

      {/* Segments + gauges */}
      <div className="mt-[18px] grid gap-[18px] lg:grid-cols-3">
        <div className="dq-card p-5">
          <p className="dq-eyebrow mb-4">Learner segments</p>
          {hasSegments ? (
            <div className="flex items-center gap-5">
              <div className="flex-shrink-0">
                <Donut slices={slices} size={128} />
              </div>
              <div className="min-w-0 flex-1">
                <DonutLegend slices={slices} />
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-sm font-semibold text-fg-faint">
              No learner data yet.
            </p>
          )}
        </div>

        <Gauge
          icon={<ArrowTrendingUpIcon className="h-5 w-5" strokeWidth={2.1} />}
          label="Avg engagement"
          pct={Math.round((s.avg_engagement || 0) * 100)}
          color="#2CC9B5"
        />
        <Gauge
          icon={<ExclamationTriangleIcon className="h-5 w-5" strokeWidth={2.1} />}
          label="Avg dropout risk"
          pct={Math.round((s.avg_dropout_risk || 0) * 100)}
          color="#EFB65A"
        />
      </div>

      {/* Workflow diagram */}
      <div className="dq-card mt-[18px] p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="dq-eyebrow">How it works · event pipeline</p>
          <span className="text-[11px] font-semibold text-fg-faint">
            deterministic core · optional AI
          </span>
        </div>
        <WorkflowDiagram
          learners={s.total_learners}
          recs={s.active_recommendations}
        />
      </div>

      {/* Curriculum insights */}
      <div className="mt-[18px] grid gap-[18px] lg:grid-cols-2">
        <div className="dq-card p-5">
          <p className="dq-eyebrow">Hardest skills</p>
          <p className="mb-4 mt-1 text-[11px] font-semibold text-fg-faint">
            Where learners are weakest right now
          </p>
          {cur?.top_weak_skills?.length ? (
            <div className="space-y-3.5">
              {cur.top_weak_skills.map((sk) => {
                const pct = Math.round((sk.avg_mastery || 0) * 100);
                return (
                  <div key={sk.tag} className="flex items-center gap-3">
                    <div className="grid h-9 min-w-[36px] place-items-center rounded-[10px] border border-ink-500 bg-ink-700 px-2 text-[13px] font-extrabold text-fg">
                      {sk.tag.startsWith("level:") ? `L${sk.tag.slice(6)}` : sk.tag}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1.5 flex justify-between text-[11px] font-bold">
                        <span className="text-fg-dimmer">
                          {sk.weak_learners} weak / {sk.learners}
                        </span>
                        <span className="text-fg-dim">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background:
                              pct < 50 ? "#F0838C" : pct < 80 ? "#EFB65A" : "#2CC9B5",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm font-semibold text-fg-faint">
              No skill data yet.
            </p>
          )}
        </div>

        <div className="dq-card p-5">
          <p className="dq-eyebrow">Most-missed lessons</p>
          <p className="mb-4 mt-1 text-[11px] font-semibold text-fg-faint">
            Where learners fail the most
          </p>
          {cur?.top_missed_lessons?.length ? (
            <div className="space-y-2.5">
              {cur.top_missed_lessons.map((l, i) => (
                <div
                  key={`${l.level_id}-${l.lesson_index}-${i}`}
                  className="flex items-center justify-between rounded-[10px] border border-ink-500 bg-ink-700 px-3.5 py-2.5"
                >
                  <span className="text-[13px] font-bold text-fg">
                    Level {l.level_id} · Lesson {l.lesson_index + 1}
                  </span>
                  <span className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="text-rose">{l.mistakes} misses</span>
                    <span className="text-fg-faint">{l.learners} learners</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm font-semibold text-fg-faint">
              No mistakes recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tint,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: string;
  color: string;
}) {
  return (
    <div className="dq-card p-[18px]">
      <span
        className="grid h-9 w-9 place-items-center rounded-[10px]"
        style={{ background: tint, color }}
      >
        {icon}
      </span>
      <p className="mt-3 text-[26px] font-black leading-none text-fg">
        {value.toLocaleString()}
      </p>
      <p className="mt-1.5 text-[11px] font-bold text-fg-dim">{label}</p>
    </div>
  );
}

/* ── Workflow diagram (static SVG — clean, no per-frame animation) ── */

const C = { blue: "#6E96F0", violet: "#A78BFA", teal: "#2CC9B5", gold: "#EFB65A" };

type N = {
  x: number;
  y: number;
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
    state: { x: 376, y: 96, accent: C.teal, title: "StateUpdater", sub: "consumer" },
    states: {
      x: 556,
      y: 96,
      accent: C.gold,
      title: "learner_states",
      sub: "MongoDB",
      big: learners,
    },
    rec: { x: 736, y: 96, accent: C.teal, title: "Recommender", sub: "rules · SM-2" },
    recs: {
      x: 916,
      y: 96,
      accent: C.gold,
      title: "recommendations",
      sub: "MongoDB",
      big: recs,
    },
    ai: { x: 196, y: 206, accent: C.violet, title: "Gemini AI", sub: "optional" },
    sweep: { x: 736, y: 206, accent: C.teal, title: "Pattern Sweep", sub: "cron · 15m" },
  };

  const right = (n: N) => ({ x: n.x + NW, y: cy(n) });
  const left = (n: N) => ({ x: n.x, y: cy(n) });

  return (
    <div className="overflow-x-auto pb-1">
      <svg
        viewBox="0 0 1082 300"
        className="min-w-[920px]"
        role="img"
        aria-label="Event pipeline: app to Kafka to consumers to MongoDB and back to the app"
      >
        <defs>
          <marker id="wa" markerWidth="8" markerHeight="8" refX="6.5" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="rgba(255,255,255,0.4)" />
          </marker>
          <marker id="wv" markerWidth="8" markerHeight="8" refX="6.5" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="rgba(167,139,250,0.7)" />
          </marker>
          <marker id="wb" markerWidth="8" markerHeight="8" refX="6.5" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="rgba(110,150,240,0.65)" />
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
            <line
              key={`${a}${b}`}
              x1={r.x}
              y1={r.y}
              x2={l.x - 3}
              y2={l.y}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.6"
              markerEnd="url(#wa)"
            />
          );
        })}

        {/* Kafka -> Gemini AI */}
        <line
          x1={nodes.kafka.x + NW / 2}
          y1={nodes.kafka.y + NH}
          x2={nodes.ai.x + NW / 2}
          y2={nodes.ai.y - 3}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.6"
          markerEnd="url(#wa)"
        />
        {/* Gemini AI -> learner_states (motivation, dashed) */}
        <path
          d={`M${nodes.ai.x + NW},${cy(nodes.ai)} C${nodes.ai.x + NW + 120},${cy(nodes.ai)} ${nodes.states.x - 40},${nodes.states.y + NH + 6} ${nodes.states.x + NW / 2 - 8},${nodes.states.y + NH + 3}`}
          fill="none"
          stroke="rgba(167,139,250,0.55)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          markerEnd="url(#wv)"
        />
        {/* Pattern Sweep -> Recommender */}
        <line
          x1={nodes.sweep.x + NW / 2}
          y1={nodes.sweep.y - 3}
          x2={nodes.rec.x + NW / 2}
          y2={nodes.rec.y + NH}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.6"
          markerEnd="url(#wa)"
        />

        {/* feedback: recommendations -> app (served), along the bottom */}
        <path
          d={`M${nodes.recs.x + NW / 2},${nodes.recs.y + NH} C${nodes.recs.x + NW / 2},285 ${nodes.recs.x},285 540,285 C140,285 ${nodes.app.x + NW / 2},285 ${nodes.app.x + NW / 2},${nodes.app.y + NH + 3}`}
          fill="none"
          stroke="rgba(110,150,240,0.45)"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          markerEnd="url(#wb)"
        />
        <text
          x="540"
          y="280"
          textAnchor="middle"
          fill="#6E96F0"
          fontSize="11"
          fontWeight="800"
          fontFamily="Nunito, sans-serif"
        >
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
  // Nodes carrying a live count stack three lines; the rest sit centred on two.
  const hasBig = n.big !== undefined;
  const titleY = hasBig ? n.y + 22 : n.y + 29;
  const subY = hasBig ? n.y + 37 : n.y + 45;

  return (
    <g>
      <rect
        x={n.x}
        y={n.y}
        width={w}
        height={h}
        rx="14"
        fill="#0C181B"
        stroke="#1E3238"
      />
      <rect x={n.x} y={n.y + 12} width="4" height={h - 24} rx="2" fill={n.accent} />
      <circle cx={n.x + 22} cy={titleY - 4} r="4.5" fill={n.accent} opacity="0.9" />
      <text
        x={n.x + 36}
        y={titleY}
        fill="#EDF5F4"
        fontSize="13"
        fontWeight="800"
        fontFamily="Nunito, sans-serif"
      >
        {n.title}
      </text>
      <text
        x={n.x + 18}
        y={subY}
        fill="#5F7E7C"
        fontSize="10.5"
        fontWeight="600"
        fontFamily="Nunito, sans-serif"
      >
        {n.sub}
      </text>
      {hasBig && (
        <text
          x={n.x + 18}
          y={n.y + 55}
          fill={n.accent}
          fontSize="15"
          fontWeight="900"
          fontFamily="Nunito, sans-serif"
        >
          {n.big!.toLocaleString()}
        </text>
      )}
    </g>
  );
}
