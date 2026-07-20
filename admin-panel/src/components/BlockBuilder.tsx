import { useState, useCallback } from "react";
import type { Block, BlockType } from "../types";
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const BLOCK_TYPES: { type: BlockType; label: string; emoji: string }[] = [
  { type: "TextBlock", label: "Text", emoji: "📝" },
  { type: "AyahBlock", label: "Ayah", emoji: "📖" },
  { type: "HadithBlock", label: "Hadith", emoji: "📜" },
  { type: "CounterBlock", label: "Counter", emoji: "🔢" },
  { type: "QuizBlock", label: "Quiz", emoji: "❓" },
  { type: "AudioBlock", label: "Audio", emoji: "🔊" },
  { type: "ChecklistBlock", label: "Checklist", emoji: "✅" },
  { type: "FlashCardBlock", label: "Flash Card", emoji: "🃏" },
  { type: "DragDropBlock", label: "Drag & Drop", emoji: "🔀" },
  { type: "MatchBlock", label: "Match", emoji: "🔗" },
  { type: "RewardBlock", label: "Reward", emoji: "🏆" },
  { type: "ImageBlock", label: "Image", emoji: "🖼️" },
  { type: "VideoBlock", label: "Video", emoji: "🎬" },
  { type: "VoicePracticeBlock", label: "Voice Practice", emoji: "🎙️" },
];

interface BlockBuilderProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export default function BlockBuilder({ blocks, onChange }: BlockBuilderProps) {
  const [showPicker, setShowPicker] = useState(false);

  const addBlock = useCallback(
    (type: BlockType) => {
      onChange([...blocks, { type, content: {} }]);
      setShowPicker(false);
    },
    [blocks, onChange],
  );

  const removeBlock = useCallback(
    (index: number) => {
      onChange(blocks.filter((_, i) => i !== index));
    },
    [blocks, onChange],
  );

