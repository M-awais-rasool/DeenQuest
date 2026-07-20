import { useEffect, useState } from "react";
import api from "../lib/api";
import type { Theme } from "../types";
import toast from "react-hot-toast";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [bg, setBg] = useState("#0F3D2E");
  const [card, setCard] = useState("#145A42");
  const [text, setText] = useState("#FFFFFF");
  const [accent, setAccent] = useState("#FFD700");
  const [icon, setIcon] = useState("");

  const fetchThemes = () => {
    api
      .get("/admin/themes")
      .then((r) => setThemes(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchThemes, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    api
      .post("/admin/themes", {
        name,
        style: {
          background: bg,
          card_color: card,
          text_color: text,
          accent_color: accent,
        },
        icon,
      })
      .then(() => {
        toast.success("Theme created");
        setShowForm(false);
        setName("");
        fetchThemes();
      })
      .catch(() => toast.error("Failed to create theme"));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this theme?")) return;
    api
      .delete(`/admin/themes/${id}`)
      .then(() => {
        toast.success("Deleted");
        fetchThemes();
      })
      .catch(() => toast.error("Failed"));
  };

  return (
    <div>
      <PageHeader
        title="Themes"
        flag="NOT WIRED"
        subtitle="Visual themes for seasonal content"
        action={
          <button onClick={() => setShowForm(!showForm)} className="dq-btn">
            <PlusIcon className="h-[17px] w-[17px]" strokeWidth={2.6} />
            New Theme
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleCreate} className="dq-card mt-5 p-[22px]">
          <div className="dq-eyebrow mb-4">New theme</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="dq-label">Name</label>
              <input
                className="dq-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Ramadan Night"
              />
            </div>
            <div>
              <label className="dq-label">Icon emoji</label>
              <input
                className="dq-input"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🌙"
              />
            </div>
            <ColorField label="Background" value={bg} onChange={setBg} />
            <ColorField label="Card" value={card} onChange={setCard} />
            <ColorField label="Text" value={text} onChange={setText} />
            <ColorField label="Accent" value={accent} onChange={setAccent} />
          </div>

          {/* Live swatch strip */}
          <div className="mt-5 flex items-center gap-2.5">
            <span className="text-xs font-extrabold text-fg-dim">Preview</span>
            {[bg, card, text, accent].map((c, i) => (
              <span
                key={i}
                className="h-7 w-7 rounded-lg border border-white/[0.14]"
                style={{ background: c }}
              />
            ))}
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="dq-btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" className="dq-btn">
              Create Theme
            </button>
          </div>
        </form>
      )}

      <div className="mt-[18px]">
        <DataTable
          columns={[
            {
              key: "name",
              label: "Name",
              render: (t: Theme) => (
                <span className="text-[13.5px] font-extrabold text-fg">
                  {t.name}
                </span>
              ),
            },
            {
              key: "colors",
              label: "Colors",
              render: (t: Theme) => (
                <div className="flex gap-2">
                  {Object.values(t.style ?? {})
                    .filter((v) => typeof v === "string" && v.startsWith("#"))
                    .map((c, i) => (
                      <span
                        key={i}
                        className="h-6 w-6 rounded-md border border-white/[0.14]"
                        style={{ background: c as string }}
                      />
                    ))}
                </div>
              ),
            },
            {
              key: "icon",
              label: "Icon",
              render: (t: Theme) => (
                <span className="text-lg leading-none">{t.icon || "—"}</span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              align: "right" as const,
              render: (t: Theme) => (
                <button
                  onClick={() => handleDelete(t.id)}
                  className="dq-icon-btn dq-icon-btn-danger"
                  title="Delete"
                >
                  <TrashIcon className="h-[15px] w-[15px]" strokeWidth={2.2} />
                </button>
              ),
            },
          ]}
          data={themes}
          loading={loading}
          emptyMessage="No themes yet."
        />
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="dq-label">{label}</label>
      <div className="flex gap-2.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[46px] w-[46px] flex-shrink-0 rounded-[9px]"
        />
        <input
          className="dq-input font-mono text-[13px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
