import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, DocumentDuplicateIcon, EyeIcon, EyeSlashIcon, TrashIcon } from '@heroicons/react/24/outline'
import api from '../lib/api'
import DataTable from '../components/DataTable'
import { StatusBadge, DifficultyBadge } from '../components/Badges'
import type { Content, ContentType, ContentListResponse } from '../types'
import toast from 'react-hot-toast'

interface Props {
  type: ContentType
}

export default function ContentListPage({ type }: Props) {
  const [data, setData] = useState<ContentListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  const fetchContent = () => {
    setLoading(true)
    const params = new URLSearchParams({
      type,
      page: String(page),
      per_page: '20',
    })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)

    api
      .get(`/admin/content?${params}`)
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load content'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchContent()
  }, [type, page, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchContent()
  }

  const handlePublish = (id: string) => {
    api
      .post(`/admin/content/${id}/publish`)
      .then(() => {
        toast.success('Published!')
        fetchContent()
      })
      .catch(() => toast.error('Failed to publish'))
  }

  const handleUnpublish = (id: string) => {
    api
      .post(`/admin/content/${id}/unpublish`)
      .then(() => {
        toast.success('Unpublished')
        fetchContent()
      })
      .catch(() => toast.error('Failed to unpublish'))
  }

  const handleClone = (id: string, title: string) => {
    api
      .post(`/admin/content/${id}/clone`, { new_title: `${title} (Copy)` })
      .then(() => {
        toast.success('Cloned!')
        fetchContent()
      })
      .catch(() => toast.error('Failed to clone'))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return
    api
      .delete(`/admin/content/${id}`)
      .then(() => {
        toast.success('Deleted')
        fetchContent()
      })
      .catch(() => toast.error('Failed to delete'))
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (item: Content) => (
        <button
          onClick={() => navigate(`/content/${item.id}`)}
          className="text-emerald-400 hover:text-emerald-300 font-medium text-left"
        >
          {item.title}
        </button>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (item: Content) => (
        <span className="badge bg-white/5 text-white/60">{item.category || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Content) => <StatusBadge status={item.status} />,
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (item: Content) => <DifficultyBadge difficulty={item.difficulty} />,
    },
    {
      key: 'xp_reward',
      label: 'XP',
      render: (item: Content) => (
        <span className="text-gold-400 font-semibold">{item.xp_reward}</span>
      ),
    },
    {
      key: 'order',
      label: 'Order',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Content) => (
        <div className="flex items-center gap-1">
          {item.status === 'draft' ? (
            <button
              onClick={() => handlePublish(item.id)}
              className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400"
              title="Publish"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleUnpublish(item.id)}
              className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-yellow-400"
              title="Unpublish"
            >
              <EyeSlashIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleClone(item.id, item.title)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40"
            title="Clone"
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const label = type === 'task' ? 'Tasks' : 'Levels'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{label}</h1>
          <p className="text-white/40 text-sm mt-1">
            Manage your {label.toLowerCase()} content
          </p>
        </div>
        <button
          onClick={() => navigate(`/content/new?type=${type}`)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" /> New {type === 'task' ? 'Task' : 'Level'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="input-field text-sm"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="input-field w-40 text-sm"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={data?.items ?? []} loading={loading} />

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">
            Showing page {data.page} of {data.total_pages} ({data.total} items)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="btn-secondary text-sm disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(data.total_pages, page + 1))}
              disabled={page >= data.total_pages}
              className="btn-secondary text-sm disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
