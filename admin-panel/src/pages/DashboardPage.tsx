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
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import api from "../lib/api";
import StatCard from "../components/StatCard";
import type { AdminAnalytics } from "../types";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
);

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#10b981",
  medium: "#f59e0b",
  hard: "#fb7185",
  unset: "#475569",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !a) {
    return (
      <div className="glass-card p-12 text-center text-white/50">
        Failed to load analytics. Is the API running and your account on the
        admin allowlist?
      </div>
    );
  }

  const series = a.series ?? [];
  const lineData = {
    labels: series.map((p) => p.date.slice(5)),
    datasets: [
      {
        label: "Levels completed",
        data: series.map((p) => p.level_completions),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.12)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: "Tasks completed",
        data: series.map((p) => p.task_completions),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.10)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const diff = a.levels_by_difficulty ?? [];
  const doughnutData = {
    labels: diff.map((d) => d.label),
    datasets: [
      {
        data: diff.map((d) => d.count),
        backgroundColor: diff.map(
          (d) => DIFFICULTY_COLORS[d.label] ?? "#64748b",
        ),
        borderWidth: 0,
      },
    ],
  };

  const top = a.top_levels ?? [];
  const barData = {
    labels: top.map((t) => t.label),
    datasets: [
      {
        label: "Completions",
        data: top.map((t) => t.count),
        backgroundColor: "rgba(16,185,129,0.6)",
        borderColor: "#10b981",
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 38,
      },
    ],
  };

  const axisOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "rgba(255,255,255,0.35)", font: { size: 11 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "rgba(255,255,255,0.35)",
          font: { size: 11 },
          precision: 0,
        },
        beginAtZero: true,
      },
    },
  } as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">
          Live overview of your DeenQuest platform
        </p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={a.total_users.toLocaleString()}
          subtitle={`${a.active_week.toLocaleString()} active this week`}
          icon={<UsersIcon className="w-6 h-6 text-white" />}
          gradient="emerald"
        />
        <StatCard
          title="Active Today"
          value={a.active_today.toLocaleString()}
          subtitle="Users with activity today"
          icon={<FireIcon className="w-6 h-6 text-white" />}
          gradient="gold"
        />
        <StatCard
          title="Completions"
          value={(a.levels_completed + a.tasks_completed).toLocaleString()}
          subtitle={`${a.levels_completed} levels · ${a.tasks_completed} tasks`}
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
          gradient="navy"
        />
        <StatCard
          title="Avg Streak"
          value={a.avg_streak.toFixed(1)}
          subtitle={`Longest: ${a.longest_streak} days`}
          icon={<TrophyIcon className="w-6 h-6 text-white" />}
          gradient="purple"
        />
      </div>

      {/* Activity + difficulty */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/60">
              Activity — last 14 days
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <LegendDot color="#10b981" label="Levels" />
              <LegendDot color="#f59e0b" label="Tasks" />
            </div>
          </div>
          <div className="h-64">
            <Line data={lineData} options={axisOptions} />
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white/60 mb-4">
            Levels by Difficulty
          </h3>
          <div className="h-64 flex items-center justify-center">
            {diff.length ? (
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: "rgba(255,255,255,0.5)",
                        padding: 14,
                        usePointStyle: true,
                      },
                    },
                  },
                  cutout: "68%",
                }}
              />
            ) : (
              <p className="text-white/30 text-sm">No levels yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Top levels + secondary stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-white/60 mb-4">
            Most Completed Levels
          </h3>
          <div className="h-64">
            {top.length ? (
              <Bar data={barData} options={axisOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-white/30 text-sm">
                No level completions yet
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 content-start">
          <MiniStat
            icon={<SparklesIcon className="w-5 h-5 text-gold-400" />}
            label="Total XP"
            value={a.total_xp.toLocaleString()}
          />
          <MiniStat
            icon={<MicrophoneIcon className="w-5 h-5 text-emerald-400" />}
            label="Recitations"
            value={a.recitation_attempts.toLocaleString()}
          />
          <MiniStat
            icon={<Squares2X2Icon className="w-5 h-5 text-emerald-400" />}
            label="Levels"
            value={a.total_levels.toLocaleString()}
          />
          <MiniStat
            icon={<BookOpenIcon className="w-5 h-5 text-gold-400" />}
            label="Daily Tasks"
            value={a.total_tasks.toLocaleString()}
          />
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-white/50">
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
