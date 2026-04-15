import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { theme } from "../../theme/themes";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import type { DailyTask } from "../../store/services/api";
import { useCompleteDailyTaskMutation } from "../../store/services/api";
import { COMPONENT_MAP, XPBadge, CategoryBadge } from "./components";

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
  fallback: {
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
});
