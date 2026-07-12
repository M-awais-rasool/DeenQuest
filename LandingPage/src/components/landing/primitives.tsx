import type { ReactNode } from "react";

/** Small uppercase, wide-tracked label above a section heading. */
export function Eyebrow({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`text-[13px] font-extrabold tracking-[0.22em] ${className}`}>{children}</div>
  );
}

/** A checklist row: rounded tinted icon tile + bold-lead sentence. */
export function IconRow({
  bgClass,
  colorClass,
  glyph,
  title,
  text,
}: {
  bgClass: string;
  colorClass: string;
  glyph: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-[13px]">
      <span
        className={`grid h-[40px] w-[40px] flex-none place-items-center rounded-[13px] font-serif text-[17px] ${bgClass} ${colorClass}`}
      >
        {glyph}
      </span>
      <span className="text-[15px] font-bold text-body2">
        <strong className="text-heading">{title}</strong>
        {text}
      </span>
    </div>
  );
}

/** A compact stat: big colored number + tiny uppercase caption. */
export function StatMini({
  colorClass,
  value,
  suffix,
  label,
}: {
  colorClass: string;
  value: string;
  suffix?: string;
  label: string;
}) {
  return (
    <div>
      <div className={`text-[26px] font-black ${colorClass}`}>
        {value}
        {suffix && <span className="text-[15px] text-body">{suffix}</span>}
      </div>
      <div className="text-[11px] font-extrabold tracking-[0.08em] text-faint">{label}</div>
    </div>
  );
}
