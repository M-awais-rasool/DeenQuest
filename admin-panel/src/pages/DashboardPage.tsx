import { useEffect, useState } from 'react'
import {
  UsersIcon,
  FireIcon,
  TrophyIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler } from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import api from '../lib/api'
import StatCard from '../components/StatCard'
import type { AnalyticsSnapshot } from '../types'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler)

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/admin/analytics')
      .then((res) => setAnalytics(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Active Users',
        data: [120, 190, 300, 250, 400, 350, analytics?.dau ?? 280],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  }

  const doughnutData = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [
      {
        data: [
          analytics?.tasks_completed ?? 65,
          analytics?.levels_completed ?? 25,
          10,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#374151'],
        borderWidth: 0,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.3)' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.3)' },
      },
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Overview of your DeenQuest platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={analytics?.total_users?.toLocaleString() ?? '0'}
          subtitle="+12% this month"
          icon={<UsersIcon className="w-6 h-6 text-white" />}
          gradient="emerald"
        />
        <StatCard
          title="DAU"
          value={analytics?.dau?.toLocaleString() ?? '0'}
          subtitle="Daily active users"
          icon={<FireIcon className="w-6 h-6 text-white" />}
          gradient="gold"
        />
        <StatCard
          title="Tasks Completed"
          value={analytics?.tasks_completed?.toLocaleString() ?? '0'}
          subtitle="All time"
          icon={<TrophyIcon className="w-6 h-6 text-white" />}
          gradient="navy"
        />
        <StatCard
          title="Avg Session"
          value={analytics?.avg_session_time ? `${Math.round(analytics.avg_session_time / 60)}m` : '0m'}
          subtitle={`${analytics?.retention_rate ?? 0}% retention`}
          icon={<ClockIcon className="w-6 h-6 text-white" />}
          gradient="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-white/60 mb-4">User Activity Trends</h3>
          <div className="h-64">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white/60 mb-4">Task Completion</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: 'rgba(255,255,255,0.5)', padding: 16, usePointStyle: true },
                  },
                },
                cutout: '70%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white/60 mb-4">Top Completed Tasks</h3>
          <div className="space-y-3">
            {(analytics?.top_completed_tasks ?? ['Fajr Prayer', 'Daily Quran', 'Dhikr Counter']).map(
              (task, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm text-white/80">{task}</span>
                  </div>
                  <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-emerald rounded-full"
                      style={{ width: `${100 - i * 20}%` }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white/60 mb-4">Streak Overview</h3>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-5xl font-bold bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                {analytics?.avg_streak?.toFixed(1) ?? '0'}
              </p>
              <p className="text-sm text-white/40 mt-2">Average User Streak</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
