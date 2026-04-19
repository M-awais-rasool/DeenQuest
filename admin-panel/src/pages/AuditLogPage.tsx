import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { AuditLog } from '../types'
import DataTable from '../components/DataTable'

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 30

  useEffect(() => {
    setLoading(true)
    api
      .get(`/admin/audit-logs?page=${page}&per_page=${perPage}`)
      .then((r) => {
        const d = r.data.data
        setLogs(d?.items ?? d ?? [])
        setTotal(d?.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const actionColor = (action: string) => {
    if (action.includes('create')) return 'text-emerald-400 bg-emerald-500/10'
    if (action.includes('update')) return 'text-blue-400 bg-blue-500/10'
    if (action.includes('delete')) return 'text-red-400 bg-red-500/10'
    if (action.includes('publish')) return 'text-gold-400 bg-gold-500/10'
    return 'text-white/50 bg-white/5'
  }

  const totalPages = Math.ceil(total / perPage) || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-white/40 text-sm mt-1">Track all admin actions</p>
      </div>

      <DataTable
        columns={[
          {
            key: 'created_at',
            label: 'Time',
            render: (l: AuditLog) => (
              <span className="text-white/50 text-xs font-mono">
                {new Date(l.created_at).toLocaleString()}
              </span>
            ),
          },
          {
            key: 'action',
            label: 'Action',
            render: (l: AuditLog) => (
              <span className={`badge text-xs font-medium ${actionColor(l.action)}`}>
                {l.action}
              </span>
            ),
          },
          { key: 'resource', label: 'Resource' },
          {
            key: 'resource_id',
            label: 'Resource ID',
            render: (l: AuditLog) => (
              <span className="text-xs font-mono text-white/40">{l.resource_id?.slice(0, 12)}...</span>
            ),
          },
          { key: 'admin_id', label: 'Admin', render: (l: AuditLog) => <span className="text-xs text-white/40">{l.admin_id?.slice(0, 8)}</span> },
          {
            key: 'changes',
            label: 'Details',
            render: (l: AuditLog) => (
              <span className="text-xs text-white/30 max-w-[200px] truncate block">
                {l.changes ? JSON.stringify(l.changes).slice(0, 60) : '—'}
              </span>
            ),
          },
        ]}
        data={logs}
        loading={loading}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">Page {page} of {totalPages} ({total} entries)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="btn-secondary text-sm disabled:opacity-30">Previous</button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="btn-secondary text-sm disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
