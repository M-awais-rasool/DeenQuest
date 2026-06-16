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
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5 text-[11px] text-white/30 mb-2">
        <DevicePhoneMobileIcon className="w-3.5 h-3.5" /> Learner preview
      </div>
      <div className="w-[300px] rounded-[28px] border-[6px] border-black/60 bg-[#0f1410] shadow-2xl overflow-hidden">
        <div className="h-6 bg-black/40 flex items-center justify-center">
          <div className="w-16 h-1.5 rounded-full bg-white/20" />
        </div>
        <div className="p-4 min-h-[320px] max-h-[460px] overflow-y-auto text-white">
          {kind === "lesson"
            ? renderLesson(name, data ?? {})
            : renderGame(name, data ?? {})}
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI atoms (mobile look) ───

const arabic = "text-right leading-relaxed";

function Ar({ children, className = "" }: { children: any; className?: string }) {
  return (
    <span dir="rtl" className={`${arabic} ${className}`}>
      {children}
    </span>
  );
}

function Chip({ children, tone = "idle" }: { children: any; tone?: string }) {
  const tones: Record<string, string> = {
    idle: "bg-white/5 border-white/10 text-white/80",
    correct: "bg-emerald-500/15 border-emerald-500/50 text-emerald-300",
    selected: "bg-emerald-500/10 border-emerald-500/40 text-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-2 rounded-xl border text-lg ${tones[tone] ?? tones.idle}`}
    >
      {children}
    </span>
  );
}

function Title({ children }: { children: any }) {
  return <p className="text-xs font-semibold text-white/40 mb-3">{children}</p>;
}

