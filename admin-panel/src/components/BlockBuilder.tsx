import { useState, useCallback } from 'react'
import type { Block, BlockType } from '../types'
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'

const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: 'TextBlock', label: 'Text', icon: '📝' },
  { type: 'AyahBlock', label: 'Ayah', icon: '📖' },
  { type: 'HadithBlock', label: 'Hadith', icon: '📜' },
  { type: 'CounterBlock', label: 'Counter', icon: '🔢' },
  { type: 'QuizBlock', label: 'Quiz', icon: '❓' },
  { type: 'AudioBlock', label: 'Audio', icon: '🔊' },
  { type: 'ChecklistBlock', label: 'Checklist', icon: '✅' },
  { type: 'FlashCardBlock', label: 'Flash Card', icon: '🃏' },
  { type: 'DragDropBlock', label: 'Drag & Drop', icon: '🔀' },
  { type: 'MatchBlock', label: 'Match', icon: '🔗' },
  { type: 'RewardBlock', label: 'Reward', icon: '🏆' },
  { type: 'ImageBlock', label: 'Image', icon: '🖼️' },
  { type: 'VideoBlock', label: 'Video', icon: '🎬' },
  { type: 'VoicePracticeBlock', label: 'Voice Practice', icon: '🎤' },
]

interface BlockBuilderProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
}

export default function BlockBuilder({ blocks, onChange }: BlockBuilderProps) {
  const [showPicker, setShowPicker] = useState(false)

  const addBlock = useCallback(
    (type: BlockType) => {
      onChange([...blocks, { type, content: {} }])
      setShowPicker(false)
    },
    [blocks, onChange],
  )

  const removeBlock = useCallback(
    (index: number) => {
      onChange(blocks.filter((_, i) => i !== index))
    },
    [blocks, onChange],
  )

  const moveBlock = useCallback(
    (index: number, direction: -1 | 1) => {
      const newIndex = index + direction
      if (newIndex < 0 || newIndex >= blocks.length) return
      const updated = [...blocks]
      ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
      onChange(updated)
    },
    [blocks, onChange],
  )

  const updateBlockContent = useCallback(
    (index: number, key: string, value: unknown) => {
      const updated = [...blocks]
      updated[index] = {
        ...updated[index],
        content: { ...updated[index].content, [key]: value },
      }
      onChange(updated)
    },
    [blocks, onChange],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">Content Blocks</h3>
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="btn-primary text-xs flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> Add Block
        </button>
      </div>

      {/* Block Picker */}
      {showPicker && (
        <div className="glass-card p-4 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              onClick={() => addBlock(bt.type)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/10 transition-colors text-center"
            >
              <span className="text-2xl">{bt.icon}</span>
              <span className="text-[10px] text-white/60 font-medium">{bt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Block List */}
      <div className="space-y-3">
        {blocks.map((block, index) => {
          const meta = BLOCK_TYPES.find((bt) => bt.type === block.type)
          return (
            <div
              key={index}
              className="glass-card p-4 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta?.icon ?? '📦'}</span>
                  <span className="text-sm font-semibold text-white/80">
                    {meta?.label ?? block.type}
                  </span>
                  <span className="badge bg-white/5 text-white/30 text-[10px]">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => moveBlock(index, -1)}
                    className="p-1.5 rounded-lg hover:bg-white/10"
                    disabled={index === 0}
                  >
                    <ArrowUpIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, 1)}
                    className="p-1.5 rounded-lg hover:bg-white/10"
                    disabled={index === blocks.length - 1}
                  >
                    <ArrowDownIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(index)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Simple content editor based on block type */}
              <BlockContentEditor
                block={block}
                onUpdate={(key, value) => updateBlockContent(index, key, value)}
              />
            </div>
          )
        })}
      </div>

      {blocks.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-white/30 text-sm">
            No blocks added yet. Click "Add Block" to start building content.
          </p>
        </div>
      )}
    </div>
  )
}

function BlockContentEditor({
  block,
  onUpdate,
}: {
  block: Block
  onUpdate: (key: string, value: unknown) => void
}) {
  switch (block.type) {
    case 'TextBlock':
      return (
        <textarea
          className="input-field text-sm min-h-[80px]"
          placeholder="Enter text content..."
          value={(block.content.text as string) ?? ''}
          onChange={(e) => onUpdate('text', e.target.value)}
        />
      )
    case 'AyahBlock':
      return (
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input-field text-sm"
            placeholder="Surah name"
            value={(block.content.surah as string) ?? ''}
            onChange={(e) => onUpdate('surah', e.target.value)}
          />
          <input
            className="input-field text-sm"
            placeholder="Ayah numbers (e.g., 1,2,3)"
            value={(block.content.ayahs as string) ?? ''}
            onChange={(e) => onUpdate('ayahs', e.target.value)}
          />
        </div>
      )
    case 'HadithBlock':
      return (
        <div className="space-y-3">
          <input
            className="input-field text-sm"
            placeholder="Hadith source (e.g., Bukhari 6018)"
            value={(block.content.source as string) ?? ''}
            onChange={(e) => onUpdate('source', e.target.value)}
          />
          <textarea
            className="input-field text-sm min-h-[60px]"
            placeholder="Hadith text..."
            value={(block.content.text as string) ?? ''}
            onChange={(e) => onUpdate('text', e.target.value)}
          />
        </div>
      )
    case 'RewardBlock':
      return (
        <input
          className="input-field text-sm"
          type="number"
          placeholder="XP reward amount"
          value={(block.content.xp as number) ?? ''}
          onChange={(e) => onUpdate('xp', parseInt(e.target.value) || 0)}
        />
      )
    case 'QuizBlock':
      return (
        <div className="space-y-3">
          <input
            className="input-field text-sm"
            placeholder="Question"
            value={(block.content.question as string) ?? ''}
            onChange={(e) => onUpdate('question', e.target.value)}
          />
          <input
            className="input-field text-sm"
            placeholder="Options (comma-separated)"
            value={(block.content.options as string) ?? ''}
            onChange={(e) => onUpdate('options', e.target.value)}
          />
          <input
            className="input-field text-sm"
            placeholder="Correct answer"
            value={(block.content.answer as string) ?? ''}
            onChange={(e) => onUpdate('answer', e.target.value)}
          />
        </div>
      )
    case 'CounterBlock':
      return (
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input-field text-sm"
            placeholder="Label (e.g., SubhanAllah)"
            value={(block.content.label as string) ?? ''}
            onChange={(e) => onUpdate('label', e.target.value)}
          />
          <input
            className="input-field text-sm"
            type="number"
            placeholder="Target count"
            value={(block.content.target as number) ?? ''}
            onChange={(e) => onUpdate('target', parseInt(e.target.value) || 0)}
          />
        </div>
      )
    case 'AudioBlock':
    case 'ImageBlock':
    case 'VideoBlock':
      return (
        <input
          className="input-field text-sm"
          placeholder="URL"
          value={(block.content.url as string) ?? ''}
          onChange={(e) => onUpdate('url', e.target.value)}
        />
      )
    default:
      return (
        <textarea
          className="input-field text-sm min-h-[60px] font-mono text-xs"
          placeholder='{"key": "value"}'
          value={
            typeof block.content === 'object'
              ? JSON.stringify(block.content, null, 2)
              : ''
          }
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              // Update all keys
              Object.entries(parsed).forEach(([k, v]) => onUpdate(k, v))
            } catch {
              // ignore invalid JSON while typing
            }
          }}
        />
      )
  }
}
