import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Flame,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Bolt,
  Circle,
  Star,
  Zap,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Header } from "../../components/Header";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { theme } from "../../theme/themes";
import {
  useGetDailyTasksQuery,
  useGetProgressQuery,
} from "../../store/services/api";
import type { DailyTask } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

const CATEGORY_ICONS: Record<string, { icon: typeof Flame; color: string }> = {
  salah: { icon: Flame, color: theme.colors.primary },
  quran: { icon: BookOpen, color: theme.colors.secondary },
  dhikr: { icon: Circle, color: theme.colors.lavender },
  learning: { icon: GraduationCap, color: theme.colors.pink },
  character: { icon: Bolt, color: theme.colors.primary },
  social: { icon: CheckCircle2, color: theme.colors.cyan },
  reflection: { icon: Circle, color: theme.colors.yellowSoft },
};

function buildWeekDays(): string[] {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(i === 0 ? "Today" : labels[d.getDay()]);
  }
  return days;
}

const WEEK_LABELS = buildWeekDays();

export const HomeScreen = () => {
  const { data: tasksData, isLoading: tasksLoading } = useGetDailyTasksQuery();
  const { data: progressData } = useGetProgressQuery();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const tasks = tasksData?.data ?? [];
  const progress = progressData?.data;
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalXP = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const currentStreak = progress?.current_streak ?? 0;
  const weeklyCompletions =
    progress?.weekly_completions ?? new Array(7).fill(false);

  const handleTaskPress = (task: DailyTask) => {
    navigation.navigate("DailyTaskDetail", { task });
  };
  return (
    <ScreenWrapper>
      <Header title="DeenQuest" xp={totalXP} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Streak Card ── */}
        <View style={styles.streakCard}>
          <View style={styles.streakTopRow}>
            <View>
              <Text style={styles.greeting}>As-salamu Alaykum!</Text>
              <Text style={styles.streakSub}>
                Keep your <Text style={styles.highlight}>streak alive</Text>
                {currentStreak > 0 ? ` — ${currentStreak} days strong!` : "!"}
              </Text>
            </View>
            <View style={styles.streakBubble}>
              <Flame
                size={18}
                color={theme.colors.onPrimary}
                fill={theme.colors.onPrimary}
              />
              <Text style={styles.streakBubbleNumber}>{currentStreak}</Text>
              <Text style={styles.streakBubbleLabel}>Streak</Text>
            </View>
          </View>

          {/* 7-day row */}
          <View style={styles.weekRow}>
            {WEEK_LABELS.map((label, i) => {
              const done = weeklyCompletions[i] === true;
              const isToday = i === 6;
              return (
                <View key={i} style={styles.dayCol}>
                  <View
                    style={[
                      styles.dayCircle,
                      done && styles.dayCircleDone,
                      isToday && !done && styles.dayCircleToday,
                    ]}
                  >
                    {done ? (
                      <CheckCircle2
                        size={16}
                        color={theme.colors.onPrimary}
                        fill={theme.colors.onPrimary}
                      />
                    ) : isToday ? (
                      <Zap
                        size={14}
                        color={theme.colors.onPrimary}
                        fill={theme.colors.onPrimary}
                      />
                    ) : (
                      <View style={styles.dayDot} />
                    )}
                  </View>
                  <Text
                    style={[styles.dayLabel, isToday && styles.dayLabelToday]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Level + XP bar */}
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Star
                size={12}
                color={theme.colors.secondary}
                fill={theme.colors.secondary}
              />
              <Text style={styles.levelText}>Level {level}</Text>
            </View>
            <Text style={styles.xpLabel}>{totalXP} XP</Text>
          </View>
          <View style={styles.xpBarTrack}>
            <View
              style={[
                styles.xpBarFill,
                { width: `${Math.min(((totalXP % 100) / 100) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.xpNext}>
            {100 - (totalXP % 100)} XP to next level
          </Text>
        </View>

        {/* ── Daily Missions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Missions</Text>
          <View style={styles.missionCountBadge}>
            <Text style={styles.missionCountText}>
              {completedCount}/{tasks.length}
            </Text>
          </View>
        </View>

        {tasksLoading ? (
          <Loader />
        ) : (
          <View style={styles.missionList}>
            {tasks.map((task) => {
              const catConf = CATEGORY_ICONS[task.category] ?? {
                icon: Circle,
                color: theme.colors.primary,
              };
              const IconComp = catConf.icon;
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.missionCard,
                    task.completed && styles.missionCardDone,
                  ]}
                  onPress={() => handleTaskPress(task)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.missionIcon,
                      {
                        backgroundColor: catConf.color + "18",
                        borderColor: catConf.color + "35",
                      },
                    ]}
                  >
                    <IconComp size={22} color={catConf.color} />
                  </View>
                  <View style={styles.missionInfo}>
                    <Text style={styles.missionTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <View style={styles.missionMeta}>
                      <Text style={styles.missionCategory}>
                        {task.category.toUpperCase()}
                      </Text>
                      <View style={styles.dot} />
                      <Text style={styles.missionXP}>+{task.reward_xp} XP</Text>
                    </View>
                  </View>
                  {task.completed ? (
                    <View style={styles.doneCheck}>
                      <CheckCircle2 size={22} color={theme.colors.primary} />
                    </View>
                  ) : (
                    <View style={styles.startBtn}>
                      <Text style={styles.startBtnText}>Start</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: theme.spacing.lg,
  },

  // ── Streak Card ──────────────────────────────────────────────────
  streakCard: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
    marginBottom: 28,
  },
  streakTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
  },
  streakSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: "500",
    marginTop: 3,
  },
  highlight: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  streakBubble: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primaryContainer,
    minWidth: 60,
  },
  streakBubbleNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.onPrimary,
    lineHeight: 24,
  },
  streakBubbleLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: theme.colors.onPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.8,
  },

  // 7-day row
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dayCol: {
    alignItems: "center",
    gap: 5,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircleDone: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayCircleToday: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.outline,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dayLabelToday: {
    color: theme.colors.secondary,
    fontWeight: "900",
  },

  // Level / XP
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.secondary12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.secondary25,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.secondary,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textMuted,
  },
  xpBarTrack: {
    height: 6,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  xpNext: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: "600",
    textAlign: "right",
  },

  // ── Missions ─────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.primary90,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  missionCountBadge: {
    backgroundColor: theme.colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  missionCountText: {
    fontSize: 11,
    fontWeight: "900",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  missionList: {
    gap: 10,
    marginBottom: 28,
  },
  missionCard: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.black35,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  missionCardDone: {
    opacity: 0.55,
  },
  missionIcon: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  missionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  missionCategory: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.outline,
  },
  missionXP: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  doneCheck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary12,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  startBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primaryContainer,
  },
  startBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: theme.colors.onPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

});
