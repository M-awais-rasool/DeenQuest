import type { ContentStatus } from '../types'

const statusColors: Record<ContentStatus, string> = {
  draft: 'bg-yellow-500/20 text-yellow-400',
  published: 'bg-emerald-500/20 text-emerald-400',
  archived: 'bg-white/10 text-white/50',
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`badge ${statusColors[status] || 'bg-white/10 text-white/50'}`}>
      {status}
    </span>
  )
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-gold-500/20 text-gold-400',
  hard: 'bg-red-500/20 text-red-400',
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className={`badge ${difficultyColors[difficulty] || 'bg-white/10 text-white/50'}`}>
      {difficulty}
    </span>
  )
}
