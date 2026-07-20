import {
  DevicePhoneMobileIcon,
  SpeakerWaveIcon,
  LightBulbIcon,
  MicrophoneIcon,
  BookOpenIcon,
  BoltIcon,
  AcademicCapIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

/**
 * A lightweight mobile mockup that renders a lesson component / mini-game the
 * way the learner sees it — so the admin understands what each component does
 * without knowing its internal name. Approximate, not pixel-perfect.
 */
export default function LessonPreview({
  kind,
  name,
  data,
}: {
  kind: "lesson" | "mini_game";
  name: string;
  data: Record<string, any>;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-[7px] text-[11px] font-extrabold text-fg-dimmer">
        <DevicePhoneMobileIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
        Learner preview
      </div>
      <div className="w-[300px] overflow-hidden rounded-phone border-[6px] border-[#05100F] bg-ink-800 shadow-phone">
        {/* Notch */}
        <div className="flex h-[26px] items-center justify-center bg-ink-800">
          <span className="h-1.5 w-14 rounded-[4px] bg-ink-500" />
        </div>
        <div className="max-h-[440px] min-h-[300px] overflow-y-auto px-[18px] pb-[22px] text-fg">
          {/* Lesson progress, purely decorative */}
          <div className="mb-4 flex gap-[5px]">
            <span className="h-[7px] flex-1 rounded-[4px] bg-teal" />
            <span className="h-[7px] flex-1 rounded-[4px] bg-teal" />
            <span className="h-[7px] flex-1 rounded-[4px] bg-ink-300" />
          </div>
          {kind === "lesson"
            ? renderLesson(name, data ?? {})
            : renderGame(name, data ?? {})}
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI atoms (mobile look) ───

function Ar({ children, className = "" }: { children: any; className?: string }) {
  return (
    <span dir="rtl" className={`font-arabic leading-relaxed ${className}`}>
      {children}
    </span>
  );
}

function Chip({ children, tone = "idle" }: { children: any; tone?: string }) {
  const tones: Record<string, string> = {
    idle: "bg-ink-600 border-ink-400 text-fg",
    correct: "bg-teal-tint border-teal text-teal-light",
    selected: "bg-teal/10 border-teal-edge text-teal-light",
  };
  return (
    <span
      className={`inline-flex items-center rounded-xl border-2 px-3 py-2 font-arabic text-lg ${
        tones[tone] ?? tones.idle
      }`}
    >
      {children}
    </span>
  );
}

function Title({ children }: { children: any }) {
  return (
    <p className="mb-3 text-[13px] font-extrabold text-fg-dimmer">{children}</p>
  );
}

function Question({ children }: { children: any }) {
  return <p className="text-lg font-black leading-snug text-fg">{children}</p>;
}

function Hint({ text, arabic }: { text?: string; arabic?: string }) {
  if (!text && !arabic) return null;
  return (
    <div className="mt-3 flex items-center gap-[7px] rounded-[10px] bg-gold-tile px-3 py-2.5">
      <LightBulbIcon className="h-3.5 w-3.5 flex-shrink-0 text-gold" strokeWidth={2.2} />
      <span className="text-[11.5px] font-bold text-gold">
        {text} {arabic && <Ar className="text-base">{arabic}</Ar>}
      </span>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center px-4 text-center text-xs font-semibold text-fg-faint">
      Add data to preview the {label}
    </div>
  );
}

/** Card-style surface used for ayah / dua / hadith bodies. */
function Panel({
  children,
  accent,
}: {
  children: any;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border-2 p-4 ${
        accent ? "border-teal-edge bg-teal-tint/50" : "border-ink-400 bg-ink-600"
      }`}
    >
      {children}
    </div>
  );
}

// ─── Lesson renderers ───

function renderLesson(name: string, d: Record<string, any>) {
  switch (name) {
    case "LetterIntroComponent":
      return <LettersPreview d={d} />;
    case "LetterFormsComponent":
      return <FormsPreview d={d} />;
    case "PronunciationComponent":
      return <PronPreview d={d} />;
    case "DuaCardComponent":
      return <CardPreview arabic={d.arabic} meaning={d.meaning} sub={d.context} />;
    case "HadithComponent":
      return <HadithPreview d={d} />;
    case "QuranReaderComponent":
      return (
        <CardPreview arabic={d.text} meaning={d.meaning} badge={d.surah} mic />
      );
    case "TipsComponent":
      return <BulletsPreview items={d.tips} />;
    case "PrayerChecklistComponent":
      return <ChecklistPreview items={d.steps} />;
    case "ReflectionComponent":
      return <ChoicePreview question={d.question} options={d.options} />;
    case "MCQComponent":
      return (
        <ChoicePreview
          question={d.question}
          options={d.options}
          correct={d.correct}
          hint={d.hint}
          hintArabic={d.hintArabic}
        />
      );
    case "ListenChooseComponent":
      return (
        <ChoicePreview
          question="Tap what you hear"
          options={d.options}
          correct={d.correct}
        />
      );
    case "LightningRoundComponent":
      return <LightningPreview d={d} />;
    case "TrueFalseComponent":
      return <TrueFalsePreview d={d} />;
    case "FillBlankComponent":
      return <FillBlankPreview d={d} />;
    case "AyahBuilderComponent":
      return (
        <TilesPreview
          instruction={d.instruction}
          parts={d.parts}
          distractors={d.distractors}
        />
      );
    case "MatchPairsComponent":
      return <PairsPreview instruction={d.instruction} pairs={d.pairs} />;
    case "SortBucketsComponent":
      return <SortPreview d={d} />;
    case "LetterHuntComponent":
      return <HuntPreview d={d} />;
    case "CertificateComponent":
      return <CertificatePreview d={d} />;
    default:
      return <GenericPreview d={d} />;
  }
}

function renderGame(name: string, d: Record<string, any>) {
  switch (name) {
    case "mcq": {
      const q = (d.questions ?? [])[0] ?? {};
      return (
        <ChoicePreview
          question={q.question}
          options={q.options}
          correct={q.correct}
          hint={q.hint}
          hintArabic={q.hintArabic}
        />
      );
    }
    case "listen_choose": {
      const q = (d.questions ?? [])[0] ?? {};
      return (
        <ChoicePreview
          question="Tap what you hear"
          options={q.options}
          correct={q.correct}
        />
      );
    }
    case "tap_match":
    case "memory_cards":
      return <PairsPreview instruction="Match the pairs" pairs={d.pairs} />;
    case "drag_drop": {
      const r = (d.rounds ?? [])[0] ?? {};
      return <DragPreview round={r} />;
    }
    default:
      return <GenericPreview d={d} />;
  }
}

// ─── Concrete previews ───

function LettersPreview({ d }: { d: any }) {
  const letters = Array.isArray(d.letters)
    ? d.letters
    : d.letter
      ? [{ letter: d.letter, name: d.name }]
      : [];
  if (!letters.length) return <Empty label="letters" />;
  return (
    <div>
      <Title>Tap each letter to hear it</Title>
      <div className="grid grid-cols-2 gap-2.5">
        {letters.map((l: any, i: number) => (
          <div
            key={i}
            className="rounded-[14px] border-2 border-ink-400 bg-ink-600 p-3 text-center"
          >
            <Ar className="block text-3xl">{l.letter}</Ar>
            <span className="text-[11px] font-bold text-fg-dimmer">{l.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormsPreview({ d }: { d: any }) {
  const f = d.forms ?? {};
  const cells: [string, string][] = [
    ["Isolated", f.isolated],
    ["Initial", f.initial],
    ["Medial", f.medial],
    ["Final", f.final],
  ];
  return (
    <div>
      <Title>One letter, four shapes</Title>
      <div className="grid grid-cols-2 gap-2.5">
        {cells.map(([label, v]) => (
          <div
            key={label}
            className="rounded-[14px] border-2 border-ink-400 bg-ink-600 p-3 text-center"
          >
            <Ar className="block text-3xl">{v || "—"}</Ar>
            <span className="text-[11px] font-bold text-fg-dimmer">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PronPreview({ d }: { d: any }) {
  const items = d.items ?? [];
  if (!items.length) return <Empty label="items" />;
  return (
    <div>
      <Title>Tap to hear</Title>
      <div className="space-y-2">
        {items.map((it: any, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border-2 border-ink-400 bg-ink-600 px-3 py-2.5"
          >
            <Ar className="text-2xl">{it.arabic}</Ar>
            <SpeakerWaveIcon className="h-4 w-4 text-teal" strokeWidth={2.2} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CardPreview({
  arabic,
  meaning,
  sub,
  badge,
  mic,
}: {
  arabic?: string;
  meaning?: string;
  sub?: string;
  badge?: string;
  mic?: boolean;
}) {
  if (!arabic) return <Empty label="card" />;
  return (
    <div className="space-y-3">
      {badge && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-tint px-2.5 py-1 text-[11px] font-extrabold text-teal-light">
          <BookOpenIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> {badge}
        </div>
      )}
      <Panel accent>
        <Ar className="block text-center text-2xl">{arabic}</Ar>
        {meaning && (
          <>
            <div className="mx-auto my-3 h-0.5 w-10 rounded bg-teal-edge" />
            <p className="text-center text-xs font-semibold text-fg-dim">
              {meaning}
            </p>
          </>
        )}
      </Panel>
      {sub && (
        <p className="text-center text-[11px] font-semibold text-fg-dimmer">
          {sub}
        </p>
      )}
      {mic && (
        <button className="dq-btn w-full py-2.5 text-[13px]">
          <MicrophoneIcon className="h-4 w-4" strokeWidth={2.4} /> Recite
        </button>
      )}
    </div>
  );
}

function HadithPreview({ d }: { d: any }) {
  if (!d.hadith) return <Empty label="hadith" />;
  return (
    <Panel>
      <ChatBubbleBottomCenterTextIcon
        className="h-6 w-6 text-teal/60"
        strokeWidth={2}
      />
      <p className="mt-3 text-sm font-bold leading-relaxed text-fg">{d.hadith}</p>
      <p className="mt-2 text-[11px] font-extrabold text-teal-light">
        — {d.reference}
      </p>
    </Panel>
  );
}

function BulletsPreview({ items }: { items?: string[] }) {
  if (!items?.length) return <Empty label="tips" />;
  return (
    <div className="space-y-2">
      {items.map((t, i) => (
        <div
          key={i}
          className="flex items-start gap-2.5 rounded-xl border-2 border-ink-400 bg-ink-600 px-3 py-2.5"
        >
          <LightBulbIcon
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold"
            strokeWidth={2.2}
          />
          <Ar className="flex-1 text-left text-sm text-fg">{t}</Ar>
        </div>
      ))}
    </div>
  );
}

function ChecklistPreview({ items }: { items?: string[] }) {
  if (!items?.length) return <Empty label="steps" />;
  return (
    <div className="space-y-2">
      {items.map((t, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-xl border-2 border-ink-400 bg-ink-600 px-3 py-2.5"
        >
          <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-md border-2 border-teal-edge text-teal">
            <CheckIcon className="h-3 w-3" strokeWidth={3} />
          </span>
          <Ar className="flex-1 text-left text-sm text-fg">{t}</Ar>
        </div>
      ))}
    </div>
  );
}

function ChoicePreview({
  question,
  options,
  correct,
  hint,
  hintArabic,
}: {
  question?: string;
  options?: string[];
  correct?: number;
  hint?: string;
  hintArabic?: string;
}) {
  if (!question && !options?.length) return <Empty label="question" />;
  return (
    <div>
      <Question>{question}</Question>
      <Hint text={hint} arabic={hintArabic} />
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        {(options ?? []).map((o, i) => (
          <div
            key={i}
            className={`rounded-[14px] border-2 py-4 text-center font-arabic text-[30px] leading-none ${
              i === correct
                ? "border-teal bg-teal-tint text-teal-light"
                : "border-ink-400 bg-ink-600 text-fg"
            }`}
          >
            {o}
          </div>
        ))}
      </div>
    </div>
  );
}

function LightningPreview({ d }: { d: any }) {
  const q = (d.questions ?? [])[0];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-extrabold text-fg-dimmer">
          <BoltIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> Lightning round
        </span>
        <span className="font-black text-teal-light">{d.seconds ?? 7}s</span>
      </div>
      {q ? (
        <ChoicePreview
          question={q.question}
          options={q.options}
          correct={q.correct}
        />
      ) : (
        <Empty label="questions" />
      )}
    </div>
  );
}

function TrueFalsePreview({ d }: { d: any }) {
  const r = (d.rounds ?? [])[0];
  if (!r) return <Empty label="rounds" />;
  return (
    <div className="space-y-3">
      <Question>{r.prompt}</Question>
      {r.arabic && (
        <Panel>
          <Ar className="block text-center text-3xl">{r.arabic}</Ar>
        </Panel>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border-2 border-teal bg-teal-tint py-2.5 text-center text-sm font-extrabold text-teal-light">
          True
        </div>
        <div className="rounded-xl border-2 border-ink-400 bg-ink-600 py-2.5 text-center text-sm font-extrabold text-fg-dim">
          False
        </div>
      </div>
    </div>
  );
}

function FillBlankPreview({ d }: { d: any }) {
  const sentence = d.sentence ?? [];
  if (!sentence.length) return <Empty label="sentence" />;
  return (
    <div>
      <Title>{d.instruction ?? "Complete the word"}</Title>
      <div className="flex flex-wrap justify-center gap-1.5" dir="rtl">
        {sentence.map((tok: any, i: number) =>
          tok.blank ? (
            <span
              key={i}
              className="rounded-xl border-2 border-dashed border-teal-edge px-5 py-2 text-teal/40"
            >
              ?
            </span>
          ) : (
            <Chip key={i}>{tok.text}</Chip>
          ),
        )}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5 border-t border-ink-500 pt-3">
        {(d.bank ?? []).map((b: string, i: number) => (
          <Chip key={i} tone="selected">
            {b}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function TilesPreview({
  instruction,
  parts,
  distractors,
}: {
  instruction?: string;
  parts?: string[];
  distractors?: string[];
}) {
  const all = [...(parts ?? []), ...(distractors ?? [])];
  if (!all.length) return <Empty label="parts" />;
  return (
    <div>
      <Title>{instruction ?? "Tap the words in order"}</Title>
      <div className="min-h-[56px] rounded-xl border-2 border-dashed border-ink-400 bg-ink-700" />
      <div className="mt-3 flex flex-wrap justify-center gap-1.5" dir="rtl">
        {all.map((p, i) => (
          <Chip key={i}>{p}</Chip>
        ))}
      </div>
    </div>
  );
}

function DragPreview({ round }: { round: any }) {
  if (!round?.parts?.length) return <Empty label="rounds" />;
  return (
    <div>
      <div className="rounded-[14px] border-2 border-teal-edge bg-teal-tint/50 p-4 text-center">
        <p className="mb-1 text-[10px] font-black tracking-[0.14em] text-teal">
          YOUR GOAL
        </p>
        <Ar className="block text-3xl">
          {round.word || round.parts.join("")}
        </Ar>
        {round.meaning && (
          <p className="mt-1 text-[11px] font-semibold text-fg-dimmer">
            {round.meaning}
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5" dir="rtl">
        {round.parts.map((p: string, i: number) => (
          <Chip key={i}>{p}</Chip>
        ))}
      </div>
    </div>
  );
}

function PairsPreview({
  instruction,
  pairs,
}: {
  instruction?: string;
  pairs?: { left: string; right: string }[];
}) {
  if (!pairs?.length) return <Empty label="pairs" />;
  return (
    <div>
      <Title>{instruction ?? "Match the pairs"}</Title>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-2.5">
          {pairs.map((p, i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-ink-400 bg-ink-600 py-2 text-center"
            >
              <Ar className="text-lg">{p.left}</Ar>
            </div>
          ))}
        </div>
        <div className="space-y-2.5">
          {[...pairs].reverse().map((p, i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-ink-400 bg-ink-600 py-2 text-center text-sm font-bold text-fg-dim"
            >
              {p.right}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SortPreview({ d }: { d: any }) {
  const buckets = d.buckets ?? [];
  const item = (d.items ?? [])[0];
  if (!buckets.length) return <Empty label="buckets" />;
  return (
    <div>
      <Title>{d.instruction ?? "Sort each one"}</Title>
      <Hint text={d.hint} arabic={d.hintArabic} />
      {item && (
        <div className="mt-3 rounded-[14px] border-2 border-ink-400 bg-ink-600 p-4 text-center">
          <Ar className="text-3xl">{item.text}</Ar>
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {buckets.map((b: string, i: number) => (
          <div
            key={i}
            className="rounded-xl border-2 border-ink-400 bg-ink-600 py-3 text-center"
          >
            <Ar className="block text-base text-teal-light">{b}</Ar>
            {d.bucketHints?.[i] && <Ar className="text-xl">{d.bucketHints[i]}</Ar>}
          </div>
        ))}
      </div>
    </div>
  );
}

function HuntPreview({ d }: { d: any }) {
  const grid = d.grid ?? [];
  if (!grid.length) return <Empty label="grid" />;
  return (
    <div>
      <Title>{d.instruction ?? "Find the target letter"}</Title>
      <div className="grid grid-cols-4 gap-1.5" dir="rtl">
        {grid.map((g: string, i: number) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-[10px] border-2 ${
              g === d.target
                ? "border-teal bg-teal-tint"
                : "border-ink-400 bg-ink-600"
            }`}
          >
            <Ar className="text-xl">{g}</Ar>
          </div>
        ))}
      </div>
    </div>
  );
}

function CertificatePreview({ d }: { d: any }) {
  return (
    <div className="rounded-[14px] border-2 border-teal-edge bg-teal-tint/50 p-6 text-center">
      <AcademicCapIcon className="mx-auto h-10 w-10 text-gold" strokeWidth={2} />
      <p className="mt-2 text-base font-black text-teal-light">
        {d.title || "Certificate"}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-fg-dim">{d.message}</p>
      {d.next_phase && (
        <p className="mt-2 text-[10px] font-bold text-fg-faint">
          Next: {d.next_phase}
        </p>
      )}
    </div>
  );
}

function GenericPreview({ d }: { d: any }) {
  if (!d || Object.keys(d).length === 0) return <Empty label="component" />;
  return (
    <pre className="overflow-x-auto rounded-[10px] bg-ink-900 p-3 text-[10px] leading-relaxed text-fg-dimmer">
      {JSON.stringify(d, null, 2)}
    </pre>
  );
}
