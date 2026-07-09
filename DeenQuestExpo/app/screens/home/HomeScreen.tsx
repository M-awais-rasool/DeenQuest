import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Flame,
  Trophy,
  Check,
  BookOpen,
  BookMarked,
  RotateCw,
  AudioLines,
  Feather,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { dq } from "../../theme/designTokens";
import {
  useGetDailyTasksQuery,
  useGetProgressQuery,
  useGetProfileQuery,
} from "../../store/services/api";
import type { DailyTask } from "../../store/services/api";
import type { AppStackParamList } from "../../navigators/navigationTypes";

// Icon shown on each mission row, keyed by the task's category.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  salah: Flame,
  quran: BookMarked,
  dhikr: RotateCw,
  learning: BookOpen,
  character: AudioLines,
  social: Check,
  reflection: Feather,
};

const XP_PER_LEVEL = 500;

// Day letters indexed by Date.getDay() (Sun..Sat). weekly_completions is
// relative to today (index 0 = 6 days ago, index 6 = today), so the labels are
// derived from real dates rather than a fixed Mon..Sun.
function buildWeek(): { letter: string; isToday: boolean }[] {
  const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { letter: LETTERS[d.getDay()] ?? "", isToday: i === 6 };
  });
}

const WEEK = buildWeek();

