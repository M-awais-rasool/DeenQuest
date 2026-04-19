import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import BlockBuilder from '../components/BlockBuilder'
import type { Block, ContentType, DifficultyLevel, Style } from '../types'
import toast from 'react-hot-toast'
import {
  SCREEN_TYPES,
  TASK_CATEGORIES,
  COMPLETION_TYPES,
  TASK_DIFFICULTIES,
  LEVEL_DIFFICULTIES,
  LESSON_TYPES,
  MINI_GAME_TYPES,
  BLOCK_TYPES,
  TASK_COMPONENTS,
  LESSON_COMPONENTS,
  LEVEL_THEMES,
  LAYOUTS,
  ANIMATIONS,
  FONT_FAMILIES,
} from '../lib/registry'

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly { value: string; label: string; description?: string; icon?: string }[]
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/50 mb-1.5">{label}</label>
      <select className="input-field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder ?? `Select ${label.toLowerCase()}...`}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.icon ? `${o.icon} ` : ''}{o.label}{o.description ? ` — ${o.description}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ContentEditorPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<ContentType>((searchParams.get('type') as ContentType) || 'task')
  const [category, setCategory] = useState('')
  const [screenType, setScreenType] = useState('')
  const [componentType, setComponentType] = useState('')
  const [theme, setTheme] = useState('')
  const [layout, setLayout] = useState('')
  const [animation, setAnimation] = useState('')
  const [xpReward, setXpReward] = useState(10)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy')
  const [order, setOrder] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(3)
  const [thumbnail, setThumbnail] = useState('')
  const [tags, setTags] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [style, setStyle] = useState<Style>({})
  const [completionType, setCompletionType] = useState('')
  const [goal, setGoal] = useState('')

  const isTask = type === 'task'
  const isLevel = type === 'level'
  const difficultyOptions = useMemo(() => (isTask ? TASK_DIFFICULTIES : LEVEL_DIFFICULTIES), [isTask])
  const componentOptions = useMemo(
    () =>
      isTask
        ? TASK_COMPONENTS.map((c) => ({ ...c, description: `${c.description} (${c.screen})` }))
        : LESSON_COMPONENTS.map((c) => ({ ...c, description: `${c.description} (${c.types.join(', ')})` })),
    [isTask],
  )

  useEffect(() => {
    if (!isEditing) return
    api
      .get(`/admin/content/${id}`)
      .then((res) => {
        const c = res.data.data
        setTitle(c.title ?? '')
        setType(c.type ?? 'task')
        setCategory(c.category ?? '')
        setScreenType(c.screen_type ?? '')
        setComponentType(c.component_type ?? '')
        setTheme(c.theme ?? '')
        setLayout(c.layout ?? '')
        setAnimation(c.animation ?? '')
        setXpReward(c.xp_reward ?? 10)
        setDifficulty(c.difficulty ?? 'easy')
        setOrder(c.order ?? 0)
        setEstimatedTime(c.estimated_time ?? 3)
        setThumbnail(c.thumbnail ?? '')
        setTags(c.tags?.join(', ') ?? '')
        setBlocks(c.blocks ?? [])
        setStyle(c.style ?? {})
        setCompletionType(c.completion_type ?? '')
        setGoal(c.goal ?? '')
      })
      .catch(() => toast.error('Failed to load content'))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload: Record<string, unknown> = {
      title,
      type,
      category,
      screen_type: screenType,
      component_type: componentType,
      theme,
      layout,
      animation,
      xp_reward: xpReward,
      difficulty,
      order,
      estimated_time: estimatedTime,
      thumbnail: thumbnail || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      blocks,
      style: Object.keys(style).length > 0 ? style : undefined,
    }

    if (isTask && completionType) payload.completion_type = completionType
    if (isLevel && goal) payload.goal = goal

    try {
      if (isEditing) {
        await api.put(`/admin/content/${id}`, payload)
        toast.success('Content updated!')
      } else {
        await api.post('/admin/content', payload)
        toast.success('Content created!')
      }
      navigate(isTask ? '/tasks' : '/levels')
    } catch {
      toast.error('Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Content' : 'Create New Content'}
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {isEditing
            ? 'Update your content configuration'
            : `Build a new ${isTask ? 'task' : 'level'} with the block builder`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ═══ Basic Info ═══ */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/50 mb-1.5">Title</label>
              <input
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Type</label>
              <select
                className="input-field"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as ContentType)
                  setCategory('')
                  setScreenType('')
                  setComponentType('')
                  setCompletionType('')
                }}
              >
                <option value="task">Task (Daily Mission)</option>
                <option value="level">Level (Learning Journey)</option>
              </select>
            </div>
            <SelectField
              label="Difficulty"
              value={difficulty}
              onChange={(v) => setDifficulty(v as DifficultyLevel)}
              options={difficultyOptions}
            />
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">XP Reward</label>
              <input type="number" className="input-field" value={xpReward} onChange={(e) => setXpReward(parseInt(e.target.value) || 0)} min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Order</label>
              <input type="number" className="input-field" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Estimated Time (min)</label>
              <input type="number" className="input-field" value={estimatedTime} onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)} min={1} />
            </div>
          </div>
        </section>

        {/* ═══ Task-specific ═══ */}
        {isTask && (
          <section className="glass-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Task Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Category" value={category} onChange={setCategory} options={TASK_CATEGORIES} placeholder="Select task category..." />
              <SelectField label="Completion Type" value={completionType} onChange={setCompletionType} options={COMPLETION_TYPES} placeholder="How the task is completed..." />
            </div>
          </section>
        )}

        {/* ═══ Level-specific ═══ */}
        {isLevel && (
          <section className="glass-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Level Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Theme" value={theme} onChange={setTheme} options={LEVEL_THEMES} placeholder="Select level theme..." />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/50 mb-1.5">Goal Description</label>
                <input className="input-field" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What the student will achieve in this level..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Available Lesson Types</h3>
                <div className="space-y-2">
                  {LESSON_TYPES.map((lt) => (
                    <div key={lt.value} className="flex items-center gap-2 text-sm">
                      <span>{lt.icon}</span>
                      <span className="text-white/70 font-medium">{lt.label}</span>
                      <span className="text-white/30 text-xs">— {lt.description}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Available Mini Games</h3>
                <div className="space-y-2">
                  {MINI_GAME_TYPES.map((mg) => (
                    <div key={mg.value} className="flex items-center gap-2 text-sm">
                      <span>{mg.icon}</span>
                      <span className="text-white/70 font-medium">{mg.label}</span>
                      <span className="text-white/30 text-xs">— {mg.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ Screen & Component ═══ */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Screen & Component</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Screen Type" value={screenType} onChange={setScreenType} options={SCREEN_TYPES} placeholder="Select screen type..." />
            <SelectField label="Component" value={componentType} onChange={setComponentType} options={componentOptions} placeholder="Select component..." />
            <SelectField label="Layout" value={layout} onChange={setLayout} options={LAYOUTS} placeholder="Select layout..." />
            <SelectField label="Animation" value={animation} onChange={setAnimation} options={ANIMATIONS} placeholder="Select animation..." />
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Thumbnail URL</label>
              <input className="input-field" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Tags (comma-separated)</label>
              <input className="input-field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="salah, beginner, morning" />
            </div>
          </div>
        </section>

        {/* ═══ Style ═══ */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Style Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['background', 'card_color', 'text_color', 'accent_color'] as const).map((field) => {
              const labels: Record<string, string> = { background: 'Background', card_color: 'Card Color', text_color: 'Text Color', accent_color: 'Accent Color' }
              const defaults: Record<string, string> = { background: '#0F3D2E', card_color: '#145A42', text_color: '#FFFFFF', accent_color: '#FFD700' }
              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">{labels[field]}</label>
                  <div className="flex gap-2">
                    <input type="color" className="w-10 h-10 rounded-lg cursor-pointer border-0" value={(style as Record<string, unknown>)[field] as string || defaults[field]} onChange={(e) => setStyle({ ...style, [field]: e.target.value })} />
                    <input className="input-field text-xs flex-1" value={(style as Record<string, unknown>)[field] as string || ''} onChange={(e) => setStyle({ ...style, [field]: e.target.value })} placeholder={defaults[field]} />
                  </div>
                </div>
              )
            })}
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Border Radius</label>
              <input type="number" className="input-field" value={style.border_radius ?? ''} onChange={(e) => setStyle({ ...style, border_radius: parseInt(e.target.value) || 0 })} placeholder="20" />
            </div>
            <SelectField label="Font Family" value={style.font_family ?? ''} onChange={(v) => setStyle({ ...style, font_family: v })} options={FONT_FAMILIES} placeholder="Select font..." />
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">Padding</label>
              <input type="number" className="input-field" value={style.padding ?? ''} onChange={(e) => setStyle({ ...style, padding: parseInt(e.target.value) || 0 })} placeholder="16" />
            </div>
          </div>
        </section>

        {/* ═══ Block Builder ═══ */}
        <BlockBuilder blocks={blocks} onChange={setBlocks} />

        {/* ═══ Available Resources Reference ═══ */}
        <section className="glass-card p-6">
          <details>
            <summary className="text-sm font-semibold text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors">
              Available Content Blocks Reference
            </summary>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
              {BLOCK_TYPES.map((bt) => (
                <div key={bt.value} className="bg-white/5 rounded-xl p-3 text-center">
                  <span className="text-2xl block mb-1">{bt.icon}</span>
                  <span className="text-xs font-semibold text-white/70 block">{bt.label}</span>
                  <span className="text-[10px] text-white/30 block mt-0.5">{bt.description}</span>
                </div>
              ))}
            </div>
          </details>
        </section>

        {/* ═══ Submit ═══ */}
        <div className="flex items-center justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isEditing ? 'Update Content' : 'Create Content'}
          </button>
        </div>
      </form>
    </div>
  )
}
