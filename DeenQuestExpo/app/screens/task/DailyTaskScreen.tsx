import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { theme } from "../../theme/themes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Header } from "../../components/Header";
import type { DailyTask } from "../../store/services/api";
import { useCompleteDailyTaskMutation } from "../../store/services/api";

// ─── Shared Sub-Components ──────────────────────────────────────────

const XPBadge = ({ xp }: { xp: number }) => (
  <View style={s.xpBadge}>
    <Text style={s.xpBadgeText}>+{xp} XP</Text>
  </View>
);

const CategoryBadge = ({ category }: { category: string }) => (
  <View style={s.categoryBadge}>
    <Text style={s.categoryBadgeText}>{category.toUpperCase()}</Text>
  </View>
);

const CompleteButton = ({
  onPress,
  loading,
  disabled,
  label = "Mark Complete",
}: {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  label?: string;
}) => (
  <TouchableOpacity
    style={[s.completeBtn, disabled && s.completeBtnDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator color={theme.colors.onPrimary} size="small" />
    ) : (
      <Text style={s.completeBtnText}>{disabled ? "Completed ✓" : label}</Text>
    )}
  </TouchableOpacity>
);

// ─── Screen-Type Components ────────────────────────────────────────

const PrayerChecklistComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const steps: string[] = (task.data?.steps as string[]) ?? [];
  const [checked, setChecked] = useState<boolean[]>(
    new Array(steps.length).fill(false),
  );

  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  };

  const allChecked = checked.every(Boolean) && steps.length > 0;

  return (
    <View style={s.componentContainer}>
      {steps.map((step, i) => (
        <TouchableOpacity
          key={i}
          style={[s.checklistItem, checked[i] && s.checklistItemDone]}
          onPress={() => toggle(i)}
          activeOpacity={0.7}
        >
          <View style={[s.checkbox, checked[i] && s.checkboxChecked]}>
            {checked[i] && <Text style={s.checkMark}>✓</Text>}
          </View>
          <Text
            style={[s.checklistText, checked[i] && s.checklistTextDone]}
          >
            {step}
          </Text>
        </TouchableOpacity>
      ))}
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed || !allChecked}
      />
    </View>
  );
};

const QuranReaderComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const surah = (task.data?.surah as string) ?? "";
  const ayahs = (task.data?.ayahs as number[]) ?? [];

  return (
    <View style={s.componentContainer}>
      <View style={s.quranCard}>
        <Text style={s.quranSurah}>{surah}</Text>
        <Text style={s.quranAyahs}>
          Ayahs: {ayahs.join(", ")}
        </Text>
      </View>
      <Text style={s.quranHint}>
        Read the ayahs above and reflect on their meaning.
      </Text>
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed}
        label="I've Read Them"
      />
    </View>
  );
};

const CounterComponent = ({ task, onComplete, loading }: ComponentProps) => {
  const target = (task.data?.target as number) ?? 33;
  const text = (task.data?.text as string) ?? "";
  const [count, setCount] = useState(0);

  const increment = () => {
    if (count < target) setCount((c) => c + 1);
  };

  return (
    <View style={s.componentContainer}>
      <Text style={s.counterPhrase}>{text}</Text>
      <Text style={s.counterCount}>
        {count} / {target}
      </Text>
      <View style={s.counterProgress}>
        <View
          style={[s.counterBar, { width: `${(count / target) * 100}%` }]}
        />
      </View>
      <TouchableOpacity
        style={s.counterTapBtn}
        onPress={increment}
        disabled={count >= target}
        activeOpacity={0.6}
      >
        <Text style={s.counterTapText}>
          {count >= target ? "Done!" : "Tap"}
        </Text>
      </TouchableOpacity>
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed || count < target}
      />
    </View>
  );
};

const HadithComponent = ({ task, onComplete, loading }: ComponentProps) => {
  const hadith = (task.data?.hadith as string) ?? "";
  const reference = (task.data?.reference as string) ?? "";

  return (
    <View style={s.componentContainer}>
      <View style={s.hadithCard}>
        <Text style={s.hadithQuote}>"{hadith}"</Text>
        <Text style={s.hadithRef}>— {reference}</Text>
      </View>
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed}
        label="I've Reflected"
      />
    </View>
  );
};

