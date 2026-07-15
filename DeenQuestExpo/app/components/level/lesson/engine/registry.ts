import type { Interaction, LessonDSL, DSLRound } from "./types";

export interface ResolvedLesson {
  component: string;
  data: Record<string, any>;
}

type Adapter = (dsl: LessonDSL) => ResolvedLesson | null;


const adaptTeach: Adapter = ({ content }) => {
  if (Array.isArray(content.letters) && content.letters.length > 0) {
    return {
      component: "LetterIntroComponent",
      data: { letters: content.letters },
    };
  }
  if (content.forms && content.letter) {
    return {
      component: "LetterFormsComponent",
      data: { letter: content.letter, forms: content.forms },
    };
  }
  if (Array.isArray(content.tips) && content.tips.length > 0) {
    return { component: "TipsComponent", data: { tips: content.tips } };
  }
  if (content.hadith) {
    return {
      component: "HadithComponent",
      data: { hadith: content.hadith, reference: content.reference },
    };
  }
  if (content.text && content.surah) {
    return {
      component: "QuranReaderComponent",
      data: {
        text: content.text,
        meaning: content.meaning,
        surah: content.surah,
      },
    };
  }
  if (content.title && (content.message || content.next_phase)) {
    return {
      component: "CertificateComponent",
      data: {
        title: content.title,
        message: content.message,
        next_phase: content.next_phase,
      },
    };
  }
  if (content.arabic) {
    return {
      component: "DuaCardComponent",
      data: {
        arabic: content.arabic,
        meaning: content.meaning,
        context: content.context,
      },
    };
  }
  return null;
};


function toQuestion(round: DSLRound) {
  return {
    question: round.prompt ?? "",
    options: round.options ?? [],
    correct: round.correct ?? 0,
  };
}

const adaptChoice: Adapter = ({ content, presentation, modifiers }) => {
  const rounds = content.rounds ?? [];
  if (rounds.length === 0) return null;

  const timed = modifiers?.timed_seconds ?? 0;
  if (timed > 0) {
    return {
      component: "LightningRoundComponent",
      data: { seconds: timed, questions: rounds.map(toQuestion) },
    };
  }

  if (presentation?.layout === "binary") {
    return {
      component: "TrueFalseComponent",
      data: {
        rounds: rounds.map((r) => ({
          prompt: r.prompt ?? "",
          arabic: r.arabic ?? "",
          answer: r.answer === true,
        })),
      },
    };
  }

  const audioRound = rounds.find((r) => !!r.audio);
  if (audioRound) {
    return {
      component: "ListenChooseComponent",
      data: {
        audio: audioRound.audio,
        options: audioRound.options ?? [],
        correct: audioRound.correct ?? 0,
        instruction: audioRound.prompt,
      },
    };
  }

  const first = rounds[0];
  if (first.correct == null && first.answer == null) {
    return {
      component: "ReflectionComponent",
      data: { question: first.prompt ?? "", options: first.options ?? [] },
    };
  }

  return {
    component: "MCQComponent",
    data: { questions: rounds.map(toQuestion) },
  };
};


const adaptMatch: Adapter = ({ content }) =>
  Array.isArray(content.pairs) && content.pairs.length > 0
    ? {
        component: "MatchPairsComponent",
        data: { instruction: content.instruction, pairs: content.pairs },
      }
    : null;

const adaptSequence: Adapter = ({ content }) =>
  Array.isArray(content.parts) && content.parts.length > 0
    ? {
        component: "AyahBuilderComponent",
        data: {
          instruction: content.instruction,
          parts: content.parts,
          distractors: content.distractors ?? [],
          meaning: content.meaning,
        },
      }
    : null;

const adaptSort: Adapter = ({ content }) =>
  Array.isArray(content.buckets) && Array.isArray(content.items)
    ? {
        component: "SortBucketsComponent",
        data: {
          instruction: content.instruction,
          buckets: content.buckets,
          items: content.items,
        },
      }
    : null;

const adaptHunt: Adapter = ({ content }) =>
  content.target && Array.isArray(content.grid)
    ? {
        component: "LetterHuntComponent",
        data: {
          instruction: content.instruction,
          target: content.target,
          grid: content.grid,
        },
      }
    : null;

const adaptSteps: Adapter = ({ content }) =>
  Array.isArray(content.steps) && content.steps.length > 0
    ? { component: "PrayerChecklistComponent", data: { steps: content.steps } }
    : null;

const adaptRecord: Adapter = ({ content }) => {
  const items = Array.isArray(content.items)
    ? content.items
    : (content.rounds ?? [])
        .filter((r: DSLRound) => !!r.arabic)
        .map((r: DSLRound) => ({ arabic: r.arabic }));
  return items.length > 0
    ? { component: "PronunciationComponent", data: { items } }
    : null;
};

const adaptBlank: Adapter = ({ content }) =>
  Array.isArray(content.sentence) && Array.isArray(content.bank)
    ? {
        component: "FillBlankComponent",
        data: {
          instruction: content.instruction,
          sentence: content.sentence,
          bank: content.bank,
          meaning: content.meaning,
        },
      }
    : null;

export const INTERACTION_REGISTRY: Record<Interaction, Adapter> = {
  teach: adaptTeach,
  choice: adaptChoice,
  match: adaptMatch,
  sequence: adaptSequence,
  sort: adaptSort,
  hunt: adaptHunt,
  steps: adaptSteps,
  record: adaptRecord,
  blank: adaptBlank,
};
