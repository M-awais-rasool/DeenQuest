import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../lib/api";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { DifficultyBadge, TagBadge } from "../components/Badges";
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
    {
      key: "id",
      label: "ID",
      render: (l: Level) => (
        <span className="font-bold text-fg-dim">{l.id}</span>
      ),
    },
    {
      key: "title",
      label: "Title",
      render: (l: Level) => (
        <button
          onClick={() => navigate(`/levels/${l.id}`)}
          className="dq-table-link"
        >
          {l.title || "(untitled)"}
        </button>
      ),
    },
    {
      key: "course_level",
      label: "Course #",
      render: (l: Level) => (
        <span className="font-bold text-fg-dim">{l.course_level}</span>
      ),
    },
    {
      key: "difficulty",
      label: "Difficulty",
      render: (l: Level) => <DifficultyBadge difficulty={l.difficulty} />,
    },
    {
      key: "lessons",
      label: "Lessons",
      render: (l: Level) => (
        <span className="font-bold text-fg-dim">{l.lessons?.length ?? 0}</span>
      ),
    },
    {
      key: "xp_reward",
      label: "XP",
      render: (l: Level) => (
        <span className="text-[13px] font-black text-gold">{l.xp_reward}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right" as const,
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
          className="dq-table-link"
        >
          {t.title || "(untitled)"}
        </button>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (t: DailyTask) => <TagBadge label={t.category} />,
    },
    {
      key: "difficulty",
      label: "Difficulty",
      render: (t: DailyTask) => <DifficultyBadge difficulty={t.difficulty} />,
    },
    {
      key: "blocks",
      label: "Blocks",
      render: (t: DailyTask) => (
        <span className="font-bold text-fg-dim">{t.blocks?.length ?? 0}</span>
      ),
    },
    {
      key: "reward_xp",
      label: "XP",
      render: (t: DailyTask) => (
        <span className="text-[13px] font-black text-gold">{t.reward_xp}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right" as const,
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
    <div>
      <PageHeader
        title={isLevel ? "Levels" : "Daily Tasks"}
        subtitle={
          isLevel
            ? "The learning path the app reads"
            : "Habit items the app shows each day"
        }
        action={
          <button
            onClick={() => navigate(isLevel ? "/levels/new" : "/tasks/new")}
            className="dq-btn"
          >
            <PlusIcon className="h-[17px] w-[17px]" strokeWidth={2.6} />
            New {isLevel ? "Level" : "Task"}
          </button>
        }
      />

      {/* Search */}
      <div className="mt-5 flex max-w-sm items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-[15px] py-[11px]">
        <MagnifyingGlassIcon
          className="h-4 w-4 flex-shrink-0 text-fg-dimmer"
          strokeWidth={2.2}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title…"
          className="w-full bg-transparent text-[13px] font-semibold text-fg placeholder-fg-faint focus:outline-none"
        />
      </div>

      <div className="mt-[18px]">
        {isLevel ? (
          <DataTable
            columns={levelColumns}
            data={levelData}
            loading={loading}
            emptyMessage="No levels yet — create your first one."
          />
        ) : (
          <DataTable
            columns={taskColumns}
            data={taskData}
            loading={loading}
            emptyMessage="No tasks yet — create your first one."
          />
        )}
      </div>
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
    <div className="flex justify-end gap-2">
      <button onClick={onEdit} className="dq-icon-btn" title="Edit">
        <PencilIcon className="h-[15px] w-[15px]" strokeWidth={2.2} />
      </button>
      <button
        onClick={onDelete}
        className="dq-icon-btn dq-icon-btn-danger"
        title="Delete"
      >
        <TrashIcon className="h-[15px] w-[15px]" strokeWidth={2.2} />
      </button>
    </div>
  );
}
