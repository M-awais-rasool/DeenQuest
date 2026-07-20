import { useState } from "react";
import { SparklesIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { ContentSchema, SchemaField } from "../types";
import { ComponentGlyph } from "../lib/componentIcons";

interface Props {
  schema: ContentSchema;
  value: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
}

/**
 * Renders an editor for a single component's `data`/`content` map, driven by
 * its registry schema. Each field type gets an appropriate input, plus an
 * "Insert example" button so the admin always has a working starting point.
 */
export default function SchemaForm({ schema, value, onChange }: Props) {
  const set = (key: string, v: any) => onChange({ ...value, [key]: v });

  const insertExample = () => onChange(structuredClone(schema.example ?? {}));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-[9px]">
          <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-teal-tint">
            <ComponentGlyph name={schema.name} emoji={schema.icon} size={15} />
          </span>
          <span className="text-[13px] font-extrabold text-fg">
            {schema.label} fields
          </span>
        </div>
        <button
          type="button"
          onClick={insertExample}
          className="dq-btn-outline flex-shrink-0"
          title="Fill all fields with a ready-made example"
        >
          <SparklesIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
          Insert example
        </button>
      </div>

      {schema.fields.map((field) => (
        <div key={field.key} className="mt-3">
          <label className="mb-1.5 block text-xs font-extrabold text-fg-dim">
            {field.label}
            {field.required && <span className="text-rose"> *</span>}
            {field.help && (
              <span className="ml-2 font-semibold text-fg-faint">
                {field.help}
              </span>
            )}
          </label>
          <FieldInput
            field={field}
            value={value[field.key]}
            onChange={(v) => set(field.key, v)}
          />
        </div>
      ))}

      <details className="mt-3.5">
        <summary className="cursor-pointer select-none text-xs font-extrabold text-fg-dimmer transition-colors hover:text-fg-dim">
          ▸ View data JSON
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-[10px] border border-ink-500 bg-ink-900 p-3 text-[11px] leading-relaxed text-fg-dim">
          {JSON.stringify(value ?? {}, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: SchemaField;
  value: any;
  onChange: (v: any) => void;
}) {
  const isArabic = field.type === "arabic" || field.type === "arabic_list";
  const arabicClass = isArabic ? "font-arabic text-base text-teal-light" : "";

  switch (field.type) {
    case "text":
    case "arabic":
    case "select":
      return (
        <input
          className={`dq-input-sm ${arabicClass}`}
          dir={isArabic ? "rtl" : undefined}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "textarea":
      return (
        <textarea
          className={`dq-input-sm leading-relaxed ${arabicClass}`}
          dir={isArabic ? "rtl" : undefined}
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <input
          type="number"
          className="dq-input-sm"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      );

    case "boolean":
      return (
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-bold text-fg-dim">
          <input
            type="checkbox"
            className="h-4 w-4 accent-teal"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          {value ? "True" : "False"}
        </label>
      );

    case "string_list":
    case "arabic_list":
      return (
        <textarea
          className={`dq-input-sm leading-[1.9] ${arabicClass}`}
          dir={isArabic ? "rtl" : undefined}
          rows={Math.max(3, (Array.isArray(value) ? value.length : 0) + 1)}
          placeholder="One item per line"
          value={(Array.isArray(value) ? value : []).join("\n")}
          onChange={(e) =>
            onChange(
              e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
            )
          }
        />
      );

    case "pairs":
      return <PairsEditor value={value} onChange={onChange} />;

    default:
      // json / options / anything complex → guided JSON editor.
      return <JsonField value={value} onChange={onChange} />;
  }
}

function PairsEditor({
  value,
  onChange,
}: {
  value: any;
  onChange: (v: any) => void;
}) {
  const pairs: { left: string; right: string }[] = Array.isArray(value)
    ? value
    : [];
  const update = (i: number, key: "left" | "right", v: string) => {
    const next = pairs.map((p, idx) => (idx === i ? { ...p, [key]: v } : p));
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {pairs.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="dq-input-sm flex-1 font-arabic text-base text-teal-light"
            dir="rtl"
            placeholder="Left"
            value={p.left ?? ""}
            onChange={(e) => update(i, "left", e.target.value)}
          />
          <span className="flex-shrink-0 font-black text-fg-faint">→</span>
          <input
            className="dq-input-sm flex-1"
            placeholder="Right"
            value={p.right ?? ""}
            onChange={(e) => update(i, "right", e.target.value)}
          />
          <button
            type="button"
            onClick={() => onChange(pairs.filter((_, idx) => idx !== i))}
            className="dq-icon-btn-sm dq-icon-btn-danger flex-shrink-0"
          >
            <TrashIcon className="h-[15px] w-[15px]" strokeWidth={2.2} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...pairs, { left: "", right: "" }])}
        className="flex items-center gap-1.5 text-xs font-extrabold text-teal-light transition-colors hover:text-teal"
      >
        <PlusIcon className="h-4 w-4" strokeWidth={2.6} /> Add pair
      </button>
    </div>
  );
}

function JsonField({
  value,
  onChange,
}: {
  value: any;
  onChange: (v: any) => void;
}) {
  const [text, setText] = useState(() =>
    value === undefined ? "" : JSON.stringify(value, null, 2),
  );
  const [error, setError] = useState<string | null>(null);

  const commit = (raw: string) => {
    setText(raw);
    if (raw.trim() === "") {
      setError(null);
      onChange(undefined);
      return;
    }
    try {
      onChange(JSON.parse(raw));
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "Invalid JSON");
    }
  };

  return (
    <div>
      <textarea
        className={`dq-input-sm font-mono text-[12px] leading-relaxed ${
          error ? "!border-rose" : ""
        }`}
        rows={Math.min(14, Math.max(4, text.split("\n").length + 1))}
        value={text}
        spellCheck={false}
        onChange={(e) => commit(e.target.value)}
      />
      {error && (
        <p className="mt-1 text-[11px] font-bold text-rose">
          JSON error: {error}
        </p>
      )}
    </div>
  );
}
