import type { ContentSchema } from "../types";
import { ComponentGlyph } from "../lib/componentIcons";

/**
 * A visual gallery for choosing a component. The admin sees a friendly glyph,
 * name and one-line description for each — never an internal class name.
 *
 * `layout="tile"` switches to the compact centred card used for mini-games.
 */
export default function ComponentPicker({
  schemas,
  value,
  onPick,
  columns = 2,
  layout = "row",
}: {
  schemas: ContentSchema[];
  value: string;
  onPick: (name: string) => void;
  columns?: number;
  layout?: "row" | "tile";
}) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {schemas.map((s) => {
        const active = s.name === value;

        const frame = active
          ? "border-teal bg-teal/[0.06]"
          : "border-ink-500 bg-ink-700 hover:border-ink-400";

        if (layout === "tile") {
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => onPick(s.name)}
              title={s.description}
              className={`relative flex flex-col items-center gap-2 rounded-xl border-[1.5px] px-2 py-4 transition-colors ${frame}`}
            >
              <ComponentGlyph name={s.name} emoji={s.icon} size={22} />
              <span
                className={`text-center text-[12.5px] font-extrabold ${
                  active ? "text-fg" : "text-fg-dim"
                }`}
              >
                {s.label}
              </span>
              {active && <Check />}
            </button>
          );
        }

        return (
          <button
            key={s.name}
            type="button"
            onClick={() => onPick(s.name)}
            className={`relative flex gap-3 rounded-xl border-[1.5px] p-[13px] text-left transition-colors ${frame}`}
          >
            <span
              className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-[10px]"
              style={{ background: "rgba(44,201,181,.1)" }}
            >
              <ComponentGlyph name={s.name} emoji={s.icon} size={18} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-extrabold text-fg">
                {s.label}
              </div>
              <div className="text-[11px] font-semibold leading-[1.4] text-fg-dimmer line-clamp-2">
                {s.description}
              </div>
            </div>
            {active && <Check />}
          </button>
        );
      })}
    </div>
  );
}

function Check() {
  return (
    <span className="absolute right-2 top-2 grid h-[19px] w-[19px] place-items-center rounded-full bg-teal text-[10px] font-black text-teal-ink">
      ✓
    </span>
  );
}
