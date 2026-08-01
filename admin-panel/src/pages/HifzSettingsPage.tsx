import { useEffect, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../lib/api";
import PageHeader, { PageLoader, PageMessage } from "../components/PageHeader";
import type {
  HifzChallengeCatalogEntry,
  HifzChallengeConfig,
  HifzSessionRules,
  HifzSettings,
} from "../types";

export default function HifzSettingsPage() {
  const [settings, setSettings] = useState<HifzSettings | null>(null);
  const [catalog, setCatalog] = useState<HifzChallengeCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/v1/admin/hifz/settings"),
      api.get("/v1/admin/hifz/challenges"),
    ])
      .then(([s, c]) => {
        setSettings(s.data.data);
        setCatalog(c.data.data ?? []);
      })
      .catch(() => toast.error("Failed to load hifz settings"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await api.put("/v1/admin/hifz/settings", settings);
      setSettings(res.data.data);
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const setRules = (patch: Partial<HifzSessionRules>) =>
    setSettings((s) => (s ? { ...s, session: { ...s.session, ...patch } } : s));

  const setChallenge = (kind: string, patch: Partial<HifzChallengeConfig>) =>
    setSettings((s) =>
      s
        ? {
            ...s,
            challenges: {
              ...s.challenges,
              [kind]: { ...s.challenges[kind], ...patch },
            },
          }
        : s,
    );

  if (loading) return <PageLoader />;
  if (!settings) return <PageMessage>Could not load hifz settings.</PageMessage>;

  return (
    <div>
      <PageHeader
        title="Hifz Settings"
        subtitle="Session rules, challenge generation and the review schedule"
        action={
          <div className="flex gap-2">
            <button onClick={load} className="dq-btn-ghost" disabled={saving}>
              <ArrowPathIcon className="h-[17px] w-[17px]" strokeWidth={2.6} />
              Reload
            </button>
            <button onClick={save} className="dq-btn" disabled={saving}>
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        }
      />

      {/* ── Session rules ── */}
      <h2 className="mt-8 text-sm font-black uppercase tracking-wide text-fg-faint">
        Session rules
      </h2>
      <p className="mt-1 text-sm font-semibold text-fg-dimmer">
        One experience for everyone — there is no difficulty level. These apply to
        every learner in the app.
      </p>

      <div className="dq-card mt-4 grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <NumberField
          label="Listen repeats"
          hint="Passes required before the Listen stage unlocks."
          value={settings.session.listen_repeats}
          min={1}
          max={10}
          onChange={(v) => setRules({ listen_repeats: v })}
        />
        <NumberField
          label="Challenges per session"
          value={settings.session.challenge_count}
          min={1}
          max={10}
          onChange={(v) => setRules({ challenge_count: v })}
        />
        <NumberField
          label="Open recite pass %"
          value={settings.session.open_recite_pass}
          min={0}
          max={100}
          onChange={(v) => setRules({ open_recite_pass: v })}
        />
        <NumberField
          label="Blind recite pass %"
          value={settings.session.blind_recite_pass}
          min={0}
          max={100}
          onChange={(v) => setRules({ blind_recite_pass: v })}
        />
        <NumberField
          label="Leniency bonus"
          hint="Points added to every recitation score. Raise it when the transcriber is harsh — a false 'wrong word' is what makes people quit."
          value={settings.session.lenience_bonus}
          min={0}
          max={25}
          onChange={(v) => setRules({ lenience_bonus: v })}
        />
        <NumberField
          label="New portions per day"
          hint="How many new lessons Sabaq hands out each day. Sealing that many closes Sabaq until tomorrow."
          value={settings.srs.new_portions_per_day}
          min={1}
          max={10}
          onChange={(v) =>
            setSettings({
              ...settings,
              srs: { ...settings.srs, new_portions_per_day: v },
            })
          }
        />

        <div className="space-y-2 border-t border-ink-500 pt-3 md:col-span-2">
          <Toggle
            label="Repeat-after-me stage"
            checked={settings.session.shadow_required}
            onChange={(v) => setRules({ shadow_required: v })}
          />
          <Toggle
            label="Blind recite required to seal"
            hint="Off means a portion can be sealed from open-book recitation alone — its strength stays capped until a blind pass."
            checked={settings.session.blind_required_to_seal}
            onChange={(v) => setRules({ blind_required_to_seal: v })}
          />
          <Toggle
            label="Allow hints"
            checked={settings.session.allow_hints}
            onChange={(v) => setRules({ allow_hints: v })}
          />
        </div>

        <div className="border-t border-ink-500 pt-3 md:col-span-2">
          <label className="dq-label">Enabled challenges</label>
          <div className="grid grid-cols-2 gap-1.5">
            {catalog.map((entry) => {
              const on = settings.session.enabled_challenges?.includes(entry.kind);
              return (
                <label
                  key={entry.kind}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={!!on}
                    onChange={(e) =>
                      setRules({
                        enabled_challenges: e.target.checked
                          ? [...(settings.session.enabled_challenges ?? []), entry.kind]
                          : (settings.session.enabled_challenges ?? []).filter(
                              (k: string) => k !== entry.kind,
                            ),
                      })
                    }
                    className="h-3.5 w-3.5 accent-teal"
                  />
                  <span className="text-xs font-bold text-fg">
                    {entry.icon} {entry.label}
                  </span>
                  {!settings.challenges[entry.kind]?.enabled && (
                    <span className="text-[10px] font-black uppercase text-gold">
                      off globally
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Challenge types ── */}
      <h2 className="mt-10 text-sm font-black uppercase tracking-wide text-fg-faint">
        Challenge types
      </h2>
      <p className="mt-1 text-sm font-semibold text-fg-dimmer">
        Generation parameters. Turning a type off here disables it everywhere, even
        if it is ticked above.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        {catalog.map((entry) => {
          const cfg = settings.challenges[entry.kind] ?? entry.config;
          return (
            <div key={entry.kind} className="dq-card p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{entry.icon}</span>
                <div className="flex-1">
                  <div className="text-base font-black text-fg">{entry.label}</div>
                  <div className="text-xs font-semibold text-fg-dimmer">
                    {entry.description}
                  </div>
                </div>
                <Toggle
                  label=""
                  checked={cfg.enabled}
                  onChange={(v) => setChallenge(entry.kind, { enabled: v })}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {entry.kind !== "ayah_order" && entry.kind !== "next_ayah" && (
                  <NumberField
                    label="Hidden words %"
                    value={cfg.hidden_word_pct}
                    min={5}
                    max={100}
                    onChange={(v) => setChallenge(entry.kind, { hidden_word_pct: v })}
                  />
                )}
                <NumberField
                  label="Decoys"
                  hint="Extra wrong words in the bank."
                  value={cfg.distractor_count}
                  min={0}
                  max={8}
                  onChange={(v) => setChallenge(entry.kind, { distractor_count: v })}
                />
              </div>

              {entry.kind === "progressive_fade" && (
                <div className="mt-3">
                  <label className="dq-label">Fade steps (% hidden per round)</label>
                  <input
                    className="dq-input"
                    value={(cfg.fade_steps ?? []).join(", ")}
                    onChange={(e) =>
                      setChallenge(entry.kind, {
                        fade_steps: e.target.value
                          .split(",")
                          .map((v) => Number(v.trim()))
                          .filter((n) => Number.isFinite(n) && n > 0 && n <= 100),
                      })
                    }
                    placeholder="20, 45, 70, 100"
                  />
                  <p className="mt-1 text-xs font-semibold text-fg-faint">
                    Each value is one round. Ending at 100 means the last round is
                    fully from memory.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── SRS ── */}
      <h2 className="mt-10 text-sm font-black uppercase tracking-wide text-fg-faint">
        Review schedule
      </h2>
      <p className="mt-1 text-sm font-semibold text-fg-dimmer">
        How memory strength decays and when portions come back. Changing these
        reshapes every learner's queue — move them in small steps.
      </p>

      <div className="dq-card mt-4 grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="dq-label">Interval ladder (days)</label>
          <input
            className="dq-input"
            value={settings.srs.interval_ladder.join(", ")}
            onChange={(e) =>
              setSettings({
                ...settings,
                srs: {
                  ...settings.srs,
                  interval_ladder: e.target.value
                    .split(",")
                    .map((v) => Number(v.trim()))
                    .filter((n) => Number.isFinite(n) && n > 0),
                },
              })
            }
          />
          <p className="mt-1 text-xs font-semibold text-fg-faint">
            A pass moves one rung up; a lapse drops back to the first. The first
            rung should stay at 1 day — that's the steepest part of the forgetting
            curve.
          </p>
        </div>

        <NumberField
          label="Base half-life (days)"
          hint="Days for a portion's strength to halve after one review."
          value={settings.srs.base_half_life_days}
          min={1}
          max={90}
          onChange={(v) =>
            setSettings({
              ...settings,
              srs: { ...settings.srs, base_half_life_days: v },
            })
          }
        />
        <NumberField
          label="Manzil daily cap"
          hint="Maximum long-term reviews offered per day. An uncapped queue is how SRS apps lose people."
          value={settings.srs.manzil_daily_cap}
          min={1}
          max={30}
          onChange={(v) =>
            setSettings({ ...settings, srs: { ...settings.srs, manzil_daily_cap: v } })
          }
        />
        <NumberField
          label="Sabqi window (days)"
          hint="How long a sealed portion is revised every day before it graduates to the Manzil rotation."
          value={settings.srs.sabqi_window_days}
          min={1}
          max={30}
          onChange={(v) =>
            setSettings({ ...settings, srs: { ...settings.srs, sabqi_window_days: v } })
          }
        />
        <FloatField
          label="EMA alpha"
          hint="Weight of the newest session. Higher reacts faster but is noisier."
          value={settings.srs.ema_alpha}
          onChange={(v) =>
            setSettings({ ...settings, srs: { ...settings.srs, ema_alpha: v } })
          }
        />
        <FloatField
          label="Strong threshold"
          hint="Strength at or above this reads Strong."
          value={settings.srs.strong_threshold}
          onChange={(v) =>
            setSettings({ ...settings, srs: { ...settings.srs, strong_threshold: v } })
          }
        />
        <FloatField
          label="Medium threshold"
          hint="Below this reads Weak."
          value={settings.srs.medium_threshold}
          onChange={(v) =>
            setSettings({ ...settings, srs: { ...settings.srs, medium_threshold: v } })
          }
        />
        <FloatField
          label="Unverified penalty"
          hint="Multiplier on a portion never recited blind. 0.7 means open-book fluency reads 30% weaker."
          value={settings.srs.unverified_penalty}
          onChange={(v) =>
            setSettings({
              ...settings,
              srs: { ...settings.srs, unverified_penalty: v },
            })
          }
        />
        <FloatField
          label="Hint penalty"
          hint="Score cost per hint used."
          value={settings.srs.hint_penalty}
          onChange={(v) =>
            setSettings({ ...settings, srs: { ...settings.srs, hint_penalty: v } })
          }
        />
      </div>

      {/* ── Reciters ── */}
      <h2 className="mt-10 text-sm font-black uppercase tracking-wide text-fg-faint">
        Reciters
      </h2>
      <div className="dq-card mt-4 space-y-2 p-5">
        {settings.reciters.map((reciter, idx) => (
          <div key={reciter.id} className="flex items-center gap-2">
            <input
              className="dq-input-sm w-56"
              value={reciter.id}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reciters: settings.reciters.map((r, i) =>
                    i === idx ? { ...r, id: e.target.value } : r,
                  ),
                })
              }
              placeholder="ar.alafasy"
            />
            <input
              className="dq-input-sm flex-1"
              value={reciter.name}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reciters: settings.reciters.map((r, i) =>
                    i === idx ? { ...r, name: e.target.value } : r,
                  ),
                })
              }
              placeholder="Mishary Al-Afasy"
            />
          </div>
        ))}
        <p className="pt-1 text-xs font-semibold text-fg-faint">
          IDs are alquran.cloud edition identifiers. The first entry is the default
          for new learners.
        </p>
      </div>

      <div className="h-10" />
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="dq-label">{label}</label>
      <input
        type="number"
        className="dq-input"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="mt-1 text-xs font-semibold text-fg-faint">{hint}</p>}
    </div>
  );
}

function FloatField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="dq-label">{label}</label>
      <input
        type="number"
        step="0.05"
        min={0}
        max={1}
        className="dq-input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="mt-1 text-xs font-semibold text-fg-faint">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-teal"
      />
      {!!label && (
        <span className="flex-1">
          <span className="text-xs font-bold text-fg">{label}</span>
          {hint && (
            <span className="mt-0.5 block text-xs font-semibold text-fg-faint">
              {hint}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