function rankWord(title?: string): string {
  const first = (title || "Seeker").trim().split(/\s+/)[0] || "Seeker";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export const HomeScreen = () => {
  const { data: tasksData, isLoading: tasksLoading } = useGetDailyTasksQuery();
  const { data: progressData } = useGetProgressQuery();
  const { data: profileData } = useGetProfileQuery();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const tasks = tasksData?.data ?? [];
  const progress = progressData?.data;
  const profile = profileData?.data;

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalXP = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const currentStreak = progress?.current_streak ?? 0;
  const longestStreak = progress?.longest_streak ?? currentStreak;
  const weeklyCompletions =
    progress?.weekly_completions ?? new Array(7).fill(false);

  const displayName =
    profile?.display_name || profile?.email?.split("@")[0] || "Explorer";
  const initial = displayName.charAt(0).toUpperCase();
  const xpInLevel = totalXP % XP_PER_LEVEL;
  const xpPct = (xpInLevel / XP_PER_LEVEL) * 100;

  const handleTaskPress = (task: DailyTask) => {
    navigation.navigate("DailyTaskDetail", { task });
  };

  return (
    <ScreenWrapper innerStyle={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <View style={styles.greetingRow}>
          <View style={{ gap: 2 }}>
            <Text style={styles.salaam}>Assalamu alaikum</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <View style={styles.avatarRing}>
            <LinearGradient
              colors={[dq.green, dq.greenDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* ── Streak hero ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroStreak}>
              <Flame size={30} color={dq.gold} />
              <View>
                <Text style={styles.heroStreakNum}>{currentStreak}</Text>
                <Text style={styles.heroStreakLabel}>day streak</Text>
              </View>
            </View>
            <View style={styles.bestPill}>
              <Trophy size={13} color={dq.gold} />
              <Text style={styles.bestText}>Best {longestStreak}</Text>
            </View>
          </View>

          {/* week dots */}
          <View style={styles.weekRow}>
            {WEEK.map((day, i) => {
              const done = weeklyCompletions[i] === true;
              const isToday = day.isToday;
              return (
                <View key={i} style={styles.dayCol}>
                  <Text
                    style={[
                      styles.dayLetter,
                      isToday && { color: dq.gold },
                    ]}
                  >
                    {day.letter}
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      done && styles.dayDotDone,
                      isToday && !done && styles.dayDotToday,
                      !done && !isToday && styles.dayDotEmpty,
                    ]}
                  >
                    {done ? (
                      <Check size={15} color={dq.onGreenAlt} />
                    ) : isToday ? (
                      <Flame size={14} color={dq.gold} />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {/* xp */}
          <View style={{ gap: 9 }}>
            <View style={styles.xpRow}>
              <Text style={styles.levelText}>
                Level {level} · {rankWord(profile?.title)}
              </Text>
              <Text style={styles.xpText}>
                {xpInLevel} / {XP_PER_LEVEL} XP
              </Text>
            </View>
            <View style={styles.xpTrack}>
              <LinearGradient
                colors={[dq.greenDark, dq.green]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: `${xpPct}%` }]}
              />
            </View>
          </View>
        </View>


        {/* ── Daily Missions ── */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Missions</Text>
            <View style={styles.missionCountPill}>
              <Text style={styles.missionCountText}>
                {completedCount} / {tasks.length}
              </Text>
            </View>
          </View>

          {tasksLoading ? (
            <Loader />
          ) : (
            <View style={styles.missionCard}>
              {tasks.map((task, i) => {
                const Icon = CATEGORY_ICONS[task.category] ?? Feather;
                const last = i === tasks.length - 1;
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => handleTaskPress(task)}
                    style={({ pressed }) => [
                      styles.missionRow,
                      !last && styles.missionRowBorder,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <View style={styles.missionIcon}>
                      <Icon size={18} color={dq.green} />
                    </View>
                    <View style={styles.missionBody}>
                      <Text style={styles.missionTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={styles.missionSub} numberOfLines={1}>
                        {task.description || task.category}
                      </Text>
                    </View>
                    {task.completed ? (
                      <View style={styles.missionCheck}>
                        <Check size={15} color={dq.onGreenAlt} />
                      </View>
                    ) : (
                      <View style={styles.missionXpPill}>
                        <Text style={styles.missionXpText}>
                          +{task.reward_xp} XP
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 90,
    gap: 20,
  },

  // Greeting
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  salaam: { fontSize: 13, fontWeight: "700", color: dq.muted },
  name: { fontSize: 22, fontWeight: "900", color: dq.white },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: dq.gold55,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "900", color: dq.onGreen },

  // Hero card
  heroCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    padding: 20,
    gap: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroStreak: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroStreakNum: { fontSize: 28, fontWeight: "900", color: dq.white, lineHeight: 28 },
  heroStreakLabel: { fontSize: 12, fontWeight: "700", color: dq.muted, marginTop: 2 },
  bestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: dq.gold12,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 99,
  },
  bestText: { fontSize: 12, fontWeight: "800", color: dq.gold },

  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayCol: { alignItems: "center", gap: 7 },
  dayLetter: { fontSize: 11, fontWeight: "800", color: dq.faint },
  dayDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotDone: { backgroundColor: dq.green },
  dayDotToday: {
    backgroundColor: dq.gold12,
    borderWidth: 2,
    borderColor: dq.gold,
  },
  dayDotEmpty: {
    backgroundColor: dq.lockFill,
    borderWidth: 1,
    borderColor: dq.lockBorder,
  },

  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelText: { fontSize: 13, fontWeight: "800", color: dq.text },
  xpText: { fontSize: 12, fontWeight: "700", color: dq.muted },
  xpTrack: {
    height: 10,
    borderRadius: 99,
    backgroundColor: dq.trackWhite06,
    overflow: "hidden",
  },
  xpFill: { height: "100%", borderRadius: 99 },

  // Missions
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: dq.white },
  missionCountPill: {
    backgroundColor: dq.trackGreenTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  missionCountText: { fontSize: 13, fontWeight: "800", color: dq.green },
  missionCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  missionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  missionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dq.rowBorder,
  },
  missionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: dq.trackGreenTint,
    alignItems: "center",
    justifyContent: "center",
  },
  missionBody: { flex: 1, gap: 1 },
  missionTitle: { fontSize: 14, fontWeight: "700", color: dq.text },
  missionSub: { fontSize: 12, fontWeight: "600", color: dq.muted },
  missionCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: dq.green,
    alignItems: "center",
    justifyContent: "center",
  },
  missionXpPill: {
    backgroundColor: dq.gold12,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 99,
  },
  missionXpText: { fontSize: 12, fontWeight: "800", color: dq.gold },
});
