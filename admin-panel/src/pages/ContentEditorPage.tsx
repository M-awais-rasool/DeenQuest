import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useRegistry, findSchema } from "../lib/useRegistry";
import { PageLoader } from "../components/PageHeader";
import SchemaForm from "../components/SchemaForm";
import LessonsEditor from "../components/LessonsEditor";
import ComponentPicker from "../components/ComponentPicker";
import LessonPreview from "../components/LessonPreview";
import BlockBuilder from "../components/BlockBuilder";
import type {
  ContentRegistry,
  DailyTask,
  EnumOption,
  Level,
  MiniGame,
} from "../types";

interface Props {
  kind: "level" | "task";
}

function blankLevel(): Level {
  return {
    id: 0,
    course_type: "qaida",
    course_level: 0,
    title: "",
    theme: "",
    goal: "",
    lessons: [],
    mini_game: { type: "mcq", description: "", data: {} },
    xp_reward: 50,
    unlock_reward: "",
    difficulty: "easy",
  };
}

function blankTask(): DailyTask {
  return {
    id: "",
    title: "",
    category: "learning",
    description: "",
    blocks: [],
    completion_type: "button",
    reward_xp: 10,
    difficulty: "easy",
    is_fixed: false,
  };
}

export default function ContentEditorPage({ kind }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { registry, loading: regLoading } = useRegistry();
  const isNew = !id;

  const [level, setLevel] = useState<Level>(blankLevel());
  const [task, setTask] = useState<DailyTask>(blankTask());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const url =
      kind === "level" ? `/v1/admin/levels/${id}` : `/v1/admin/tasks/${id}`;
    setLoading(true);
    api
      .get(url)
      .then((res) => {
        if (kind === "level") setLevel(res.data.data);
        else setTask(res.data.data);
      })
      .catch(() => toast.error("Failed to load content"))
      .finally(() => setLoading(false));
  }, [id, kind, isNew]);

  const save = async () => {
    setSaving(true);
    try {
      if (kind === "level") {
        if (isNew) await api.post("/v1/admin/levels", level);
        else await api.put(`/v1/admin/levels/${id}`, level);
      } else {
        if (isNew) await api.post("/v1/admin/tasks", task);
        else await api.put(`/v1/admin/tasks/${id}`, task);
      }
      toast.success("Saved!");
      navigate(kind === "level" ? "/levels" : "/tasks");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading || regLoading) return <PageLoader />;

  return (
    <div className="max-w-[1000px]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(kind === "level" ? "/levels" : "/tasks")}
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-field border border-white/[0.08] bg-white/[0.05] text-fg-dim transition-colors hover:bg-white/10 hover:text-fg"
          title="Back"
        >
          <ArrowLeftIcon className="h-[18px] w-[18px]" strokeWidth={2.4} />
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-black text-fg">
            {isNew ? "New" : "Edit"} {kind === "level" ? "Level" : "Task"}
          </h1>
          <p className="text-[13px] font-semibold text-fg-dimmer">
            {kind === "level"
              ? "Configure lessons and the end-of-level mini-game"
              : "Configure the blocks this task shows"}
          </p>
        </div>
        <button onClick={save} disabled={saving} className="dq-btn px-6">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {kind === "level" ? (
        <LevelEditor registry={registry} level={level} onChange={setLevel} />
      ) : (
        <TaskEditor registry={registry} task={task} onChange={setTask} />
      )}
    </div>
  );
}

// ─── Shared field helpers ───

function Section({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`dq-card p-[22px] ${className}`}>
      <div className={hint ? "mb-1.5" : "mb-4"}>
        <div className="dq-eyebrow">{title}</div>
      </div>
      {hint && (
        <p className="mb-4 text-[12.5px] font-semibold text-fg-dimmer">{hint}</p>
      )}
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="dq-label">{label}</label>
      {children}
    </div>
  );
}

/** Difficulty reads faster when the chosen value carries its own colour. */
const DIFFICULTY_TEXT: Record<string, string> = {
  easy: "#5EE0CE",
  medium: "#EFB65A",
  hard: "#F0838C",
};

