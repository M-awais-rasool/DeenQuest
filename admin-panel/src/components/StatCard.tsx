import type { ReactNode } from "react";

export type StatAccent = "teal" | "gold" | "sky" | "violet";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  gradient: StatAccent;
}

/** Icon-tile gradient + the matching corner glow, per accent. */
const ACCENTS: Record<StatAccent, { tile: string; glow: string }> = {
  teal: {
    tile: "linear-gradient(145deg,#2CC9B5,#178F7E)",
    glow: "rgba(44,201,181,.22)",
  },
  gold: {
    tile: "linear-gradient(145deg,#EFB65A,#C98F35)",
    glow: "rgba(239,182,90,.20)",
  },
  sky: {
    tile: "linear-gradient(145deg,#6E96F0,#3F5FC0)",
    glow: "rgba(110,150,240,.20)",
  },
  violet: {
    tile: "linear-gradient(145deg,#A78BFA,#7857D6)",
    glow: "rgba(167,139,250,.20)",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
}: StatCardProps) {
  const accent = ACCENTS[gradient];

  return (
    <div className="dq-card relative overflow-hidden p-5">
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -bottom-8 -right-8 h-[120px] w-[120px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${accent.glow}, transparent 70%)`,
        }}
      />
      <div className="relative flex items-start justify-between">
        <span className="text-xs font-extrabold text-fg-dim">{title}</span>
        <span
          className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[13px] text-teal-ink"
          style={{ background: accent.tile }}
        >
          {icon}
        </span>
      </div>
      <p className="relative mt-3 text-[32px] font-black leading-none text-fg">
        {value}
      </p>
      {subtitle && (
        <p className="relative mt-1.5 text-[12.5px] font-bold text-teal-light">
          {subtitle}
        </p>
      )}
    </div>
  );
}
