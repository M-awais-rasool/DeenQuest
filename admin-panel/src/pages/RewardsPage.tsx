import { useEffect, useState } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useRegistry, enumLabel } from "../lib/useRegistry";
import { RewardIcon, rarityColor } from "../lib/rewardIcons";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rewards</h1>
          <p className="mt-1 text-sm text-white/40">
            Achievements users unlock as they progress
          </p>
        </div>
        <button
          onClick={() => setEditing(blankReward())}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5" /> New Reward
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : rewards.length === 0 ? (
        <div className="glass-card p-12 text-center text-white/40">
          No rewards yet. Create your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="card-interactive group relative p-5">
      <div className="flex items-start gap-3">
        <div
          className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${color}22`, border: `1px solid ${color}55` }}
        >
          <RewardIcon icon={reward.icon} className="h-6 w-6" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white/90">{reward.title}</p>
          <span
            className="badge mt-1"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            {enumLabel(rarities, reward.rarity)}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/20"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-xs text-white/50">
        {reward.description}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
        <span className="text-white/40">
          {enumLabel(triggers, reward.trigger)} ≥{" "}
          <span className="text-white/70">{reward.required}</span>
        </span>
        <span className="font-semibold text-gold-400">+{reward.xp_bonus} XP</span>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {isNew ? "New Reward" : "Edit Reward"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-xl"
              style={{
                backgroundColor: `${rarityColor(r.rarity)}22`,
                border: `1px solid ${rarityColor(r.rarity)}55`,
              }}
            >
              <RewardIcon
                icon={r.icon}
                className="h-6 w-6"
                style={{ color: rarityColor(r.rarity) }}
              />
            </div>
            <p className="text-sm text-white/50">Live preview of the badge</p>
          </div>

          <Field label="Title">
            <input
              className="input-field"
              value={r.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="input-field"
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
                className="input-field"
                value={r.required}
                onChange={(e) => set({ required: Number(e.target.value) })}
              />
            </Field>
            <Field label="XP bonus">
              <input
                type="number"
                className="input-field"
                value={r.xp_bonus}
                onChange={(e) => set({ xp_bonus: Number(e.target.value) })}
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                className="input-field"
                value={r.sort_order}
                onChange={(e) => set({ sort_order: Number(e.target.value) })}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={() => onSave(r, isNew)} className="btn-primary">
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
      <label className="mb-1.5 block text-sm font-medium text-white/50">
        {label}
      </label>
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
      className="input-field"
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
