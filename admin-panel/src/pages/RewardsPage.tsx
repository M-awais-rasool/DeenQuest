import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { Reward } from '../types'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import DataTable from '../components/DataTable'

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rType, setRType] = useState('badge')
  const [xpRequired, setXpRequired] = useState(100)
  const [icon, setIcon] = useState('')
  const [image, setImage] = useState('')

  const fetch = () => {
    api.get('/admin/rewards').then((r) => setRewards(r.data.data ?? [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(fetch, [])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    api.post('/admin/rewards', { name, description, type: rType, xp_required: xpRequired, icon, image_url: image })
      .then(() => { toast.success('Reward created'); setShowForm(false); setName(''); fetch() })
      .catch(() => toast.error('Failed'))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete?')) return
    api.delete(`/admin/rewards/${id}`).then(() => { toast.success('Deleted'); fetch() }).catch(() => toast.error('Failed'))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rewards</h1>
          <p className="text-white/40 text-sm mt-1">Manage badges and achievements</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> New Reward
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Name</label>
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="First Steps" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Type</label>
              <select className="input-field" value={rType} onChange={(e) => setRType(e.target.value)}>
                <option value="badge">Badge</option>
                <option value="achievement">Achievement</option>
                <option value="title">Title</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/50 mb-1.5">Description</label>
              <textarea className="input-field min-h-[60px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Awarded for..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">XP Required</label>
              <input type="number" className="input-field" value={xpRequired} onChange={(e) => setXpRequired(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Icon</label>
              <input className="input-field" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🏅" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/50 mb-1.5">Image URL</label>
              <input className="input-field" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Reward</button>
          </div>
        </form>
      )}

      <DataTable
        columns={[
          { key: 'icon', label: '🏆', render: (r: Reward) => <span className="text-2xl">{r.icon}</span> },
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type', render: (r: Reward) => <span className="badge bg-gold-500/20 text-gold-400">{r.type}</span> },
          { key: 'xp_value', label: 'XP Value', render: (r: Reward) => <span className="text-gold-400 font-semibold">{r.xp_value}</span> },
          { key: 'actions', label: '', render: (r: Reward) => (
            <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"><TrashIcon className="w-4 h-4" /></button>
          )},
        ]}
        data={rewards}
        loading={loading}
      />
    </div>
  )
}
