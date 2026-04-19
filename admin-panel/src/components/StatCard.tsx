import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  gradient: 'emerald' | 'gold' | 'navy' | 'purple'
}

const gradientMap = {
  emerald: 'from-emerald-500 to-emerald-700',
  gold: 'from-gold-400 to-gold-600',
  navy: 'from-navy-600 to-navy-800',
  purple: 'from-purple-500 to-purple-700',
}

export default function StatCard({ title, value, subtitle, icon, gradient }: StatCardProps) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/50 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            {value}
          </p>
          {subtitle && <p className="text-xs text-emerald-400 mt-1 font-medium">{subtitle}</p>}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientMap[gradient]} flex items-center justify-center shadow-lg`}
        >
          {icon}
        </div>
      </div>
      {/* Decorative glow */}
      <div
        className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradientMap[gradient]} rounded-full opacity-5 group-hover:opacity-10 transition-opacity`}
      />
    </div>
  )
}