function EnumSelect({
  value,
  onChange,
  options,
  tinted,
}: {
  value: string;
  onChange: (v: string) => void;
  options: EnumOption[];
  /** Colour the selected label by difficulty. */
  tinted?: boolean;
}) {
  return (
    <select
      className="dq-input"
      style={tinted ? { color: DIFFICULTY_TEXT[value] } : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.icon ? `${o.icon}  ${o.label}` : o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Level editor ───

function LevelEditor({
  registry,
  level,
  onChange,
}: {
  registry: ContentRegistry;
  level: Level;
  onChange: (l: Level) => void;
}) {
  const set = (patch: Partial<Level>) => onChange({ ...level, ...patch });

  return (
    <>
      <Section title="Level details" className="mt-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Title">
            <input
              className="dq-input"
              value={level.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
          <Field label="Theme">
            <input
              className="dq-input"
              value={level.theme}
              onChange={(e) => set({ theme: e.target.value })}
            />
          </Field>
          <Field label="Goal">
            <input
              className="dq-input"
              value={level.goal}
              onChange={(e) => set({ goal: e.target.value })}
            />
          </Field>
          <Field label="Unlock reward">
            <input
              className="dq-input"
              placeholder="badge:example"
              value={level.unlock_reward}
              onChange={(e) => set({ unlock_reward: e.target.value })}
            />
          </Field>
          <Field label="Course">
            <EnumSelect
              value={level.course_type}
              onChange={(v) => set({ course_type: v })}
              options={registry.enums.courses ?? []}
            />
          </Field>
          <Field label="Difficulty">
            <EnumSelect
              value={level.difficulty}
              onChange={(v) => set({ difficulty: v })}
              options={registry.enums.level_difficulties ?? []}
              tinted
            />
          </Field>
          <Field label="XP reward">
            <input
              type="number"
              className="dq-input"
              value={level.xp_reward}
              onChange={(e) => set({ xp_reward: Number(e.target.value) })}
            />
          </Field>
          <Field label="Course level (0 = auto)">
            <input
              type="number"
              className="dq-input"
              value={level.course_level}
              onChange={(e) => set({ course_level: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Section>

      <Section title={`Lessons (${level.lessons.length})`} className="mt-4">
        <LessonsEditor
          lessons={level.lessons}
          registry={registry}
          onChange={(lessons) => set({ lessons })}
        />
      </Section>

      <Section
        title="Mini-game"
        hint="Choose the game that ends this level"
        className="mt-4"
      >
        <MiniGameEditor
          registry={registry}
          game={level.mini_game}
          onChange={(mini_game) => set({ mini_game })}
        />
      </Section>
    </>
  );
}

function MiniGameEditor({
  registry,
  game,
  onChange,
}: {
  registry: ContentRegistry;
  game: MiniGame;
  onChange: (g: MiniGame) => void;
}) {
  const schema = findSchema(registry.mini_games, game.type);

  const pickType = (type: string) => {
    const next = findSchema(registry.mini_games, type);
    const patch: MiniGame = { ...game, type };
    if (!game.data || Object.keys(game.data).length === 0) {
      patch.data = structuredClone(next?.example ?? {});
    }
    onChange(patch);
  };

  return (
    <div>
      <ComponentPicker
        schemas={registry.mini_games}
        value={game.type}
        onPick={pickType}
        columns={3}
        layout="tile"
      />

      <div className="mt-4">
        <Field label="Description (shown above the game)">
          <input
            className="dq-input"
            value={game.description}
            onChange={(e) => onChange({ ...game, description: e.target.value })}
          />
        </Field>
      </div>

      {schema && (
        <div className="mt-4 grid grid-cols-1 gap-5 border-t border-ink-500 pt-4 xl:grid-cols-[1.2fr_300px]">
          <div className="min-w-0">
            <SchemaForm
              schema={schema}
              value={game.data ?? {}}
              onChange={(data) => onChange({ ...game, data })}
            />
          </div>
          <div className="self-start xl:sticky xl:top-[90px]">
            <LessonPreview
              kind="mini_game"
              name={game.type}
              data={game.data ?? {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task editor ───

function TaskEditor({
  registry,
  task,
  onChange,
}: {
  registry: ContentRegistry;
  task: DailyTask;
  onChange: (t: DailyTask) => void;
}) {
  const set = (patch: Partial<DailyTask>) => onChange({ ...task, ...patch });

  return (
    <>
      <Section title="Task details" className="mt-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Title">
            <input
              className="dq-input"
              value={task.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
          <Field label="Category">
            <EnumSelect
              value={task.category}
              onChange={(v) => set({ category: v })}
              options={registry.enums.task_categories ?? []}
            />
          </Field>
          <Field label="Description">
            <input
              className="dq-input"
              value={task.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>
          <Field label="Completion type">
            <EnumSelect
              value={task.completion_type}
              onChange={(v) => set({ completion_type: v })}
              options={registry.enums.completion_types ?? []}
            />
          </Field>
          <Field label="Difficulty">
            <EnumSelect
              value={task.difficulty}
              onChange={(v) => set({ difficulty: v })}
              options={registry.enums.task_difficulties ?? []}
              tinted
            />
          </Field>
          <Field label="Reward XP">
            <input
              type="number"
              className="dq-input"
              value={task.reward_xp}
              onChange={(e) => set({ reward_xp: Number(e.target.value) })}
            />
          </Field>
          <Field label="Fixed (always included)">
            <label className="flex h-[46px] cursor-pointer items-center gap-2.5 rounded-field border-[1.5px] border-ink-500 bg-ink-700 px-[15px] text-sm font-bold text-fg-dim">
              <input
                type="checkbox"
                className="h-4 w-4 accent-teal"
                checked={task.is_fixed}
                onChange={(e) => set({ is_fixed: e.target.checked })}
              />
              {task.is_fixed ? "Yes" : "No"}
            </label>
          </Field>
        </div>
      </Section>

      <Section title={`Blocks (${task.blocks.length})`} className="mt-4">
        <BlockBuilder
          blocks={task.blocks}
          onChange={(blocks) => set({ blocks })}
        />
      </Section>
    </>
  );
}
