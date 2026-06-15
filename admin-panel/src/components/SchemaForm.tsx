import { useState } from "react";
import { SparklesIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { ContentSchema, SchemaField } from "../types";

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
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white/80">
            {schema.icon} {schema.label}
          </p>
          <p className="text-xs text-white/40 mt-0.5">{schema.description}</p>
        </div>
        <button
          type="button"
          onClick={insertExample}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 rounded-lg px-2.5 py-1.5"
          title="Fill all fields with a ready-made example"
        >
          <SparklesIcon className="w-4 h-4" /> Insert example
        </button>
      </div>

      {schema.fields.map((field) => (
        <FieldEditor
          key={field.key}
          field={field}
          value={value[field.key]}
          onChange={(v) => set(field.key, v)}
        />
      ))}

      <details className="text-xs">
        <summary className="cursor-pointer text-white/40 hover:text-white/60 select-none">
          View data JSON
        </summary>
        <pre className="mt-2 p-3 rounded-lg bg-black/30 text-white/60 overflow-x-auto text-[11px] leading-relaxed">
          {JSON.stringify(value ?? {}, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: SchemaField;
  value: any;
  onChange: (v: any) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1">
        {field.label}
        {field.required && <span className="text-red-400"> *</span>}
        {field.help && (
          <span className="ml-2 text-white/30 font-normal">{field.help}</span>
        )}
      </label>
      <FieldInput field={field} value={value} onChange={onChange} />
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

  switch (field.type) {
    case "text":
    case "arabic":
    case "select":
      return (
        <input
          className="input-field text-sm"
          dir={isArabic ? "rtl" : undefined}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "textarea":
      return (
        <textarea
          className="input-field text-sm font-mono"
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
          className="input-field text-sm"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      );

    case "boolean":
      return (
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            className="w-4 h-4 accent-emerald-500"
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
          className="input-field text-sm"
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
            className="input-field text-sm flex-1"
            dir="rtl"
            placeholder="Left"
            value={p.left ?? ""}
            onChange={(e) => update(i, "left", e.target.value)}
          />
          <span className="text-white/30">→</span>
          <input
            className="input-field text-sm flex-1"
            placeholder="Right"
            value={p.right ?? ""}
            onChange={(e) => update(i, "right", e.target.value)}
          />
          <button
            type="button"
            onClick={() => onChange(pairs.filter((_, idx) => idx !== i))}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...pairs, { left: "", right: "" }])}
        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
      >
        <PlusIcon className="w-4 h-4" /> Add pair
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
        className={`input-field text-sm font-mono ${error ? "border-red-500/60" : ""}`}
        rows={Math.min(14, Math.max(4, text.split("\n").length + 1))}
        value={text}
        spellCheck={false}
        onChange={(e) => commit(e.target.value)}
      />
      {error && <p className="text-xs text-red-400 mt-1">JSON error: {error}</p>}
    </div>
  );
}
