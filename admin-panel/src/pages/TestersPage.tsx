import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  BellAlertIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../lib/api";
import StatCard from "../components/StatCard";
import PageHeader, { PageLoader, PageMessage } from "../components/PageHeader";
import type { TesterDay, TesterReport, TesterRow } from "../types";

const WINDOWS = [7, 14, 30];

/** "12 Sep" — the column labels and the "last opened" date. */
function shortDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function clockTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function lastOpened(row: TesterRow) {
  if (!row.last_seen) return "—";
  const d = new Date(row.last_seen);
  return `${d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  })}, ${clockTime(row.last_seen)}`;
}

/** The one thing the page is for: is this person's testing day done? */
function status(row: TesterRow): { label: string; className: string } {
  if (row.active_today) return { label: "Opened today", className: "dq-badge-easy" };
  if (!row.has_account) return { label: "Never signed in", className: "dq-badge-hard" };
  if (row.days_since_seen < 0) return { label: "No activity yet", className: "dq-badge-hard" };
  if (row.days_since_seen === 1) return { label: "Yesterday", className: "dq-badge-medium" };
  return {
    label: `${row.days_since_seen} days ago`,
    className: row.days_since_seen >= 3 ? "dq-badge-hard" : "dq-badge-medium",
  };
}

function cellTitle(day: TesterDay) {
  if (!day.active) return `${day.date} — not opened`;
  return `${day.date} — ${clockTime(day.first_seen)} to ${clockTime(
    day.last_seen,
  )} · ${day.requests} requests`;
}

/** One tester's window: a square per day, filled on the days they showed up. */
function ActivityGrid({ days }: { days: TesterDay[] }) {
  return (
    <div className="flex gap-[3px]">
      {days.map((day) => (
        <span
          key={day.date}
          title={cellTitle(day)}
          className={`h-5 w-[9px] rounded-[3px] ${
            day.active ? "bg-teal" : "bg-ink-400"
          }`}
        />
      ))}
    </div>
  );
}

