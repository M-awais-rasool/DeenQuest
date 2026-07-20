import { useState } from "react";
import {
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import type { ContentRegistry, Lesson } from "../types";
import SchemaForm from "./SchemaForm";
import ComponentPicker from "./ComponentPicker";
import LessonPreview from "./LessonPreview";
import { ComponentGlyph } from "../lib/componentIcons";
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
    const cur = lessons[i];
    const patch: Partial<Lesson> = { component: name };
    // Everything technical is derived from the chosen component, so the admin
    // never has to understand "screen type" or "lesson type".
    if (schema?.screen_type) patch.screen_type = schema.screen_type;
    if (schema?.lesson_types?.length) patch.type = schema.lesson_types[0];
    if (!cur.title.trim() && schema) patch.title = schema.label;
    if (!cur.data || Object.keys(cur.data).length === 0) {
      patch.data = structuredClone(schema?.example ?? {});
    }
    update(i, patch);
  };

  return (
    <div>
      {lessons.map((lesson, i) => (
        <LessonCard
          key={i}
          index={i}
          total={lessons.length}
          lesson={lesson}
          registry={registry}
          onPatch={(patch) => update(i, patch)}
          onPick={(name) => pickComponent(i, name)}
          onMove={(dir) => move(i, dir)}
          onRemove={() => onChange(lessons.filter((_, idx) => idx !== i))}
        />
      ))}

      <button
        type="button"
        onClick={() => onChange([...lessons, emptyLesson()])}
        className="dq-add mt-3.5"
      >
        + Add a step
      </button>
    </div>
  );
}

function LessonCard({
  index,
  total,
  lesson,
  registry,
  onPatch,
  onPick,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  lesson: Lesson;
  registry: ContentRegistry;
  onPatch: (patch: Partial<Lesson>) => void;
  onPick: (name: string) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const schema = findSchema(registry.lesson_components, lesson.component);
  const [changing, setChanging] = useState(!lesson.component);
  const lessonTypes = registry.enums.lesson_types ?? [];

  return (
    <div className="dq-inset mb-3.5 p-4">
      {/* Card header */}
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="text-[10px] font-extrabold tracking-[0.12em] text-fg-faint">
          STEP {index + 1}
        </span>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            className="dq-icon-btn-sm"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            title="Move up"
          >
            <ArrowUpIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="dq-icon-btn-sm"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            title="Move down"
          >
            <ArrowDownIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="dq-icon-btn-sm dq-icon-btn-danger"
            onClick={onRemove}
            title="Remove step"
          >
            <TrashIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Step type: gallery when choosing, compact chip once chosen */}
      {changing || !schema ? (
        <div>
          <p className="mb-2.5 text-xs font-extrabold text-fg-dim">
            What kind of step is this?
          </p>
          <ComponentPicker
            schemas={registry.lesson_components}
            value={lesson.component}
            onPick={(name) => {
              onPick(name);
              setChanging(false);
            }}
          />
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-3 rounded-field border border-teal-edge bg-teal/[0.06] px-3.5 py-[11px]">
          <span className="grid h-[34px] w-[34px] flex-shrink-0 place-items-center rounded-[10px] bg-teal-tint">
            <ComponentGlyph name={lesson.component} emoji={schema.icon} size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-extrabold text-fg">
              {schema.label}
            </div>
            <div className="truncate text-[11.5px] font-semibold text-fg-dimmer">
              {schema.description}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setChanging(true)}
            className="flex flex-shrink-0 items-center gap-1 text-xs font-extrabold text-teal-light transition-colors hover:text-teal"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> Change
          </button>
        </div>
      )}

      {schema && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_300px]">
          {/* Left: content fields */}
          <div className="min-w-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-fg-dim">
                  Title (shown to learner)
                </label>
                <input
                  className="dq-input-sm"
                  value={lesson.title}
                  onChange={(e) => onPatch({ title: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-fg-dim">
                  Subtitle / hint
                </label>
                <input
                  className="dq-input-sm"
                  value={lesson.description}
                  onChange={(e) => onPatch({ description: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4">
              <SchemaForm
                schema={schema}
                value={lesson.data ?? {}}
                onChange={(data) => onPatch({ data })}
              />
            </div>

            {/* Advanced (auto-managed; rarely needed) */}
            <details className="mt-2.5">
              <summary className="cursor-pointer select-none text-xs font-extrabold text-fg-dimmer transition-colors hover:text-fg-dim">
                ▸ Advanced (auto-set)
              </summary>
              <div className="mt-2.5 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-fg-dim">
                    Category
                  </label>
                  <select
                    className="dq-input-sm"
                    value={lesson.type}
                    onChange={(e) => onPatch({ type: e.target.value })}
                  >
                    {lessonTypes.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-fg-dim">
                    Screen type (auto)
                  </label>
                  <input
                    className="dq-input-sm"
                    value={lesson.screen_type}
                    readOnly
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Right: live preview */}
          <div className="self-start xl:sticky xl:top-[90px]">
            <LessonPreview
              kind="lesson"
              name={lesson.component}
              data={lesson.data ?? {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