function Empty({ label }: { label: string }) {
  return (
    <div className="h-full flex items-center justify-center text-center text-white/25 text-xs py-10">
      Add data to preview the {label}
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
      return <ChoicePreview question="Tap what you hear" options={d.options} correct={d.correct} />;
    case "LightningRoundComponent":
      return <LightningPreview d={d} />;
    case "TrueFalseComponent":
      return <TrueFalsePreview d={d} />;
    case "FillBlankComponent":
      return <FillBlankPreview d={d} />;
    case "AyahBuilderComponent":
      return <TilesPreview instruction={d.instruction} parts={d.parts} distractors={d.distractors} />;
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
      return <ChoicePreview question={q.question} options={q.options} correct={q.correct} hint={q.hint} hintArabic={q.hintArabic} />;
    }
    case "listen_choose": {
      const q = (d.questions ?? [])[0] ?? {};
      return <ChoicePreview question="Tap what you hear" options={q.options} correct={q.correct} />;
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
    <div className="space-y-2">
      <Title>Tap each letter to hear it</Title>
      <div className="grid grid-cols-2 gap-2">
        {letters.map((l: any, i: number) => (
          <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <Ar className="text-3xl block">{l.letter}</Ar>
            <span className="text-[11px] text-white/40">{l.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormsPreview({ d }: { d: any }) {
  const f = d.forms ?? {};
  const cells = [
    ["Isolated", f.isolated],
    ["Initial", f.initial],
    ["Medial", f.medial],
    ["Final", f.final],
  ];
  return (
    <div className="space-y-2">
      <Title>One letter, four shapes</Title>
      <div className="grid grid-cols-2 gap-2">
        {cells.map(([label, v]) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <Ar className="text-3xl block">{v || "—"}</Ar>
            <span className="text-[11px] text-white/40">{label}</span>
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
    <div className="space-y-2">
      <Title>Tap to hear</Title>
      {items.map((it: any, i: number) => (
        <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
          <Ar className="text-2xl">{it.arabic}</Ar>
          <SpeakerWaveIcon className="h-4 w-4 text-emerald-400" />
        </div>
      ))}
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
        <div className="inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full">
          <BookOpenIcon className="h-3.5 w-3.5" /> {badge}
        </div>
      )}
      <div className="rounded-2xl bg-white/5 border border-emerald-500/20 p-5">
        <Ar className="block text-2xl text-center">{arabic}</Ar>
        {meaning && (
          <>
            <div className="w-10 h-0.5 bg-emerald-500/30 mx-auto my-3 rounded" />
            <p className="text-center text-xs text-white/50">{meaning}</p>
          </>
        )}
      </div>
      {sub && <p className="text-center text-[11px] text-white/40">{sub}</p>}
      {mic && (
        <button className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-[#0f1410] font-bold text-sm py-2.5">
          <MicrophoneIcon className="h-4 w-4" /> Recite
        </button>
      )}
    </div>
  );
}

function HadithPreview({ d }: { d: any }) {
  if (!d.hadith) return <Empty label="hadith" />;
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
      <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-emerald-400/60" />
      <p className="text-sm text-white/80">{d.hadith}</p>
      <p className="text-[11px] text-emerald-300/80">— {d.reference}</p>
    </div>
  );
}

function BulletsPreview({ items }: { items?: string[] }) {
  if (!items?.length) return <Empty label="tips" />;
  return (
    <div className="space-y-2">
      {items.map((t, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
          <LightBulbIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <Ar className="text-sm text-white/80 text-left flex-1">{t}</Ar>
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
        <div key={i} className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
          <span className="w-5 h-5 rounded-md border border-emerald-500/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
          <Ar className="text-sm text-white/80 text-left flex-1">{t}</Ar>
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
    <div className="space-y-3">
      <p className="text-sm font-semibold text-white/90">{question}</p>
      {(hint || hintArabic) && (
        <div className="flex items-center gap-1.5 text-[11px] bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-2.5 py-1.5 text-white/70">
          <LightBulbIcon className="h-3.5 w-3.5 text-yellow-300 flex-shrink-0" />
          <span>
            {hint} {hintArabic && <Ar className="text-yellow-300">{hintArabic}</Ar>}
          </span>
        </div>
      )}
      <div className="space-y-2">
        {(options ?? []).map((o, i) => (
          <div
            key={i}
            className={`rounded-xl border px-3 py-2.5 text-center ${
              i === correct
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
                : "border-white/10 bg-white/5 text-white/80"
            }`}
          >
            <Ar className="text-lg">{o}</Ar>
            {i === correct && (
              <CheckIcon className="ml-2 inline h-4 w-4 text-emerald-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LightningPreview({ d }: { d: any }) {
  const q = (d.questions ?? [])[0];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-white/40">
          <BoltIcon className="h-3.5 w-3.5" /> Lightning round
        </span>
        <span className="text-emerald-300 font-bold">{d.seconds ?? 7}s</span>
      </div>
      {q ? (
        <ChoicePreview question={q.question} options={q.options} correct={q.correct} />
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
      <p className="text-sm text-white/80">{r.prompt}</p>
      {r.arabic && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
          <Ar className="text-3xl">{r.arabic}</Ar>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-center py-2 text-sm font-semibold">
          True
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 text-white/70 text-center py-2 text-sm font-semibold">
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
    <div className="space-y-3">
      <Title>{d.instruction ?? "Complete the word"}</Title>
      <div className="flex flex-wrap gap-1.5 justify-center" dir="rtl">
        {sentence.map((tok: any, i: number) =>
          tok.blank ? (
            <span key={i} className="px-5 py-2 rounded-xl border-2 border-dashed border-emerald-500/50 text-emerald-300/40">
              ?
            </span>
          ) : (
            <Chip key={i}>{tok.text}</Chip>
          ),
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center pt-2 border-t border-white/5">
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
    <div className="space-y-3">
      <Title>{instruction ?? "Tap the words in order"}</Title>
      <div className="min-h-[56px] rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02]" />
      <div className="flex flex-wrap gap-1.5 justify-center" dir="rtl">
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
    <div className="space-y-3">
      <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/25 p-4 text-center">
        <p className="text-[10px] font-bold tracking-widest text-emerald-400 mb-1">
          YOUR GOAL
        </p>
        <Ar className="text-3xl block">{round.word || round.parts.join("")}</Ar>
        {round.meaning && (
          <p className="text-[11px] text-white/40 mt-1">{round.meaning}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center" dir="rtl">
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
    <div className="space-y-3">
      <Title>{instruction ?? "Match the pairs"}</Title>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <div key={i} className="rounded-xl bg-white/5 border border-white/10 py-2 text-center">
              <Ar className="text-lg">{p.left}</Ar>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[...pairs].reverse().map((p, i) => (
            <div key={i} className="rounded-xl bg-white/5 border border-white/10 py-2 text-center">
              <Ar className="text-base">{p.right}</Ar>
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
    <div className="space-y-3">
      <Title>{d.instruction ?? "Sort each one"}</Title>
      {d.hint && (
        <div className="flex items-center gap-1.5 text-[11px] bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-2.5 py-1.5 text-white/70">
          <LightBulbIcon className="h-3.5 w-3.5 text-yellow-300 flex-shrink-0" />
          <span>
            {d.hint} {d.hintArabic && <Ar className="text-yellow-300">{d.hintArabic}</Ar>}
          </span>
        </div>
      )}
      {item && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          <Ar className="text-3xl">{item.text}</Ar>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {buckets.map((b: string, i: number) => (
          <div key={i} className="rounded-xl bg-white/5 border border-white/10 py-3 text-center">
            <Ar className="text-base text-emerald-300 block">{b}</Ar>
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
    <div className="space-y-3">
      <Title>{d.instruction ?? "Find the target letter"}</Title>
      <div className="grid grid-cols-4 gap-1.5" dir="rtl">
        {grid.map((g: string, i: number) => (
          <div
            key={i}
            className={`aspect-square rounded-lg flex items-center justify-center border ${
              g === d.target
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-white/10 bg-white/5"
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
    <div className="rounded-2xl bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/30 p-6 text-center space-y-2">
      <AcademicCapIcon className="mx-auto h-10 w-10 text-gold-400" />
      <p className="text-base font-bold text-emerald-300">{d.title || "Certificate"}</p>
      <p className="text-[11px] text-white/50">{d.message}</p>
      {d.next_phase && (
        <p className="text-[10px] text-white/30 pt-1">Next: {d.next_phase}</p>
      )}
    </div>
  );
}

function GenericPreview({ d }: { d: any }) {
  if (!d || Object.keys(d).length === 0) return <Empty label="component" />;
  return (
    <pre className="text-[10px] text-white/50 bg-black/30 rounded-lg p-3 overflow-x-auto">
      {JSON.stringify(d, null, 2)}
    </pre>
  );
}
