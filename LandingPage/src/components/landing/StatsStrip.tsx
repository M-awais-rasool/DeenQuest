import { CountUp } from "./CountUp";

const stats = [
  { to: 2, decimals: 0, suffix: "M+", color: "text-teal", label: "LEARNERS WORLDWIDE" },
  { to: 180, decimals: 0, suffix: "M", color: "text-gold", label: "AYAHS RECITED" },
  { to: 94, decimals: 0, suffix: "%", color: "text-purple", label: "REACH FLUENCY FASTER" },
  { to: 4.9, decimals: 1, suffix: "★", color: "text-pink", label: "AVERAGE RATING" },
];

export function StatsStrip() {
  return (
    <div className="border-y border-line bg-ink2">
      <div className="stagger mx-auto flex max-w-[1180px] flex-wrap justify-between gap-[24px] px-8 py-[34px]">
        {stats.map((s) => (
          <div key={s.label} className="min-w-[150px] flex-1 text-center">
            <div className={`text-[34px] font-black ${s.color}`}>
              <CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} />
            </div>
            <div className="text-[12px] font-extrabold tracking-[0.1em] text-faint">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
