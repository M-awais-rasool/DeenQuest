import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../lib/api";
import DataTable from "../components/DataTable";
import { DifficultyBadge } from "../components/Badges";
import type { ContentType, DailyTask, Level } from "../types";

interface Props {
  type: ContentType;
}

export default function ContentListPage({ type }: Props) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const isLevel = type === "level";
  const base = isLevel ? "/v1/admin/levels" : "/v1/admin/tasks";
  const label = isLevel ? "Levels" : "Tasks";

  const fetchContent = () => {
    setLoading(true);
    api
      .get(base)
      .then((res) => {
        const data = res.data.data ?? [];
        if (isLevel) setLevels(data);
        else setTasks(data);
      })
      .catch(() => toast.error(`Failed to load ${label.toLowerCase()}`))
      .finally(() => setLoading(false));
  };

  useEffect(fetchContent, [type]);

  const handleDelete = (id: string | number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    api
      .delete(`${base}/${id}`)
      .then(() => {
        toast.success("Deleted");
        fetchContent();
      })
      .catch(() => toast.error("Failed to delete"));
  };

  const matches = (s: string) =>
    !search || s.toLowerCase().includes(search.toLowerCase());

  const levelColumns = [
    { key: "id", label: "ID" },
    {
      key: "title",
      label: "Title",
      render: (l: Level) => (
        <button
          onClick={() => navigate(`/levels/${l.id}`)}
          className="text-emerald-400 hover:text-emerald-300 font-medium text-left"
        >
          {l.title || "(untitled)"}
        </button>
      ),
    },
    { key: "course_level", label: "Course #" },
    {
      key: "difficulty",
      label: "Difficulty",
      render: (l: Level) => <DifficultyBadge difficulty={l.difficulty as any} />,
    },
    {
      key: "lessons",
      label: "Lessons",
      render: (l: Level) => (
        <span className="text-white/60">{l.lessons?.length ?? 0}</span>
      ),
    },
    {
      key: "xp_reward",
      label: "XP",
      render: (l: Level) => (
        <span className="text-gold-400 font-semibold">{l.xp_reward}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (l: Level) => (
        <RowActions
          onEdit={() => navigate(`/levels/${l.id}`)}
          onDelete={() => handleDelete(l.id, l.title)}
        />
      ),
    },
  ];

  const taskColumns = [
    {
      key: "title",
      label: "Title",
      render: (t: DailyTask) => (
        <button
          onClick={() => navigate(`/tasks/${t.id}`)}
          className="text-emerald-400 hover:text-emerald-300 font-medium text-left"
        >
          {t.title || "(untitled)"}
        </button>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (t: DailyTask) => (
        <span className="badge bg-white/5 text-white/60">
          {t.category || "—"}
        </span>
      ),
    },
    {
      key: "difficulty",
      label: "Difficulty",
      render: (t: DailyTask) => (
        <DifficultyBadge difficulty={t.difficulty as any} />
      ),
    },
    {
      key: "blocks",
      label: "Blocks",
      render: (t: DailyTask) => (
        <span className="text-white/60">{t.blocks?.length ?? 0}</span>
      ),
    },
    {
      key: "reward_xp",
      label: "XP",
      render: (t: DailyTask) => (
        <span className="text-gold-400 font-semibold">{t.reward_xp}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (t: DailyTask) => (
        <RowActions
          onEdit={() => navigate(`/tasks/${t.id}`)}
          onDelete={() => handleDelete(t.id, t.title)}
        />
      ),
    },
  ];

  const levelData = levels.filter((l) => matches(l.title));
  const taskData = tasks.filter((t) => matches(t.title));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{label}</h1>
          <p className="text-white/40 text-sm mt-1">
            Manage the {label.toLowerCase()} the app reads
          </p>
        </div>
        <button
          onClick={() => navigate(isLevel ? "/levels/new" : "/tasks/new")}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" /> New {isLevel ? "Level" : "Task"}
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search ${label.toLowerCase()}...`}
        className="input-field text-sm max-w-sm"
      />

      {isLevel ? (
        <DataTable columns={levelColumns} data={levelData} loading={loading} />
      ) : (
        <DataTable columns={taskColumns} data={taskData} loading={loading} />
      )}
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onEdit}
        className="p-1.5 rounded-lg hover:bg-white/10 text-white/50"
        title="Edit"
      >
        <PencilSquareIcon className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
        title="Delete"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
