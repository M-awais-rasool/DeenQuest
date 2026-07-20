import { useEffect, useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useRegistry, enumLabel } from "../lib/useRegistry";
import { RewardIcon, rarityColor } from "../lib/rewardIcons";
import PageHeader, { PageLoader, PageMessage } from "../components/PageHeader";
import type { EnumOption, Reward } from "../types";

function blankReward(): Reward {
  return {
    id: "",
    title: "",
    description: "",
    icon: "trophy",
    rarity: "rare",
    trigger: "levels_completed",
    required: 1,
    xp_bonus: 50,
    sort_order: 0,
  };
}

export default function RewardsPage() {
  const { registry } = useRegistry();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Reward | null>(null);

  const icons = registry.enums.reward_icons ?? [];
  const rarities = registry.enums.reward_rarities ?? [];
  const triggers = registry.enums.reward_triggers ?? [];

  const fetchRewards = () => {
    setLoading(true);
    api
      .get("/v1/admin/rewards")
      .then((r) => setRewards(r.data.data ?? []))
      .catch(() => toast.error("Failed to load rewards"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchRewards, []);

  const save = async (r: Reward, isNew: boolean) => {
    try {
      if (isNew) await api.post("/v1/admin/rewards", r);
      else await api.put(`/v1/admin/rewards/${r.id}`, r);
      toast.success("Saved!");
      setEditing(null);
      fetchRewards();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to save");
    }
  };

  const remove = (r: Reward) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    api
      .delete(`/v1/admin/rewards/${r.id}`)
      .then(() => {
        toast.success("Deleted");
        fetchRewards();
      })
      .catch(() => toast.error("Failed to delete"));
  };

  return (
    <div>
      <PageHeader
        title="Rewards"
        subtitle="Badges learners unlock as they grow"
        action={
          <button onClick={() => setEditing(blankReward())} className="dq-btn">
            <PlusIcon className="h-[17px] w-[17px]" strokeWidth={2.6} />
            New Reward
          </button>
        }
      />

      <div className="mt-6">
        {loading ? (
          <PageLoader />
        ) : rewards.length === 0 ? (
          <PageMessage>No rewards yet. Create your first one.</PageMessage>
        ) : (
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
            {rewards.map((r) => (
              <RewardCard
                key={r.id}
                reward={r}
                rarities={rarities}
                triggers={triggers}
                onEdit={() => setEditing(r)}
                onDelete={() => remove(r)}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <RewardForm
          initial={editing}
          icons={icons}
          rarities={rarities}
          triggers={triggers}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function RewardCard({
  reward,
  rarities,
  triggers,
  onEdit,
  onDelete,
}: {
  reward: Reward;
  rarities: EnumOption[];
  triggers: EnumOption[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = rarityColor(reward.rarity);
  return (
    <div className="dq-card p-5 transition-colors hover:border-white/[0.14]">
      <div className="flex items-start gap-3">
        <div
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[11px]"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}44` }}
        >
          <RewardIcon icon={reward.icon} className="h-5 w-5" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-fg">
            {reward.title || "(untitled)"}
          </p>
          <span
            className="dq-badge mt-1.5 !px-2.5 !py-0.5 !text-[10px]"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            {enumLabel(rarities, reward.rarity)}
          </span>
        </div>
        <div className="flex flex-shrink-0 gap-1.5">
          <button onClick={onEdit} className="dq-icon-btn-sm" title="Edit">
            <PencilIcon className="h-[14px] w-[14px]" strokeWidth={2.2} />
          </button>
          <button
            onClick={onDelete}
            className="dq-icon-btn-sm dq-icon-btn-danger"
            title="Delete"
          >
            <TrashIcon className="h-[14px] w-[14px]" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <p className="mt-3.5 line-clamp-2 text-xs font-semibold leading-relaxed text-fg-dimmer">
        {reward.description}
      </p>

      <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3.5">
        <span className="text-[11px] font-bold text-fg-dimmer">
          {enumLabel(triggers, reward.trigger)} ≥{" "}
          <span className="text-fg-dim">{reward.required}</span>
        </span>
        <span className="text-[11px] font-black text-gold">
          +{reward.xp_bonus} XP
        </span>
      </div>
    </div>
  );
}

function RewardForm({
  initial,
  icons,
  rarities,
  triggers,
  onClose,
  onSave,
}: {
  initial: Reward;
  icons: EnumOption[];
  rarities: EnumOption[];
  triggers: EnumOption[];
  onClose: () => void;
  onSave: (r: Reward, isNew: boolean) => void;
}) {
  const [r, setR] = useState<Reward>(initial);
  const isNew = !initial.id;
  const set = (patch: Partial<Reward>) => setR({ ...r, ...patch });
  const color = rarityColor(r.rarity);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="dq-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-[22px]"
        style={{ background: "#0B1517" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-fg">
            {isNew ? "New Reward" : "Edit Reward"}
          </h2>
          <button onClick={onClose} className="dq-icon-btn" title="Close">
            <XMarkIcon className="h-[18px] w-[18px]" strokeWidth={2.4} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Live badge preview */}
          <div className="dq-inset flex items-center gap-3 p-3.5">
            <div
              className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl"
              style={{
                backgroundColor: `${color}20`,
                border: `1px solid ${color}44`,
              }}
            >
              <RewardIcon icon={r.icon} className="h-6 w-6" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-fg">
                {r.title || "Untitled reward"}
              </p>
              <p className="text-[11px] font-semibold text-fg-dimmer">
                Live preview of the badge
              </p>
            </div>
          </div>

          <Field label="Title">
            <input
              className="dq-input"
              value={r.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="dq-input leading-relaxed"
              rows={2}
              value={r.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Icon">
              <Select
                value={r.icon}
                options={icons}
                onChange={(v) => set({ icon: v })}
              />
            </Field>
            <Field label="Rarity">
              <Select
                value={r.rarity}
                options={rarities}
                onChange={(v) => set({ rarity: v })}
              />
            </Field>
          </div>

          <Field label="Unlock condition">
            <Select
              value={r.trigger}
              options={triggers}
              onChange={(v) => set({ trigger: v })}
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Required">
              <input
                type="number"
                className="dq-input"
                value={r.required}
                onChange={(e) => set({ required: Number(e.target.value) })}
              />
            </Field>
            <Field label="XP bonus">
              <input
                type="number"
                className="dq-input"
                value={r.xp_bonus}
                onChange={(e) => set({ xp_bonus: Number(e.target.value) })}
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                className="dq-input"
                value={r.sort_order}
                onChange={(e) => set({ sort_order: Number(e.target.value) })}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="dq-btn-ghost">
            Cancel
          </button>
          <button onClick={() => onSave(r, isNew)} className="dq-btn">
            Save
          </button>
        </div>
      </div>
    </div>
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

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: EnumOption[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      className="dq-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
