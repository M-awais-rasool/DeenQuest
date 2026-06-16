import { CheckIcon } from "@heroicons/react/24/solid";
import type { ContentSchema } from "../types";
import { ComponentIcon } from "../lib/componentIcons";

/**
 * A visual gallery for choosing a component. The admin sees a friendly icon,
 * name and one-line description for each — never an internal class name.
 */
export default function ComponentPicker({
  schemas,
  value,
  onPick,
  columns = 2,
}: {
  schemas: ContentSchema[];
  value: string;
  onPick: (name: string) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {schemas.map((s) => {
        const active = s.name === value;
        return (
          <button
            key={s.name}
            type="button"
            onClick={() => onPick(s.name)}
            className={`group relative flex gap-3 p-3 text-left ${
              active
                ? "rounded-2xl border border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/40"
                : "card-interactive"
            }`}
          >
            <div
              className={`icon-tile h-10 w-10 flex-shrink-0 ${
                active ? "" : "opacity-90 group-hover:opacity-100"
              }`}
            >
              <ComponentIcon name={s.name} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white/90">
                {s.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-white/45 line-clamp-2">
                {s.description}
              </p>
            </div>
            {active && (
              <span className="absolute right-2.5 top-2.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-[#0f1410]">
                <CheckIcon className="h-3 w-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
