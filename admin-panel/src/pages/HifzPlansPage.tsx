import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../lib/api";
import PageHeader, { PageLoader, PageMessage } from "../components/PageHeader";
import DataTable from "../components/DataTable";
import type { HifzPlan, HifzPreview } from "../types";

function blankPlan(): HifzPlan {
  return {
    id: "",
    slug: "",
    title: "",
    subtitle: "",
    description: "",
    icon: "📖",
    accent: "#5EE0CE",
    order: 99,
    published: false,
    scope: { surah_ids: [] },
    segmentation: { mode: "auto", ayahs_per_portion: 4 },
    xp_per_portion: 45,
  };
}

export default function HifzPlansPage() {
  const [plans, setPlans] = useState<HifzPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HifzPlan | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fetchPlans = () => {
    setLoading(true);
    api
      .get("/v1/admin/hifz/plans")
      .then((r) => setPlans(r.data.data ?? []))
      .catch(() => toast.error("Failed to load hifz plans"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchPlans, []);

  const save = async (plan: HifzPlan) => {
    try {
      if (isNew) await api.post("/v1/admin/hifz/plans", plan);
      else await api.put(`/v1/admin/hifz/plans/${plan.id}`, plan);
      toast.success("Plan saved");
      setEditing(null);
      fetchPlans();
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to save plan");
    }
  };

  const togglePublished = async (plan: HifzPlan) => {
    try {
      await api.put(`/v1/admin/hifz/plans/${plan.id}`, {
        ...plan,
        published: !plan.published,
      });
      fetchPlans();
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const remove = (plan: HifzPlan) => {
    if (!confirm(`Delete "${plan.title}"? Learner progress on its portions stays, but the plan disappears.`)) {
      return;
    }
    api
      .delete(`/v1/admin/hifz/plans/${plan.id}`)
      .then(() => {
        toast.success("Plan deleted");
        fetchPlans();
      })
      .catch(() => toast.error("Failed to delete plan"));
  };

  if (editing) {
    return (
      <PlanEditor
        initial={editing}
        isNew={isNew}
        onCancel={() => setEditing(null)}
        onSave={save}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Hifz Plans"
        subtitle="Memorization programs — what learners can choose to commit to"
        action={
          <button
            onClick={() => {
              setIsNew(true);
              setEditing(blankPlan());
            }}
            className="dq-btn"
          >
            <PlusIcon className="h-[17px] w-[17px]" strokeWidth={2.6} />
            New Plan
          </button>
        }
      />

      <div className="mt-6">
        {loading ? (
          <PageLoader />
        ) : plans.length === 0 ? (
          <PageMessage>
            No plans yet. The built-in ones seed on backend boot — create one here
            to add your own.
          </PageMessage>
        ) : (
          <DataTable
            columns={[
              {
                key: "title",
                label: "Plan",
                render: (p: HifzPlan) => (
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: `${p.accent}22` }}
                    >
                      {p.icon}
                    </span>
                    <div>
                      <div className="font-extrabold text-fg">{p.title}</div>
                      <div className="text-xs font-semibold text-fg-faint">
                        {p.subtitle}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "scope",
                label: "Scope",
                render: (p: HifzPlan) => (
                  <span className="text-xs font-semibold text-fg-dimmer">
                    {p.scope.juz
                      ? `Juz ${p.scope.juz}`
                      : `${p.scope.surah_ids?.length ?? 0} surah(s)`}
                  </span>
                ),
              },
              {
                key: "segmentation",
                label: "Segmentation",
                render: (p: HifzPlan) => (
                  <span className="text-xs font-semibold text-fg-dimmer">
                    {p.segmentation.mode === "manual"
                      ? `${p.segmentation.ranges?.length ?? 0} manual ranges`
                      : `auto · ${p.segmentation.ayahs_per_portion} ayahs`}
                  </span>
                ),
              },
              {
                key: "published",
                label: "Live",
                render: (p: HifzPlan) => (
                  <button
                    onClick={() => togglePublished(p)}
                    className="dq-btn-ghost !px-2 !py-1"
                    title={p.published ? "Unpublish" : "Publish"}
                  >
                    {p.published ? (
                      <EyeIcon className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4 text-fg-faint" />
                    )}
                  </button>
                ),
              },
              {
                key: "actions",
                label: "",
                align: "right",
                render: (p: HifzPlan) => (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsNew(false);
                        setEditing(p);
                      }}
                      className="dq-btn-ghost !px-2 !py-1"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(p)}
                      className="dq-btn-ghost !px-2 !py-1 text-rose-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={plans}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Plan editor with a live portion preview.
 *
 * The preview is the point of this screen: auto-splitting a long surah every N
 * ayahs will happily cut a sentence in half, and the only way anyone catches
 * that is by seeing the real Arabic laid out in the boundaries it produces.
 */
function PlanEditor({
  initial,
  isNew,
  onCancel,
  onSave,
}: {
  initial: HifzPlan;
  isNew: boolean;
  onCancel: () => void;
  onSave: (plan: HifzPlan) => void;
}) {
  const [plan, setPlan] = useState<HifzPlan>(initial);
  const [preview, setPreview] = useState<HifzPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const set = <K extends keyof HifzPlan>(key: K, value: HifzPlan[K]) =>
    setPlan((p) => ({ ...p, [key]: value }));

  const runPreview = useCallback(async () => {
    setPreviewing(true);
    try {
      const res = await api.post("/v1/admin/hifz/plans/preview?with_text=6", plan);
      setPreview(res.data.data);
    } catch (e: any) {
      setPreview(null);
      toast.error(e?.response?.data?.error ?? "Could not build a preview");
    } finally {
      setPreviewing(false);
    }
  }, [plan]);

  // Debounce so typing a surah list doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasScope =
        (plan.scope.surah_ids?.length ?? 0) > 0 || (plan.scope.juz ?? 0) > 0;
      if (hasScope) runPreview();
    }, 600);
    return () => clearTimeout(timer);
  }, [
    plan.scope.surah_ids?.join(","),
    plan.scope.juz,
    plan.segmentation.mode,
    plan.segmentation.ayahs_per_portion,
    plan.segmentation.ranges?.length,
    runPreview,
  ]);

  const surahList = (plan.scope.surah_ids ?? []).join(", ");

  return (
    <div>
      <PageHeader
        title={isNew ? "New Hifz Plan" : plan.title || "Edit Plan"}
        subtitle="Scope and segmentation — preview updates as you type"
        action={
          <div className="flex gap-2">
            <button onClick={onCancel} className="dq-btn-ghost">
              <ArrowLeftIcon className="h-[17px] w-[17px]" strokeWidth={2.6} />
              Back
            </button>
            <button onClick={() => onSave(plan)} className="dq-btn">
              Save Plan
            </button>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        {/* ── Details ── */}
        <div className="dq-card space-y-4 p-5">
          <h3 className="text-sm font-black uppercase tracking-wide text-fg-faint">
            Details
          </h3>

          <div>
            <label className="dq-label">Title</label>
            <input
              className="dq-input"
              value={plan.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Juz 30, Backwards"
            />
          </div>

          <div>
            <label className="dq-label">Subtitle</label>
            <input
              className="dq-input"
              value={plan.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="An-Nas → An-Naba, shortest first"
            />
          </div>

          <div>
            <label className="dq-label">Description</label>
            <textarea
              className="dq-input min-h-[90px]"
              value={plan.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="dq-label">Icon</label>
              <input
                className="dq-input text-center text-lg"
                value={plan.icon}
                onChange={(e) => set("icon", e.target.value)}
                maxLength={4}
              />
            </div>
            <div>
              <label className="dq-label">Accent</label>
              <input
                className="dq-input"
                value={plan.accent}
                onChange={(e) => set("accent", e.target.value)}
                placeholder="#5EE0CE"
              />
            </div>
            <div>
              <label className="dq-label">Order</label>
              <input
                type="number"
                className="dq-input"
                value={plan.order}
                onChange={(e) => set("order", Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="dq-label">XP per portion</label>
              <input
                type="number"
                className="dq-input"
                value={plan.xp_per_portion}
                onChange={(e) => set("xp_per_portion", Number(e.target.value))}
              />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              checked={plan.published}
              onChange={(e) => set("published", e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            <span className="text-sm font-bold text-fg">
              Published — visible in the app's plan picker
            </span>
          </label>
        </div>

        {/* ── Scope + segmentation ── */}
        <div className="dq-card space-y-4 p-5">
          <h3 className="text-sm font-black uppercase tracking-wide text-fg-faint">
            Scope &amp; segmentation
          </h3>

          <div>
            <label className="dq-label">Surah IDs (comma separated)</label>
            <input
              className="dq-input"
              value={surahList}
              onChange={(e) =>
                set("scope", {
                  ...plan.scope,
                  surah_ids: e.target.value
                    .split(",")
                    .map((v) => Number(v.trim()))
                    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 114),
                })
              }
              placeholder="114, 113, 112"
            />
            <p className="mt-1 text-xs font-semibold text-fg-faint">
              Order matters — this is the order learners work through them.
            </p>
          </div>

          <div>
            <label className="dq-label">…or a whole Juz</label>
            <select
              className="dq-input"
              value={plan.scope.juz ?? 0}
              onChange={(e) =>
                set("scope", {
                  surah_ids: plan.scope.surah_ids,
                  juz: Number(e.target.value) || undefined,
                })
              }
            >
              <option value={0}>None (use surah list)</option>
              <option value={30}>Juz 30</option>
              <option value={29}>Juz 29</option>
            </select>
            <p className="mt-1 text-xs font-semibold text-fg-faint">
              A surah list always wins over a juz.
            </p>
          </div>

          <div>
            <label className="dq-label">Segmentation mode</label>
            <select
              className="dq-input"
              value={plan.segmentation.mode}
              onChange={(e) =>
                set("segmentation", {
                  ...plan.segmentation,
                  mode: e.target.value as "auto" | "manual",
                })
              }
            >
              <option value="auto">Auto — fixed runs of ayahs</option>
              <option value="manual">Manual — hand-authored ranges</option>
            </select>
          </div>

          {plan.segmentation.mode === "auto" ? (
            <div>
              <label className="dq-label">Ayahs per portion (fallback)</label>
              <input
                type="number"
                min={1}
                max={20}
                className="dq-input"
                value={plan.segmentation.ayahs_per_portion}
                onChange={(e) =>
                  set("segmentation", {
                    ...plan.segmentation,
                    ayahs_per_portion: Number(e.target.value),
                  })
                }
              />
              <p className="mt-1 text-xs font-semibold text-fg-faint">
                Frozen onto each learner when they enroll, so changing it later
                never re-cuts portions people have already memorized.
              </p>
            </div>
          ) : (
            <ManualRangeEditor
              plan={plan}
              onChange={(ranges) =>
                set("segmentation", { ...plan.segmentation, ranges })
              }
            />
          )}
        </div>
      </div>

      {/* ── Live preview ── */}
      <div className="dq-card mt-[18px] p-5">
        <div className="flex items-center gap-3">
          <h3 className="flex-1 text-sm font-black uppercase tracking-wide text-fg-faint">
            Portion preview
          </h3>
          {previewing && <div className="dq-spinner h-4 w-4" />}
          {preview && (
            <span className="text-xs font-bold text-fg-dimmer">
              {preview.portions.length} portions · {preview.total_ayahs} ayahs
            </span>
          )}
        </div>

        {preview?.warnings?.map((warning) => (
          <div
            key={warning}
            className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-300"
          >
            <ExclamationTriangleIcon className="mt-px h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </div>
        ))}

        {!preview ? (
          <p className="mt-4 text-sm font-semibold text-fg-faint">
            Set a scope above and the split appears here.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {preview.portions.slice(0, 40).map((portion) => (
              <div
                key={portion.id}
                className="rounded-xl border border-ink-500 bg-ink-700 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-ink-500 px-1.5 text-[11px] font-black text-fg-dimmer">
                    {portion.order_index + 1}
                  </span>
                  <span className="flex-1 text-sm font-extrabold text-fg">
                    {portion.label}
                  </span>
                  <span className="text-[11px] font-bold text-fg-faint">
                    {portion.ayah_count} ayah
                    {portion.ayah_count === 1 ? "" : "s"}
                  </span>
                </div>
                {portion.ayahs && portion.ayahs.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-ink-500 pt-2">
                    {portion.ayahs.map((text, i) => (
                      <p
                        key={i}
                        dir="rtl"
                        className="text-right text-lg leading-loose text-fg"
                      >
                        {text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {preview.portions.length > 40 && (
              <p className="pt-1 text-xs font-semibold text-fg-faint">
                …and {preview.portions.length - 40} more portions.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ManualRangeEditor({
  plan,
  onChange,
}: {
  plan: HifzPlan;
  onChange: (ranges: NonNullable<HifzPlan["segmentation"]["ranges"]>) => void;
}) {
  const ranges = plan.segmentation.ranges ?? [];

  const update = (idx: number, patch: Partial<(typeof ranges)[number]>) =>
    onChange(ranges.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  return (
    <div>
      <label className="dq-label">Manual ranges</label>
      <div className="space-y-2">
        {ranges.map((range, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="number"
              className="dq-input-sm w-16"
              value={range.surah_id}
              onChange={(e) => update(idx, { surah_id: Number(e.target.value) })}
              placeholder="Surah"
              title="Surah"
            />
            <input
              type="number"
              className="dq-input-sm w-16"
              value={range.ayah_start}
              onChange={(e) => update(idx, { ayah_start: Number(e.target.value) })}
              placeholder="From"
              title="First ayah"
            />
            <input
              type="number"
              className="dq-input-sm w-16"
              value={range.ayah_end}
              onChange={(e) => update(idx, { ayah_end: Number(e.target.value) })}
              placeholder="To"
              title="Last ayah"
            />
            <input
              className="dq-input-sm flex-1"
              value={range.label ?? ""}
              onChange={(e) => update(idx, { label: e.target.value })}
              placeholder="Label (optional)"
            />
            <button
              onClick={() => onChange(ranges.filter((_, i) => i !== idx))}
              className="dq-btn-ghost !px-2 !py-1 text-rose-400"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() =>
          onChange([
            ...ranges,
            {
              surah_id: plan.scope.surah_ids?.[0] ?? 1,
              ayah_start: 1,
              ayah_end: 3,
            },
          ])
        }
        className="dq-btn-outline mt-2 !py-1.5 text-xs"
      >
        <PlusIcon className="h-4 w-4" strokeWidth={2.6} />
        Add range
      </button>
      <p className="mt-2 text-xs font-semibold text-fg-faint">
        Manual ranges are never auto-resized — use them wherever the boundaries
        carry meaning.
      </p>
    </div>
  );
}
