/**
 * Lightweight SVG charts matching the design mock. They take the same data the
 * dashboard already fetches — no chart library, no runtime theming needed.
 */

// ── Line chart ────────────────────────────────────────────────

export interface Series {
  values: number[];
  stroke: string;
  fill: string;
}

const W = 520;
const H = 200;

/**
 * Multi-series area chart. Stretches to the card width
 * (`preserveAspectRatio="none"`), so the viewBox is a fixed grid.
 */
export function LineChart({ series }: { series: Series[] }) {
  const n = Math.max(...series.map((s) => s.values.length), 2);
  const max = Math.max(1, ...series.flatMap((s) => s.values)) * 1.15;

  const px = (i: number) => (i / (n - 1)) * W;
  const py = (v: number) => H - (v / max) * H;

  const line = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`)
      .join(" ");
  const area = (vals: number[]) => `${line(vals)} L${W} ${H} L0 ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      className="mt-4 overflow-visible"
    >
      {[50, 100, 150].map((y) => (
        <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="#16272B" strokeWidth="1" />
      ))}
      {series.map((s, i) =>
        s.values.length ? (
          <g key={i}>
            <path d={area(s.values)} fill={s.fill} stroke="none" />
            <path
              d={line(s.values)}
              fill="none"
              stroke={s.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ) : null,
      )}
    </svg>
  );
}

/** Coloured dot + label, used as the chart legend. */
export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold text-fg-dim">
      <span
        className="h-[9px] w-[9px] rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

// ── Donut ─────────────────────────────────────────────────────

const R = 46;
const CIRC = 2 * Math.PI * R;
const GAP = 3;

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/**
 * Ring chart with a small gap between slices. Slices are drawn as dash
 * segments on stacked circles, starting at 12 o'clock.
 */
export function Donut({ slices, size = 150 }: { slices: DonutSlice[]; size?: number }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={R} fill="none" stroke="#16272B" strokeWidth="16" />
      {total > 0 &&
        slices.map((s) => {
          const len = (s.value / total) * CIRC;
          const dash = `${Math.max(0, len - GAP).toFixed(1)} ${(CIRC - len + GAP).toFixed(1)}`;
          const el = (
            <circle
              key={s.label}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={dash}
              strokeDashoffset={(-offset).toFixed(1)}
              transform="rotate(-90 60 60)"
            />
          );
          offset += len;
          return el;
        })}
    </svg>
  );
}

/** Legend row beneath a donut: dot, label, right-aligned count. */
export function DonutLegend({ slices }: { slices: DonutSlice[] }) {
  return (
    <div className="mt-3.5 flex flex-col gap-[9px]">
      {slices.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-[9px] text-[13px] font-bold capitalize text-fg-dim"
        >
          <span
            className="h-[9px] w-[9px] rounded-full"
            style={{ backgroundColor: s.color }}
          />
          {s.label}
          <span className="ml-auto font-black text-fg">
            {s.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Horizontal bar list ───────────────────────────────────────

export interface BarRow {
  label: string;
  value: number;
}

/** Ranked rows with a proportional teal bar — replaces a bar chart. */
export function BarList({ rows }: { rows: BarRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="mt-4 flex flex-col gap-3.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span
            className="w-[130px] flex-shrink-0 truncate text-right text-[12.5px] font-bold text-fg-dim"
            title={r.label}
          >
            {r.label}
          </span>
          <div className="h-[22px] flex-1 overflow-hidden rounded-md bg-ink-700">
            <div
              className="h-full rounded-md"
              style={{
                width: `${Math.max(2, (r.value / max) * 100)}%`,
                background: "linear-gradient(90deg,#178F7E,#2CC9B5)",
              }}
            />
          </div>
          <span className="w-11 flex-shrink-0 text-[12px] font-black text-teal-light">
            {r.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Gauge ─────────────────────────────────────────────────────

/** Big percentage over a slim progress track (Learning Agent). */
export function Gauge({
  icon,
  label,
  pct,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="dq-card flex flex-col justify-between p-5">
      <div className="flex items-center gap-2 text-fg-dim">
        {icon}
        <span className="dq-eyebrow">{label}</span>
      </div>
      <p className="my-3 text-[40px] font-black leading-none text-fg">{pct}%</p>
      <div className="h-2 overflow-hidden rounded-full bg-ink-600">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
        />
      </div>
    </div>
  );
}
