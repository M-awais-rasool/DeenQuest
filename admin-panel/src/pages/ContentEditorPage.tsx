import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useRegistry, findSchema } from "../lib/useRegistry";
import SchemaForm from "../components/SchemaForm";
import LessonsEditor from "../components/LessonsEditor";
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

  if (loading || regLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(kind === "level" ? "/levels" : "/tasks")}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? "New" : "Edit"} {kind === "level" ? "Level" : "Task"}
            </h1>
            <p className="text-white/40 text-sm">
              {kind === "level"
                ? "Configure lessons and the end-of-level mini-game"
                : "Configure the task's blocks"}
            </p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/50 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function EnumSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: EnumOption[];
}) {
  return (
    <select
      className="input-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.icon ? `${o.icon} ` : ""}
          {o.label}
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
      <section className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Level details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              className="input-field"
              value={level.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
          <Field label="Theme">
            <input
              className="input-field"
              value={level.theme}
              onChange={(e) => set({ theme: e.target.value })}
            />
          </Field>
          <Field label="Goal">
            <input
              className="input-field"
              value={level.goal}
              onChange={(e) => set({ goal: e.target.value })}
            />
          </Field>
          <Field label="Unlock reward">
            <input
              className="input-field"
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
            />
          </Field>
          <Field label="XP reward">
            <input
              type="number"
              className="input-field"
              value={level.xp_reward}
              onChange={(e) => set({ xp_reward: Number(e.target.value) })}
            />
          </Field>
          <Field label="Course level (0 = auto)">
            <input
              type="number"
              className="input-field"
              value={level.course_level}
              onChange={(e) => set({ course_level: Number(e.target.value) })}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Lessons ({level.lessons.length})
        </h2>
        <LessonsEditor
          lessons={level.lessons}
          registry={registry}
          onChange={(lessons) => set({ lessons })}
        />
      </section>

      <section className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Mini-game
        </h2>
        <MiniGameEditor
          registry={registry}
          game={level.mini_game}
          onChange={(mini_game) => set({ mini_game })}
        />
      </section>
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Type">
          <select
            className="input-field"
            value={game.type}
            onChange={(e) => pickType(e.target.value)}
          >
            {registry.mini_games.map((g) => (
              <option key={g.name} value={g.name}>
                {g.icon} {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <input
            className="input-field"
            value={game.description}
            onChange={(e) => onChange({ ...game, description: e.target.value })}
          />
        </Field>
      </div>
      {schema && (
        <div className="border-t border-white/10 pt-4">
          <SchemaForm
            schema={schema}
            value={game.data ?? {}}
            onChange={(data) => onChange({ ...game, data })}
          />
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
      <section className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Task details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              className="input-field"
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
              className="input-field"
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
            />
          </Field>
          <Field label="Reward XP">
            <input
              type="number"
              className="input-field"
              value={task.reward_xp}
              onChange={(e) => set({ reward_xp: Number(e.target.value) })}
            />
          </Field>
          <Field label="Fixed (always included)">
            <label className="flex items-center gap-2 text-sm text-white/70 h-10">
              <input
                type="checkbox"
                className="w-4 h-4 accent-emerald-500"
                checked={task.is_fixed}
                onChange={(e) => set({ is_fixed: e.target.checked })}
              />
              {task.is_fixed ? "Yes" : "No"}
            </label>
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Blocks ({task.blocks.length})
        </h2>
        <BlockBuilder
          blocks={task.blocks}
          onChange={(blocks) => set({ blocks })}
        />
      </section>
    </>
  );
}
