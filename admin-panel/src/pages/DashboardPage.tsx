import { useEffect, useState } from "react";
import {
  UsersIcon,
  FireIcon,
  TrophyIcon,
  SparklesIcon,
  BookOpenIcon,
  MicrophoneIcon,
  CheckCircleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import api from "../lib/api";
import StatCard from "../components/StatCard";
import PageHeader, { PageLoader, PageMessage } from "../components/PageHeader";
import {
  LineChart,
  LegendDot,
  Donut,
  DonutLegend,
  BarList,
  type DonutSlice,
} from "../components/Charts";
import type { AdminAnalytics } from "../types";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#2CC9B5",
  medium: "#EFB65A",
  hard: "#F0838C",
  unset: "#3A5250",
};

export default function DashboardPage() {
  const [a, setA] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/v1/admin/analytics")
      .then((res) => setA(res.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  if (error || !a) {
    return (
      <PageMessage>
        Failed to load analytics. Is the API running and your account on the
        admin allowlist?
      </PageMessage>
    );
  }

  const series = a.series ?? [];
  const diff = a.levels_by_difficulty ?? [];
  const top = a.top_levels ?? [];

  const slices: DonutSlice[] = diff.map((d) => ({
    label: d.label,
    value: d.count,
    color: DIFFICULTY_COLORS[d.label] ?? "#3A5250",
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of your DeenQuest platform"
      />

      {/* Primary stats */}
      <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={a.total_users.toLocaleString()}
          subtitle={`${a.active_week.toLocaleString()} active this week`}
          icon={<UsersIcon className="h-[22px] w-[22px]" strokeWidth={2.2} />}
          gradient="teal"
        />
        <StatCard
          title="Active Today"
          value={a.active_today.toLocaleString()}
          subtitle="Users with activity today"
          icon={<FireIcon className="h-[22px] w-[22px]" strokeWidth={2.2} />}
          gradient="gold"
        />
        <StatCard
          title="Completions"
          value={(a.levels_completed + a.tasks_completed).toLocaleString()}
          subtitle={`${a.levels_completed.toLocaleString()} levels · ${a.tasks_completed.toLocaleString()} tasks`}
          icon={<CheckCircleIcon className="h-[22px] w-[22px]" strokeWidth={2.2} />}
          gradient="sky"
        />
        <StatCard
          title="Avg Streak"
          value={a.avg_streak.toFixed(1)}
          subtitle={`Longest: ${a.longest_streak} days`}
          icon={<TrophyIcon className="h-[22px] w-[22px]" strokeWidth={2.2} />}
          gradient="violet"
        />
      </div>

      {/* Activity + difficulty */}
      <div className="mt-[18px] grid grid-cols-1 gap-[18px] lg:grid-cols-3">
        <div className="dq-card p-[22px] lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="dq-h2">Activity — last 14 days</span>
            <div className="flex gap-4">
              <LegendDot color="#2CC9B5" label="Levels" />
              <LegendDot color="#EFB65A" label="Tasks" />
            </div>
          </div>
          {series.length ? (
            <LineChart
              series={[
                {
                  values: series.map((p) => p.level_completions),
                  stroke: "#2CC9B5",
                  fill: "rgba(44,201,181,.14)",
                },
                {
                  values: series.map((p) => p.task_completions),
                  stroke: "#EFB65A",
                  fill: "rgba(239,182,90,.12)",
                },
              ]}
            />
          ) : (
            <EmptyBox label="No activity recorded yet" />
          )}
        </div>

        <div className="dq-card p-[22px]">
          <span className="dq-h2">Levels by Difficulty</span>
          {slices.length ? (
            <>
              <div className="mt-3.5 flex justify-center">
                <Donut slices={slices} />
              </div>
              <DonutLegend slices={slices} />
            </>
          ) : (
            <EmptyBox label="No levels yet" />
          )}
        </div>
      </div>

      {/* Top levels + secondary stats */}
      <div className="mt-[18px] grid grid-cols-1 gap-[18px] lg:grid-cols-3">
        <div className="dq-card p-[22px] lg:col-span-2">
          <span className="dq-h2">Most Completed Levels</span>
          {top.length ? (
            <BarList rows={top.map((t) => ({ label: t.label, value: t.count }))} />
          ) : (
            <EmptyBox label="No level completions yet" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3.5 self-start">
          <MiniStat
            icon={<SparklesIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />}
            tint="#3A2F16"
            color="#EFB65A"
            label="Total XP"
            value={a.total_xp.toLocaleString()}
          />
          <MiniStat
            icon={<MicrophoneIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />}
            tint="#123B34"
            color="#5EE0CE"
            label="Recitations"
            value={a.recitation_attempts.toLocaleString()}
          />
          <MiniStat
            icon={<Squares2X2Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />}
            tint="#123B34"
            color="#5EE0CE"
            label="Levels"
            value={a.total_levels.toLocaleString()}
          />
          <MiniStat
            icon={<BookOpenIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />}
            tint="#3A2F16"
            color="#EFB65A"
            label="Daily Tasks"
            value={a.total_tasks.toLocaleString()}
          />
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  tint,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  tint: string;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="dq-card p-[18px]">
      <span
        className="grid h-[38px] w-[38px] place-items-center rounded-[11px]"
        style={{ background: tint, color }}
      >
        {icon}
      </span>
      <div className="mt-3 text-[11px] font-extrabold text-fg-dim">{label}</div>
      <div className="text-[22px] font-black leading-tight text-fg">{value}</div>
    </div>
  );
}

function EmptyBox({ label }: { label: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm font-semibold text-fg-faint">
      {label}
    </div>
  );
}
