import { useState } from "react";
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import type { ContentRegistry, Lesson } from "../types";
import SchemaForm from "./SchemaForm";
import ComponentPicker from "./ComponentPicker";
import LessonPreview from "./LessonPreview";
import { ComponentIcon } from "../lib/componentIcons";
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
    <div className="space-y-4">
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
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 text-white/50 hover:text-white hover:border-white/30 text-sm font-semibold"
      >
        <PlusIcon className="w-5 h-5" /> Add a step
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
  const [advanced, setAdvanced] = useState(false);
  const lessonTypes = registry.enums.lesson_types ?? [];

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Step {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUpIcon className="w-4 h-4" />
          </IconBtn>
          <IconBtn disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDownIcon className="w-4 h-4" />
          </IconBtn>
          <IconBtn onClick={onRemove} danger>
            <TrashIcon className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>

      {/* Step type: gallery when choosing, compact chip once chosen */}
      {changing || !schema ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/50">
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
        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
          <div className="icon-tile h-9 w-9 flex-shrink-0">
            <ComponentIcon name={lesson.component} className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white/90 truncate">
              {schema.label}
            </p>
            <p className="text-[11px] text-white/40 truncate">
              {schema.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setChanging(true)}
            className="shrink-0 flex items-center gap-1 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-lg px-2 py-1"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" /> Change
          </button>
        </div>
      )}

      {schema && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: content fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Labeled label="Title (shown to learner)">
                <input
                  className="input-field text-sm"
                  value={lesson.title}
                  onChange={(e) => onPatch({ title: e.target.value })}
                />
              </Labeled>
              <Labeled label="Subtitle / hint">
                <input
                  className="input-field text-sm"
                  value={lesson.description}
                  onChange={(e) => onPatch({ description: e.target.value })}
                />
              </Labeled>
            </div>

            <div className="border-t border-white/10 pt-3">
              <SchemaForm
                schema={schema}
                value={lesson.data ?? {}}
                onChange={(data) => onPatch({ data })}
              />
            </div>

            {/* Advanced (auto-managed; rarely needed) */}
            <div className="border-t border-white/5 pt-2">
              <button
                type="button"
                onClick={() => setAdvanced((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60"
              >
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition ${advanced ? "rotate-180" : ""}`}
                />
                Advanced (auto-set)
              </button>
              {advanced && (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <Labeled label="Category">
                    <select
                      className="input-field text-sm"
                      value={lesson.type}
                      onChange={(e) => onPatch({ type: e.target.value })}
                    >
                      {lessonTypes.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Labeled>
                  <Labeled label="Screen type (auto)">
                    <input
                      className="input-field text-sm opacity-60"
                      value={lesson.screen_type}
                      readOnly
                    />
                  </Labeled>
                </div>
              )}
            </div>
          </div>

          {/* Right: live preview */}
          <div className="lg:sticky lg:top-4 self-start">
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

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-lg disabled:opacity-20 ${
        danger
          ? "hover:bg-red-500/20 text-red-400"
          : "hover:bg-white/10 text-white/40"
      }`}
    >
      {children}
    </button>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