  const moveBlock = useCallback(
    (index: number, direction: -1 | 1) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= blocks.length) return;
      const updated = [...blocks];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      onChange(updated);
    },
    [blocks, onChange],
  );

  const updateBlockContent = useCallback(
    (index: number, key: string, value: unknown) => {
      const updated = [...blocks];
      updated[index] = {
        ...updated[index],
        content: { ...updated[index].content, [key]: value },
      };
      onChange(updated);
    },
    [blocks, onChange],
  );

  return (
    <div>
      {/* Picker */}
      {showPicker && (
        <div className="dq-inset mb-3.5 grid grid-cols-3 gap-2.5 p-4 sm:grid-cols-5 lg:grid-cols-7">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              onClick={() => addBlock(bt.type)}
              className="flex flex-col items-center gap-2 rounded-xl border-[1.5px] border-ink-500 bg-ink-700 px-1 py-3 text-center transition-colors hover:border-teal-edge hover:bg-teal/[0.06]"
            >
              <span className="text-[20px] leading-none">{bt.emoji}</span>
              <span className="text-[10.5px] font-extrabold leading-tight text-fg-dim">
                {bt.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Block list */}
      {blocks.map((block, index) => {
        const meta = BLOCK_TYPES.find((bt) => bt.type === block.type);
        return (
          <div key={index} className="dq-inset mb-3.5 p-4">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="grid h-[34px] w-[34px] flex-shrink-0 place-items-center rounded-[10px] bg-teal-tint text-[16px] leading-none">
                {meta?.emoji ?? "🧩"}
              </span>
              <span className="text-[13.5px] font-extrabold text-fg">
                {meta?.label ?? block.type}
              </span>
              <span className="dq-badge dq-badge-neutral !px-2 !py-0.5 !text-[10px]">
                #{index + 1}
              </span>
              <div className="ml-auto flex gap-1.5">
                <button
                  type="button"
                  onClick={() => moveBlock(index, -1)}
                  className="dq-icon-btn-sm"
                  disabled={index === 0}
                  title="Move up"
                >
                  <ArrowUpIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, 1)}
                  className="dq-icon-btn-sm"
                  disabled={index === blocks.length - 1}
                  title="Move down"
                >
                  <ArrowDownIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  className="dq-icon-btn-sm dq-icon-btn-danger"
                  title="Remove block"
                >
                  <TrashIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              </div>
            </div>

            <BlockContentEditor
              block={block}
              onUpdate={(key, value) => updateBlockContent(index, key, value)}
            />
          </div>
        );
      })}

      {blocks.length === 0 && !showPicker && (
        <div className="dq-inset p-8 text-center text-[13px] font-semibold text-fg-faint">
          No blocks yet. Add one to start building this task.
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="dq-add mt-3.5"
      >
        {showPicker ? (
          "Close picker"
        ) : (
          <>
            <PlusIcon className="mr-1 inline h-4 w-4 align-[-3px]" strokeWidth={2.6} />
            Add a block
          </>
        )}
      </button>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-extrabold text-fg-dim">
        {label}
      </label>
      {children}
    </div>
  );
}

function BlockContentEditor({
  block,
  onUpdate,
}: {
  block: Block;
  onUpdate: (key: string, value: unknown) => void;
}) {
  switch (block.type) {
    case "TextBlock":
      return (
        <Labeled label="Text">
          <textarea
            className="dq-input-sm min-h-[80px] leading-relaxed"
            placeholder="Enter text content…"
            value={(block.content.text as string) ?? ""}
            onChange={(e) => onUpdate("text", e.target.value)}
          />
        </Labeled>
      );
    case "AyahBlock":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Surah">
            <input
              className="dq-input-sm"
              placeholder="Al-Fatihah"
              value={(block.content.surah as string) ?? ""}
              onChange={(e) => onUpdate("surah", e.target.value)}
            />
          </Labeled>
          <Labeled label="Ayah numbers">
            <input
              className="dq-input-sm"
              placeholder="1,2,3"
              value={(block.content.ayahs as string) ?? ""}
              onChange={(e) => onUpdate("ayahs", e.target.value)}
            />
          </Labeled>
        </div>
      );
    case "HadithBlock":
      return (
        <div className="space-y-3">
          <Labeled label="Source">
            <input
              className="dq-input-sm"
              placeholder="Bukhari 6018"
              value={(block.content.source as string) ?? ""}
              onChange={(e) => onUpdate("source", e.target.value)}
            />
          </Labeled>
          <Labeled label="Hadith text">
            <textarea
              className="dq-input-sm min-h-[60px] leading-relaxed"
              placeholder="Hadith text…"
              value={(block.content.text as string) ?? ""}
              onChange={(e) => onUpdate("text", e.target.value)}
            />
          </Labeled>
        </div>
      );
    case "RewardBlock":
      return (
        <Labeled label="XP reward">
          <input
            className="dq-input-sm"
            type="number"
            placeholder="50"
            value={(block.content.xp as number) ?? ""}
            onChange={(e) => onUpdate("xp", parseInt(e.target.value) || 0)}
          />
        </Labeled>
      );
    case "QuizBlock":
      return (
        <div className="space-y-3">
          <Labeled label="Question">
            <input
              className="dq-input-sm"
              placeholder="Ask something…"
              value={(block.content.question as string) ?? ""}
              onChange={(e) => onUpdate("question", e.target.value)}
            />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Options (comma-separated)">
              <input
                className="dq-input-sm"
                placeholder="A, B, C"
                value={(block.content.options as string) ?? ""}
                onChange={(e) => onUpdate("options", e.target.value)}
              />
            </Labeled>
            <Labeled label="Correct answer">
              <input
                className="dq-input-sm"
                value={(block.content.answer as string) ?? ""}
                onChange={(e) => onUpdate("answer", e.target.value)}
              />
            </Labeled>
          </div>
        </div>
      );
    case "CounterBlock":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Label">
            <input
              className="dq-input-sm"
              placeholder="SubhanAllah"
              value={(block.content.label as string) ?? ""}
              onChange={(e) => onUpdate("label", e.target.value)}
            />
          </Labeled>
          <Labeled label="Target count">
            <input
              className="dq-input-sm"
              type="number"
              placeholder="33"
              value={(block.content.target as number) ?? ""}
              onChange={(e) => onUpdate("target", parseInt(e.target.value) || 0)}
            />
          </Labeled>
        </div>
      );
    case "AudioBlock":
    case "ImageBlock":
    case "VideoBlock":
      return (
        <Labeled label="URL">
          <input
            className="dq-input-sm"
            placeholder="https://…"
            value={(block.content.url as string) ?? ""}
            onChange={(e) => onUpdate("url", e.target.value)}
          />
        </Labeled>
      );
    default:
      return (
        <Labeled label="Content (JSON)">
          <textarea
            className="dq-input-sm min-h-[70px] font-mono text-[12px] leading-relaxed"
            placeholder='{"key": "value"}'
            value={
              typeof block.content === "object"
                ? JSON.stringify(block.content, null, 2)
                : ""
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                // Update all keys
                Object.entries(parsed).forEach(([k, v]) => onUpdate(k, v));
              } catch {
                // ignore invalid JSON while typing
              }
            }}
          />
        </Labeled>
      );
  }
}
