import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import type { ContentRegistry, Lesson } from "../types";
import SchemaForm from "./SchemaForm";
import { findSchema } from "../lib/useRegistry";

interface Props {
  lessons: Lesson[];
  registry: ContentRegistry;
  onChange: (lessons: Lesson[]) => void;
}

function emptyLesson(): Lesson {
  return {
    type: "qaida",
    title: "",
    description: "",
    screen_type: "ACTION",
    component: "",
    data: {},
  };
}

export default function LessonsEditor({ lessons, registry, onChange }: Props) {
  const update = (i: number, patch: Partial<Lesson>) =>
    onChange(lessons.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= lessons.length) return;
    const next = [...lessons];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const pickComponent = (i: number, name: string) => {
    const schema = findSchema(registry.lesson_components, name);
    const patch: Partial<Lesson> = { component: name };
    // Auto-fill sensible defaults from the schema so the admin isn't guessing.
    if (schema?.screen_type) patch.screen_type = schema.screen_type;
    if (schema?.lesson_types?.length) patch.type = schema.lesson_types[0];
    const cur = lessons[i];
    if (!cur.data || Object.keys(cur.data).length === 0) {
      patch.data = structuredClone(schema?.example ?? {});
    }
    update(i, patch);
  };

  const lessonTypes = registry.enums.lesson_types ?? [];
  const screenTypes = registry.enums.screen_types ?? [];

  return (
    <div className="space-y-4">
      {lessons.map((lesson, i) => {
        const schema = findSchema(registry.lesson_components, lesson.component);
        return (
          <div key={i} className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Lesson {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 disabled:opacity-20"
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === lessons.length - 1}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 disabled:opacity-20"
                >
                  <ArrowDownIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(lessons.filter((_, idx) => idx !== i))}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-white/50 mb-1">
                  Component
                </label>
                <select
                  className="input-field text-sm"
                  value={lesson.component}
                  onChange={(e) => pickComponent(i, e.target.value)}
                >
                  <option value="">Select a component…</option>
                  {registry.lesson_components.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.icon} {c.label} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">
                  Title
                </label>
                <input
                  className="input-field text-sm"
                  value={lesson.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">
                  Description
                </label>
                <input
                  className="input-field text-sm"
                  value={lesson.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">
                  Lesson type
                </label>
                <select
                  className="input-field text-sm"
                  value={lesson.type}
                  onChange={(e) => update(i, { type: e.target.value })}
                >
                  {lessonTypes.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.icon} {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">
                  Screen type
                </label>
                <select
                  className="input-field text-sm"
                  value={lesson.screen_type}
                  onChange={(e) => update(i, { screen_type: e.target.value })}
                >
                  {screenTypes.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.icon} {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {schema ? (
              <div className="border-t border-white/10 pt-3">
                <SchemaForm
                  schema={schema}
                  value={lesson.data ?? {}}
                  onChange={(data) => update(i, { data })}
                />
              </div>
            ) : lesson.component ? (
              <p className="text-xs text-yellow-400/80">
                Unknown component "{lesson.component}" — edit data as JSON below.
              </p>
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => onChange([...lessons, emptyLesson()])}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 text-white/50 hover:text-white hover:border-white/30 text-sm font-semibold"
      >
        <PlusIcon className="w-5 h-5" /> Add Lesson
      </button>
    </div>
  );
}