const QuizComponent = ({ task, onComplete, loading }: ComponentProps) => {
  const question = (task.data?.question as string) ?? "";
  const options = (task.data?.options as string[]) ?? [];
  const correct = (task.data?.correct as number) ?? 0;
  const [selected, setSelected] = useState<number | null>(null);

  const isCorrect = selected === correct;

  return (
    <View style={s.componentContainer}>
      <Text style={s.quizQuestion}>{question}</Text>
      {options.map((opt, i) => (
        <TouchableOpacity
          key={i}
          style={[
            s.quizOption,
            selected === i &&
              (isCorrect ? s.quizOptionCorrect : s.quizOptionWrong),
          ]}
          onPress={() => setSelected(i)}
          disabled={selected !== null}
          activeOpacity={0.7}
        >
          <Text
            style={[
              s.quizOptionText,
              selected === i && s.quizOptionTextSelected,
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
      {selected !== null && (
        <Text style={isCorrect ? s.quizFeedbackCorrect : s.quizFeedbackWrong}>
          {isCorrect ? "Correct! MashaAllah 🌟" : "Not quite — keep learning!"}
        </Text>
      )}
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed || selected === null}
      />
    </View>
  );
};

const AudioPlayerComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const surah = (task.data?.surah as string) ?? "";
  const duration = (task.data?.duration as number) ?? 300;

  return (
    <View style={s.componentContainer}>
      <View style={s.audioCard}>
        <Text style={s.audioSurah}>{surah}</Text>
        <Text style={s.audioDuration}>
          {Math.floor(duration / 60)} min listening
        </Text>
      </View>
      <Text style={s.audioHint}>
        Play the audio and listen attentively.
      </Text>
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed}
        label="I've Listened"
      />
    </View>
  );
};

const ReflectionComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const question = (task.data?.question as string) ?? "";
  const options = (task.data?.options as string[]) ?? [];
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <View style={s.componentContainer}>
      <Text style={s.reflectionQuestion}>{question}</Text>
      {options.map((opt, i) => (
        <TouchableOpacity
          key={i}
          style={[s.reflectionOption, selected === i && s.reflectionSelected]}
          onPress={() => setSelected(i)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              s.reflectionOptionText,
              selected === i && s.reflectionSelectedText,
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed || selected === null}
      />
    </View>
  );
};

const TipsComponent = ({ task, onComplete, loading }: ComponentProps) => {
  const tips = (task.data?.tips as string[]) ?? [];

  return (
    <View style={s.componentContainer}>
      {tips.map((tip, i) => (
        <View key={i} style={s.tipItem}>
          <View style={s.tipBullet}>
            <Text style={s.tipBulletText}>{i + 1}</Text>
          </View>
          <Text style={s.tipText}>{tip}</Text>
        </View>
      ))}
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed}
        label="I'll Practice These"
      />
    </View>
  );
};

const ActionComponent = ({ task, onComplete, loading }: ComponentProps) => {
  const instruction = (task.data?.instruction as string) ?? "";

  return (
    <View style={s.componentContainer}>
      <View style={s.actionCard}>
        <Text style={s.actionInstruction}>{instruction}</Text>
      </View>
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed}
        label="Done!"
      />
    </View>
  );
};

// ─── Component Registry ────────────────────────────────────────────

interface ComponentProps {
  task: DailyTask;
  onComplete: () => void;
  loading: boolean;
}

const COMPONENT_MAP: Record<
  string,
  React.FC<ComponentProps>
> = {
  PrayerChecklistComponent,
  QuranReaderComponent,
  CounterComponent,
  HadithComponent,
  QuizComponent,
  AudioPlayerComponent,
  ReflectionComponent,
  TipsComponent,
  ActionComponent,
};

// ─── Main DailyTaskScreen ──────────────────────────────────────────

export function DailyTaskScreen({ task, onBack }: { task: DailyTask; onBack: () => void }) {
  const [completeDailyTask, { isLoading }] = useCompleteDailyTaskMutation();

  const handleComplete = useCallback(async () => {
    try {
      await completeDailyTask(task.id).unwrap();
    } catch {
      // Error handled by RTK Query
    }
  }, [completeDailyTask, task.id]);

  const TaskComponent = COMPONENT_MAP[task.component];

  return (
    <ScreenWrapper>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <XPBadge xp={task.reward_xp} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.titleRow}>
          <CategoryBadge category={task.category} />
          <Text style={s.difficultyText}>
            {task.difficulty.toUpperCase()}
          </Text>
        </View>
        <Text style={s.taskTitle}>{task.title}</Text>
        <Text style={s.taskDesc}>{task.description}</Text>
        {TaskComponent ? (
          <TaskComponent
            task={task}
            onComplete={handleComplete}
            loading={isLoading}
          />
        ) : (
          <Text style={s.fallback}>Unknown task type</Text>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Layout
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backBtn: { padding: 4 },
  backText: { color: theme.colors.primary, fontSize: 16, fontWeight: "700" },
  scroll: { padding: theme.spacing.lg, paddingBottom: 100 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 24,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  fallback: { color: theme.colors.textMuted, textAlign: "center", marginTop: 40 },

  // Badges
  xpBadge: {
    backgroundColor: "rgba(255, 219, 60, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 219, 60, 0.3)",
  },
  xpBadgeText: {
    color: theme.colors.secondary,
    fontWeight: "800",
    fontSize: 12,
  },
  categoryBadge: {
    backgroundColor: "rgba(136, 217, 130, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(136, 217, 130, 0.3)",
  },
  categoryBadgeText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1,
  },

  // Complete Button
  completeBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  completeBtnDisabled: { opacity: 0.5 },
  completeBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Component wrapper
  componentContainer: { marginTop: 8 },

  // Checklist
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
  },
  checklistItemDone: { opacity: 0.6 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkMark: { color: theme.colors.onPrimary, fontWeight: "900", fontSize: 14 },
  checklistText: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  checklistTextDone: { textDecorationLine: "line-through", opacity: 0.7 },

  // Quran Reader
  quranCard: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginBottom: 12,
  },
  quranSurah: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 4,
  },
  quranAyahs: { fontSize: 14, color: theme.colors.textMuted, fontWeight: "600" },
  quranHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
  },

  // Counter
  counterPhrase: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  counterCount: {
    fontSize: 48,
    fontWeight: "900",
    color: theme.colors.primary,
    textAlign: "center",
  },
  counterProgress: {
    height: 8,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 4,
    marginVertical: 16,
    overflow: "hidden",
  },
  counterBar: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  counterTapBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(136, 217, 130, 0.15)",
    borderWidth: 3,
    borderColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 8,
  },
  counterTapText: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },

  // Hadith
  hadithCard: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 219, 60, 0.2)",
  },
  hadithQuote: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    fontStyle: "italic",
    lineHeight: 28,
    marginBottom: 12,
  },
  hadithRef: { fontSize: 13, color: theme.colors.textMuted, fontWeight: "600" },

  // Quiz
  quizQuestion: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 20,
  },
  quizOption: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  quizOptionCorrect: { borderColor: theme.colors.primary, backgroundColor: "rgba(136, 217, 130, 0.1)" },
  quizOptionWrong: { borderColor: "#FF6B6B", backgroundColor: "rgba(255, 107, 107, 0.1)" },
  quizOptionText: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  quizOptionTextSelected: { fontWeight: "800" },
  quizFeedbackCorrect: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  quizFeedbackWrong: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },

  // Audio
  audioCard: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  audioSurah: { fontSize: 22, fontWeight: "900", color: theme.colors.text, marginBottom: 4 },
  audioDuration: { fontSize: 14, color: theme.colors.textMuted, fontWeight: "600" },
  audioHint: { fontSize: 13, color: theme.colors.textMuted, textAlign: "center", fontStyle: "italic" },

  // Reflection
  reflectionQuestion: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 20,
    lineHeight: 28,
  },
  reflectionOption: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  reflectionSelected: { borderColor: theme.colors.primary, backgroundColor: "rgba(136, 217, 130, 0.1)" },
  reflectionOptionText: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  reflectionSelectedText: { color: theme.colors.primary, fontWeight: "800" },

  // Tips
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
  },
  tipBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(136, 217, 130, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  tipBulletText: { color: theme.colors.primary, fontWeight: "900", fontSize: 14 },
  tipText: { color: theme.colors.text, fontSize: 16, fontWeight: "600", flex: 1 },

  // Action
  actionCard: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  actionInstruction: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    lineHeight: 26,
  },
});