export default function TestersPage() {
  const [report, setReport] = useState<TesterReport | null>(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [paste, setPaste] = useState("");
  const [replace, setReplace] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    (window: number, quiet = false) => {
      if (!quiet) setLoading(true);
      api
        .get(`/v1/admin/testers?days=${window}`)
        .then((res) => {
          setReport(res.data.data);
          setError(false);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    },
    [],
  );

  useEffect(() => load(days), [days, load]);

  const testers = report?.testers ?? [];

  /** Roster members who still owe you a session today. */
  const toNudge = useMemo(
    () => testers.filter((t) => t.in_roster && !t.active_today),
    [testers],
  );

  const copyNudgeList = async () => {
    if (toNudge.length === 0) {
      toast.success("Everyone has opened the app today");
      return;
    }
    try {
      await navigator.clipboard.writeText(
        toNudge.map((t) => t.email).join(", "),
      );
      toast.success(`${toNudge.length} addresses copied`);
    } catch {
      toast.error("Clipboard blocked — select the addresses in the table");
    }
  };

  const saveRoster = async () => {
    if (!paste.trim()) {
      toast.error("Paste the tester addresses first");
      return;
    }
    setSaving(true);
    try {
      await api.post("/v1/admin/testers/roster", {
        emails: [paste],
        replace,
      });
      setPaste("");
      toast.success(replace ? "Tester list replaced" : "Testers added");
      load(days, true);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to save the tester list");
    } finally {
      setSaving(false);
    }
  };

  const removeTester = async (email: string) => {
    try {
      await api.delete(`/v1/admin/testers/roster/${encodeURIComponent(email)}`);
      toast.success(`${email} removed`);
      load(days, true);
    } catch {
      toast.error("Failed to remove that tester");
    }
  };

  if (loading) return <PageLoader />;

  if (error || !report) {
    return (
      <PageMessage>
        Failed to load the tester report. Is the API running and your account on
        the admin allowlist?
      </PageMessage>
    );
  }

  const summary = report.summary;
  // The roster is what the Play Console counts. Anyone else opening the app —
  // you on the admin panel, a tester signed in with a second account — is worth
  // seeing, but not worth mixing into "how is the test going".
  const rosterActiveToday = summary.roster - summary.missing_today;
  const others = summary.active_today - rosterActiveToday;

  return (
    <div>
      <PageHeader
        title="Play Testers"
        subtitle={`Who has opened the app, day by day · days counted in ${report.timezone}`}
        action={
          <div className="flex gap-2">
            <div className="dq-inset flex items-center gap-1 p-1">
              {WINDOWS.map((w) => (
                <button
                  key={w}
                  onClick={() => setDays(w)}
                  className={`rounded-[8px] px-3 py-1 text-xs font-extrabold ${
                    days === w
                      ? "bg-teal text-teal-ink"
                      : "text-fg-dim hover:text-fg"
                  }`}
                >
                  {w}d
                </button>
              ))}
            </div>
            <button onClick={copyNudgeList} className="dq-btn-ghost">
              <ClipboardDocumentIcon className="h-[17px] w-[17px]" strokeWidth={2.6} />
              Copy who to message
            </button>
            <button onClick={() => load(days)} className="dq-btn-ghost">
              <ArrowPathIcon className="h-[17px] w-[17px]" strokeWidth={2.6} />
              Reload
            </button>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Testers on the list"
          value={summary.roster}
          subtitle={`${summary.signed_in} have signed in`}
          icon={<UserGroupIcon className="h-[22px] w-[22px]" strokeWidth={2.2} />}
          gradient="teal"
        />
        <StatCard
          title="Opened today"
          value={`${rosterActiveToday}/${summary.roster}`}
          subtitle={
            others > 0
              ? `${summary.perfect_window} opened it every day · ${others} more off the list`
              : `${summary.perfect_window} opened it every day`
          }
          icon={<CheckBadgeIcon className="h-[22px] w-[22px]" strokeWidth={2.2} />}
          gradient="gold"
        />
        <StatCard
          title="Still to message"
          value={summary.missing_today}
          subtitle="Roster testers with no session today"
          icon={<BellAlertIcon className="h-[22px] w-[22px]" strokeWidth={2.2} />}
          gradient="sky"
        />
        <StatCard
          title="Never signed in"
          value={summary.never_opened}
          subtitle="Invited, but no account exists"
          icon={<NoSymbolIcon className="h-[22px] w-[22px]" strokeWidth={2.2} />}
          gradient="violet"
        />
      </div>

      {/* ── The grid ── */}
      <div className="dq-card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="dq-table">
            <thead>
              <tr>
                <th>Tester</th>
                <th>Status</th>
                <th>Last opened</th>
                <th>Days</th>
                <th>
                  {shortDate(report.days[0])} → {shortDate(report.today)}
                </th>
                <th className="text-right">Remove</th>
              </tr>
            </thead>
            <tbody>
              {testers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm font-semibold text-fg-faint">
                    No testers yet — paste the Play Console list below.
                  </td>
                </tr>
              ) : (
                testers.map((row) => {
                  const badge = status(row);
                  return (
                    <tr key={row.user_id || row.email}>
                      <td>
                        <div className="font-extrabold text-fg">
                          {row.name || row.email || row.user_id}
                        </div>
                        <div className="text-xs font-semibold text-fg-dimmer">
                          {row.email || "no account"}
                          {!row.in_roster && (
                            <span className="ml-2 dq-badge dq-badge-neutral">
                              not on the list
                            </span>
                          )}
                          {row.client && (
                            <span className="ml-2 uppercase">{row.client}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`dq-badge ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-sm font-semibold text-fg-dim">
                        {lastOpened(row)}
                      </td>
                      <td className="whitespace-nowrap text-sm font-semibold text-fg-dim">
                        {row.days_active}/{report.days.length}
                        {row.current_streak > 1 && (
                          <span className="ml-2 text-gold">
                            {row.current_streak} in a row
                          </span>
                        )}
                      </td>
                      <td>
                        <ActivityGrid days={row.days} />
                      </td>
                      <td className="text-right">
                        {row.in_roster && (
                          <button
                            onClick={() => removeTester(row.email)}
                            className="dq-icon-btn-sm dq-icon-btn-danger"
                            title={`Remove ${row.email} from the list`}
                          >
                            <TrashIcon className="h-4 w-4" strokeWidth={2.4} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Roster editor ── */}
      <div className="dq-card mt-6 p-6">
        <h2 className="dq-h2">Tester list</h2>
        <p className="dq-sub mt-1">
          Paste the addresses from the Play Console tester group. Commas, spaces
          and line breaks all work.
        </p>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={4}
          placeholder="one@gmail.com, two@gmail.com&#10;three@gmail.com"
          className="dq-input mt-4 font-mono text-xs"
        />
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-bold text-fg-dim">
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
              className="h-4 w-4 accent-teal"
            />
            Replace the whole list
          </label>
          <button onClick={saveRoster} className="dq-btn" disabled={saving}>
            {saving ? "Saving…" : "Save tester list"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-fg-faint">
        A day is filled in as soon as the installed app talks to the API, so no
        new build is needed. A tester who never signs in has no account and
        shows as “Never signed in”.
      </p>
    </div>
  );
}
