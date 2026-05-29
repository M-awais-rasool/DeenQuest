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
  title?: string;
  subtitle?: string;
  speech: string;
  multiSelect: boolean;
  type: "options" | "name";
  options: OnboardingOption[];
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    speech:
      "What should I call you?",
    multiSelect: false,
    type: "name",
    options: [],
  },
  {
    id: 2,
    title: "Where did you hear about us?",
    subtitle: "This helps us understand how people find DeenQuest.",
    speech:
      "Great to have you here! Where did you first hear about DeenQuest?",
    multiSelect: false,
    type: "options",
    options: [
      { id: "friend_family", icon: "Users", label: "Friend or family member" },
      { id: "social_media", icon: "Share2", label: "Social media" },
      { id: "search_engine", icon: "Search", label: "Google or search engine" },
      { id: "mosque", icon: "Landmark", label: "Mosque or Islamic center" },
      { id: "app_store", icon: "Smartphone", label: "App Store / Play Store" },
      { id: "other", icon: "HelpCircle", label: "Other" },
    ],
  },
  {
    id: 3,
    title: "What's your Quran reading level?",
    subtitle: "This helps us start you at the right place.",
    speech:
      "Let's build your personal path! What's your Quran reading level?",
    multiSelect: false,
    type: "options",
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
    id: 4,
    title: "Where would you like to grow?",
    subtitle: "Select all that apply.",
    speech:
      "Great! Now tell me where you'd like to grow. I'll focus your lessons there 🌟",
    multiSelect: true,
    type: "options",
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
    id: 5,
    title: "How much time can you give each day?",
    subtitle: "Be honest — consistency matters more than duration.",
    speech:
      "You're doing amazing! How much time can you give each day? Even 5 minutes is a great start ⏰",
    multiSelect: false,
    type: "options",
    options: [
      { id: "5_min", icon: "Zap", label: "5 minutes — quick daily habit" },
      { id: "15_min", icon: "Leaf", label: "15 minutes — steady learner" },
      { id: "30_min", icon: "Flame", label: "30+ minutes — serious seeker" },
    ],
  },
  {
    id: 6,
    title: "What's driving your journey?",
    subtitle: "Select all that apply.",
    speech:
      "MashaAllah! One last thing — what's driving your journey? This helps me inspire you at the right moments 💫",
    multiSelect: true,
    type: "options",
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
  const growthStep = ONBOARDING_STEPS[3];
  const motivationStep = ONBOARDING_STEPS[5];

  answers[4]?.forEach((id) => {
    const opt = growthStep.options.find((o) => o.id === id);
    if (opt) tags.push(opt.label);
  });

  answers[6]?.forEach((id) => {
    const opt = motivationStep.options.find((o) => o.id === id);
    if (opt) tags.push(opt.label);
  });

  return tags;
}

interface NameForm {
  firstName: string;
  lastName: string;
}

/** Builds the API payload from collected answers */
export function buildOnboardingPayload(
  answers: Record<number, string[]>,
  nameForm: NameForm
) {
  return {
    first_name: nameForm.firstName.trim(),
    last_name: nameForm.lastName.trim(),
    referral_source: answers[2]?.[0] || "other",
    quran_level: answers[3]?.[0] || "beginner",
    weak_areas: answers[4] || [],
    daily_time: answers[5]?.[0] || "15_min",
    motivations: answers[6] || [],
  };
}
