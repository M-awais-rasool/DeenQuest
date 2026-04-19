import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { Event } from '../types'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import DataTable from '../components/DataTable'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [eType, setEType] = useState('seasonal')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [banner, setBanner] = useState('')

  const fetchEvents = () => {
    api.get('/admin/events').then((r) => setEvents(r.data.data ?? [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(fetchEvents, [])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    api.post('/admin/events', {
      name, description, type: eType,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      banner_url: banner,
    })
      .then(() => { toast.success('Event created'); setShowForm(false); setName(''); fetchEvents() })
      .catch(() => toast.error('Failed'))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete?')) return
    api.delete(`/admin/events/${id}`).then(() => { toast.success('Deleted'); fetchEvents() }).catch(() => toast.error('Failed'))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-white/40 text-sm mt-1">Manage seasonal and special events</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> New Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Name</label>
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ramadan 2025" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Type</label>
              <select className="input-field" value={eType} onChange={(e) => setEType(e.target.value)}>
                <option value="seasonal">Seasonal</option>
                <option value="challenge">Challenge</option>
                <option value="community">Community</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/50 mb-1.5">Description</label>
              <textarea className="input-field min-h-[60px]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Start Date</label>
              <input type="datetime-local" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">End Date</label>
              <input type="datetime-local" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Banner URL</label>
              <input className="input-field" value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Event</button>
          </div>
        </form>
      )}

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type', render: (e: Event) => <span className="badge bg-purple-500/20 text-purple-400">{e.type}</span> },
          { key: 'is_active', label: 'Active', render: (e: Event) => <span className={`badge ${e.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>{e.is_active ? 'Yes' : 'No'}</span> },
          { key: 'start', label: 'Start', render: (e: Event) => <span className="text-white/50 text-sm">{new Date(e.start_date).toLocaleDateString()}</span> },
          { key: 'end', label: 'End', render: (e: Event) => <span className="text-white/50 text-sm">{new Date(e.end_date).toLocaleDateString()}</span> },
          { key: 'actions', label: '', render: (e: Event) => (
            <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"><TrashIcon className="w-4 h-4" /></button>
          )},
        ]}
        data={events}
        loading={loading}
      />
    </div>
  )
}
