import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { Theme } from '../types'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import DataTable from '../components/DataTable'

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [bg, setBg] = useState('#0F3D2E')
  const [card, setCard] = useState('#145A42')
  const [text, setText] = useState('#FFFFFF')
  const [accent, setAccent] = useState('#FFD700')
  const [icon, setIcon] = useState('')

  const fetchThemes = () => {
    api.get('/admin/themes').then((r) => setThemes(r.data.data ?? [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(fetchThemes, [])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    api
      .post('/admin/themes', {
        name,
        style: { background: bg, card_color: card, text_color: text, accent_color: accent },
        icon,
      })
      .then(() => {
        toast.success('Theme created')
        setShowForm(false)
        setName('')
        fetchThemes()
      })
      .catch(() => toast.error('Failed to create theme'))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this theme?')) return
    api.delete(`/admin/themes/${id}`).then(() => { toast.success('Deleted'); fetchThemes() }).catch(() => toast.error('Failed'))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Themes</h1>
          <p className="text-white/40 text-sm mt-1">Manage visual themes for content</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> New Theme
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Name</label>
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Ramadan Night" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Icon Emoji</label>
              <input className="input-field" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🌙" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Background</label>
              <div className="flex gap-2">
                <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                <input className="input-field flex-1 text-xs" value={bg} onChange={(e) => setBg(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Card</label>
              <div className="flex gap-2">
                <input type="color" value={card} onChange={(e) => setCard(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                <input className="input-field flex-1 text-xs" value={card} onChange={(e) => setCard(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Text</label>
              <div className="flex gap-2">
                <input type="color" value={text} onChange={(e) => setText(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                <input className="input-field flex-1 text-xs" value={text} onChange={(e) => setText(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Accent</label>
              <div className="flex gap-2">
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                <input className="input-field flex-1 text-xs" value={accent} onChange={(e) => setAccent(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Theme</button>
          </div>
        </form>
      )}

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          {
            key: 'colors',
            label: 'Colors',
            render: (t: Theme) => (
              <div className="flex gap-1.5">
                {Object.values(t.style ?? {}).filter(v => typeof v === 'string' && v.startsWith('#')).map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-md border border-white/10" style={{ background: c as string }} />
                ))}
              </div>
            ),
          },
          { key: 'icon', label: 'Icon' },
          {
            key: 'actions',
            label: '',
            render: (t: Theme) => (
              <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400">
                <TrashIcon className="w-4 h-4" />
              </button>
            ),
          },
        ]}
        data={themes}
        loading={loading}
      />
    </div>
  )
}
