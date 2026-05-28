/**
 * Centralized configuration for the Personalized Onboarding flow.
 * All step data, copy, and loading states live here so the UI component
 * stays focused purely on rendering and animation.
 */

export interface OnboardingOption {
  id: string;
  icon: string;
  label: string;
}

export interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  speech: string;
  multiSelect: boolean;
  options: OnboardingOption[];
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "What's your Quran reading level?",
    subtitle: "This helps us start you at the right place.",
    speech:
      "As-salamu alaykum! I'm Noor, your Islamic learning companion. Let's build your personal path!",
    multiSelect: false,
    options: [
      {
        id: "beginner",
        icon: "Sprout",
        label: "Complete beginner — don't know Arabic letters yet",
      },
      {
        id: "slow_reader",
        icon: "BookOpen",
        label: "I know letters but read slowly",
      },
      {
        id: "comfortable",
        icon: "Library",
        label: "Comfortable reader, want Tajweed improvement",
      },
      {
        id: "advanced",
        icon: "Medal",
        label: "Advanced — seeking deeper Islamic knowledge",
      },
    ],
  },
  {
    id: 2,
    title: "Where would you like to grow?",
    subtitle: "Select all that apply.",
    speech:
      "Great! Now tell me where you'd like to grow. I'll focus your lessons there 🌟",
    multiSelect: true,
    options: [
      { id: "quran_tajweed", icon: "BookMarked", label: "Quran reading & Tajweed" },
      { id: "daily_prayers", icon: "Landmark", label: "Daily prayers & consistency" },
      { id: "daily_duas", icon: "Hand", label: "Learning daily Duas" },
      { id: "hadith_sunnah", icon: "ScrollText", label: "Hadith & Sunnah" },
      { id: "islamic_manners", icon: "Gem", label: "Islamic manners & character" },
      { id: "arabic_alphabet", icon: "Type", label: "Arabic alphabet basics" },
    ],
  },
  {
    id: 3,
    title: "How much time can you give each day?",
    subtitle: "Be honest — consistency matters more than duration.",
    speech:
      "You're doing amazing! How much time can you give each day? Even 5 minutes is a great start ⏰",
    multiSelect: false,
    options: [
      { id: "5_min", icon: "Zap", label: "5 minutes — quick daily habit" },
      { id: "15_min", icon: "Leaf", label: "15 minutes — steady learner" },
      { id: "30_min", icon: "Flame", label: "30+ minutes — serious seeker" },
    ],
  },
  {
    id: 4,
    title: "What's driving your journey?",
    subtitle: "Select all that apply.",
    speech:
      "MashaAllah! One last thing — what's driving your journey? This helps me inspire you at the right moments 💫",
    multiSelect: true,
    options: [
      { id: "consistent_salah", icon: "CircleDot", label: "Be consistent in Salah" },
      { id: "teach_children", icon: "Users", label: "Teach my children" },
      { id: "reconnect", icon: "Heart", label: "Reconnect with Islam" },
      {
        id: "daily_habits",
        icon: "Calendar",
        label: "Build daily Islamic habits",
      },
      { id: "complete_quran", icon: "BookOpen", label: "Complete Quran reading" },
      { id: "spiritual_growth", icon: "Moon", label: "Personal spiritual growth" },
    ],
  },
];

export const ISLAMIC_QUOTES = [
  '"The best among you are those who learn the Quran and teach it." — Prophet Muhammad ﷺ',
  '"Indeed, with hardship comes ease." — Quran 94:5',
  '"Take one step toward Me, I will take ten steps toward you." — Hadith Qudsi',
  '"Allah does not burden a soul beyond that it can bear." — Quran 2:286',
];

export const LOADING_STEPS = [
  "Analyzing your goals...",
  "Selecting your Quran levels...",
  "Personalizing your Hadith path...",
  "Building your daily task schedule...",
  "Your journey is ready!",
];

/** Maps answer IDs → human-readable tags for the completion screen */
export function getSelectedTags(answers: Record<number, string[]>): string[] {
  const tags: string[] = [];
  const step2 = ONBOARDING_STEPS[1];
  const step4 = ONBOARDING_STEPS[3];

  answers[2]?.forEach((id) => {
    const opt = step2.options.find((o) => o.id === id);
    if (opt) tags.push(opt.label);
  });

  answers[4]?.forEach((id) => {
    const opt = step4.options.find((o) => o.id === id);
    if (opt) tags.push(opt.label);
  });

  return tags;
}

/** Builds the API payload from collected answers */
export function buildOnboardingPayload(answers: Record<number, string[]>) {
  return {
    quran_level: answers[1]?.[0] || "beginner",
    weak_areas: answers[2] || [],
    daily_time: answers[3]?.[0] || "15_min",
    motivations: answers[4] || [],
  };
}
