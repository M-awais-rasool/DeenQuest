import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AnimatedPressable } from "../../components/ui";
import { ChevronLeft } from "lucide-react-native";
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
          <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2.5} />
        </AnimatedPressable>
        <Text style={s.headerTitle} numberOfLines={1}>
          {task.title}
        </Text>
        <XPBadge xp={task.reward_xp} />
        <CategoryBadge category={task.category} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
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
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 4,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
  },
  scroll: { padding: theme.spacing.lg, paddingBottom: 100 },
  taskDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: "#B7C8C6",
    fontFamily: "Nunito_600SemiBold",
    marginBottom: 22,
  },
});
