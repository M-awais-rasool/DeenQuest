import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AnimatedPressable } from "../../components/ui";
import { theme } from "../../theme/themes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import type { DailyTask } from "../../store/services/api";
import { useCompleteDailyTaskMutation } from "../../store/services/api";
import { BlockRenderer, XPBadge, CategoryBadge } from "../../components/task";

export function DailyTaskScreen({
  task,
  onBack,
}: {
  task: DailyTask;
  onBack: () => void;
}) {
  const [completeDailyTask, { isLoading }] = useCompleteDailyTaskMutation();

  const handleComplete = useCallback(async () => {
    try {
      await completeDailyTask(task.id).unwrap();
      onBack();
    } catch {}
  }, [completeDailyTask, task.id, onBack]);

  return (
    <ScreenWrapper>
      <View style={s.header}>
        <AnimatedPressable
          onPress={() => {
            onBack();
          }}
          style={s.backBtn}
        >
          <Text style={s.backText}>← Back</Text>
        </AnimatedPressable>
        <XPBadge xp={task.reward_xp} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.titleRow}>
          <CategoryBadge category={task.category} />
          <Text style={s.difficultyText}>{task.difficulty.toUpperCase()}</Text>
        </View>
        <Text style={s.taskTitle}>{task.title}</Text>
        <Text style={s.taskDesc}>{task.description}</Text>
        <BlockRenderer
          task={task}
          onComplete={handleComplete}
          loading={isLoading}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
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
});
